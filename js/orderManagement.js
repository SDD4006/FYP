require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const crypto = require("crypto");
const stripe = require('stripe')(process.env.stripe);
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function deleteSecurityQuestion(admin, securityQuestionId) {
    try {
        const deleteQuery = `DELETE FROM security_questions WHERE question_id = ?`;
        const result = await queryAsync(deleteQuery, [securityQuestionId]);
        
        return result;
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function orderCartItem(userId, coupon = "", deliveryId) {
	
	if (!coupon) {
		coupon = "";
		if (coupon.trim() == "") {
			coupon = "";
		}
	}
	const today = new Date();
	const formattedToday = today.toISOString().split('T')[0];

	let selectCouponQuery = `SELECT * FROM coupon WHERE duration >= ? AND (coupon_target = "all" OR coupon_target = '${userId}') AND limit_use > 0 AND coupon_id = ?`;

	const couponResult = await queryAsync(selectCouponQuery, [formattedToday, coupon]);

	// Validate coupon
	if (couponResult.length === 0 && coupon !== "") {
		throw new Error("Coupon invalid");
	}
	
    try { 
		const selectQuery = `
			SELECT cart_item.cart_item_id, cart_item.quantity, product.product_id, product.product_name, product.product_price
			FROM shopping_cart 
			JOIN cart_item ON shopping_cart.cart_id = cart_item.cart_id 
			JOIN product ON product.product_id = cart_item.product_id
			WHERE shopping_cart.user_id = ?;
		`;
	
        const result = await queryAsync(selectQuery, [userId]);

        if (!result.length) {
			throw new Error("No items found in the cart.");
        }

		let totalAmount = "";
		if ( couponResult.length > 0 ) {
			if (couponResult[0].coupon_type == "persentage")
				totalAmount = result.reduce((sum, item) => sum + (parseFloat(item.product_price) * parseInt(item.quantity) * (parseFloat(couponResult[0].discount) / 100)), 0);
			else
				totalAmount = result.reduce((sum, item) => sum + (parseFloat(item.product_price) * parseInt(item.quantity)), 0);
		}
		else				
			totalAmount = result.reduce((sum, item) => sum + (parseFloat(item.product_price) * parseInt(item.quantity)), 0);
		
        const orderId = crypto.randomBytes(16).toString("hex"); // Reduced size for readability
		
		let insertOrderQuery = "";

		if ( couponResult.length > 0 ) {
			insertOrderQuery = `INSERT INTO orders(order_id, user_id, coupon_id, total_amount, status, delivery_id) VALUES (?, ?, ?, ?, 'pending', ?)`;
			await queryAsync(insertOrderQuery, [orderId, userId, coupon, totalAmount, deliveryId]);
		}
		else {       
			insertOrderQuery = `INSERT INTO orders(order_id, user_id, total_amount, status, delivery_id) VALUES (?, ?, ?, 'pending', ?)`;
			await queryAsync(insertOrderQuery, [orderId, userId, totalAmount, deliveryId]);
		}

		const orderItemsQueries = result.map(item => {
			const insertOrderItemsQueries = `INSERT INTO order_items(order_id, product_id, quantity, price, status) VALUES (?, ?, ?, ?, 'pending')`;
            return queryAsync(insertOrderItemsQueries, [orderId, item.product_id, item.quantity, item.product_price]);
        });

        await Promise.all(orderItemsQueries);

		const deleteQuery = `DELETE FROM cart_item WHERE cart_id IN (SELECT cart_id FROM shopping_cart WHERE user_id = '${userId}')`;
		await queryAsync(deleteQuery, [userId]);

        let lineItems = "";
		if ( couponResult.length > 0 ) {
			if ( couponResult[0].coupon_type == "persentage") {
				lineItems = result.map(item => ({
					price_data: {
						currency: "hkd",
						product_data: { name: item.product_name },
						unit_amount: parseFloat(item.product_price) * parseFloat(couponResult[0].discount) / 100 * 100,
					},
					quantity: parseInt(item.quantity),
				}));
			}
			else if ( couponResult[0].coupon_type == "amount") {
				lineItems = result.map(item => ({
					price_data: {
						currency: "hkd",
						product_data: { name: item.product_name },
						unit_amount: parseFloat(item.product_price) * 100,
					},
					quantity: parseInt(item.quantity),
				}));
				lineItems.push({
					price_data: {
						currency: "hkd",
						product_data: { name: "Discount" },
						unit_amount: -parseFloat(couponResult[0].discount) * 100, // Negative value to deduct $200 (Stripe uses cents)
					},
					quantity: 1,
				});
			}
		}
		else {
			lineItems = result.map(item => ({
				price_data: {
					currency: "hkd",
					product_data: { name: item.product_name },
					unit_amount: parseFloat(item.product_price) * 100,
				},
				quantity: parseInt(item.quantity),
			}));
		}
		lineItems.push({
			price_data: {
				currency: "hkd",
				product_data: { name: "Delivery fee" },
				unit_amount: 30 * 100, // Negative value to deduct $200 (Stripe uses cents)
			},
			quantity: 1,
		});
		
		const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: siteLink + "orderSuccess.html?order=" + orderId,
            cancel_url: siteLink + "orderCancel.html",
        });
		
        // Send response **only once**, after all queries complete
        return session.url;
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getOrderStatusWhenSuccessfully(order) {
	
	try {
		let selectQuery = `select transactions.*, orders.*, users_delivery.*, order_items.quantity, product.* from orders 
		JOIN order_items ON order_items.order_id = orders.order_id 
		JOIN product ON product.product_id = order_items.product_id 
		JOIN transactions ON transactions.order_id = ?
		JOIN users_delivery ON users_delivery.delivery_id = orders.delivery_id
		where orders.order_id = ?`;

		let resultRow = "";
		
		const result = await queryAsync(selectQuery, [order, order]);
		
		result.forEach((row) => {
			resultRow += `
				<a href="${row.product_url}">${row.product_name}</a> * ${row.quantity}<br>
			`;
		});

		if (!result[0])
			throw new Error("No order");
		
		resultRow = `<div class="container my-5">
					<div class="row justify-content-center">
						<div class="col-md-8">
							<table class="table table-bordered table-hover text-center" id="orderListTable">
								<thead class="bg-primary text-white">
									<tr>
										<th colspan="2">Order Detail</th>
									</tr>
								</thead>
								<tbody class="bg-primary text-white">
									<tr>
										<th colspan="2">Order ID: ${result[0].order_id}</th>
									</tr>
									<tr>
										<th colspan="2">Transaction ID: ${result[0].transaction_id}</th>
									</tr>
								</tbody>
								<tbody>
									<tr>
										<td>Item</td>
										<td>${resultRow}
											Delivery * 1</td>
									</tr>
									<tr>
										<td>Total Amount</td>
										<td>$${parseFloat(result[0].total_amount) + 30}</td>
									</tr>
									<tr>
										<td>Status</td>
										<td><label style="color:red">${result[0].status}</label></td>
									</tr>
									<tr>
										<td>Order DateTime</td>
										<td>${result[0].create_at}</td>
									</tr>
									<tr>
										<td>Transaction DateTime</td>
										<td>${result[0].transaction_date}</td>
									</tr>
								</tbody>
								<thead class="bg-primary text-white">
									<tr>
										<th colspan="2">Billing Address</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Name</td>
										<td>${result[0].last_name} ${result[0].first_name}</td>
									</tr>
									<tr>
										<td>Address 1</td>
										<td>${result[0].address1}</td>
									</tr>
									<tr>
										<td>Address 2</td>
										<td>${result[0].address1}</td>
									</tr>
									<tr>
										<td>City</td>
										<td>${result[0].city}</td>
									</tr>
									<tr>
										<td>City Area</td>
										<td>${result[0].city_area}</td>
									</tr>
									<tr>
										<td>Contact Phone Number</td>
										<td>${result[0].contact_phone}</td>
									</tr>
								</tbody>
							</table>
							<div class="d-flex justify-content-center mt-3">
								<button onclick="printOrder()" class="btn btn-primary">Print</button>
							</div>
						</div>
					</div>
				</div>`
		//resultRow = `<p><b>Order ID</b></p><p>${result[0].order_id}</p>` + resultRow + `<p><b>Total Amount</b></p><p>${result[0].total_amount}</p>`;
		return resultRow;	
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function updateOrderStatusWhenSuccess(order, action, userId) {
	const updateQuery = `UPDATE orders SET status = 'paid' WHERE order_id = ? AND status = 'pending'`;
	const updateQuery2 = `UPDATE order_items SET status = 'paid' WHERE order_id = ? AND status = 'pending'`;
	const updateQuery3 = `UPDATE coupon JOIN orders ON coupon.coupon_id = orders.coupon_id SET coupon.limit_use = coupon.limit_use - 1 WHERE orders.coupon_id IS NOT NULL AND orders.status = 'pending';`;
	const transactionId = crypto.randomBytes(30).toString("hex");
	const insertQuery = `INSERT INTO transactions (transaction_id, order_id, user_id, amount, status) SELECT ?, ?, ?, total_amount, 'paid' FROM orders WHERE order_id = ? AND NOT EXISTS ( SELECT 1 FROM transactions WHERE order_id = ? ); `;
	const insertQuery2 = `INSERT INTO coupon_usage (user_id, coupon_id, order_id) SELECT ?, coupon_id, order_id FROM orders WHERE coupon_id IS NOT NULL AND order_id = ?`;
	const selectQuery = `SELECT * FROM orders WHERE order_id = ? AND status = 'pending'`;
	
	try {
		const result = await queryAsync(selectQuery, [order]);
		
		if (result.length > 0) {
			await queryAsync(updateQuery3);
			await queryAsync(updateQuery, [order]);
			await queryAsync(updateQuery2, [order]);
			await queryAsync(insertQuery, [transactionId, order, userId, order, order]);
			await queryAsync(insertQuery2, [userId, order]);
			return 'insert successfully';
		}
		else {
			return 'check successfully';
		}
	} catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getOrder(userId) {
	const selectQuery = `
			SELECT orders.order_id, coupon.coupon_type, coupon.discount, orders.coupon_id, order_items.quantity, order_items.order_item_id, order_items.status, product.*
			FROM orders 
			JOIN order_items ON order_items.order_id = orders.order_id
			JOIN product ON product.product_id = order_items.product_id
			LEFT JOIN coupon ON coupon.coupon_id = orders.coupon_id
			WHERE orders.user_id = ?;
		`;
	const deleteQuery = `DELETE FROM orders WHERE order_id NOT IN (SELECT order_id FROM order_items);`;
	
	try {
		await queryAsync(deleteQuery);
		const result = await queryAsync(selectQuery, [userId]);
		let resultRow = "";
		let temp = "";
			
		let orderNum = 0;
		let orderid = 1;
		
		result.forEach((row) => {
			if (orderid != row.order_id) {
				orderNum++;
				orderid = row.order_id;
			}
			
			let priceAfterCal = parseFloat(row.product_price);
			
			if (row.coupon_id != null) {
				if (row.coupon_type == "persentage") {
					priceAfterCal = priceAfterCal * parseFloat(row.discount) / 100;
				}
			}
				
			temp += `<tr>
						<th>${orderNum}</th>
						<th><a href="${row.product_url}">${row.product_name}</a></th>
						<th>$${row.product_price}</th>
						<th>${row.quantity}</th>
						<th>$${parseInt(row.quantity) * priceAfterCal}</th>
						<th style="color:red">${row.status}</th>
						<th>
							${(row.status == "pending") ? `
							<label onclick="pay('${row.order_id}')" style="color: #d19c97">Pay</label><br>
							<label onclick="removeItem('${row.order_item_id}')" style="color: #d19c97">Remove</label><br>` :
							(row.status == "paid" || row.status == "shipped" || row.status == "delivered") ?
							`<a href="refund.html?orderItemId=${row.order_item_id}" style="color: #d19c97">Refund</a><br>` : ""}
							<a href="orderSuccess.html?order=${row.order_id}" target="_blank">Detail</a>
							</th>
					</tr>`;
		});
		
		if (temp != 0) {
			resultRow = `<table class="table table-bordered text-center mb-0">
					<thead class="bg-secondary text-dark">
						<tr>
							<th>Order No.</th>
							<th>Products</th>
							<th>Price</th>
							<th>Quantity</th>
							<th>Total</th>
							<th>Status</th>
							<th>Remove</th>
						</tr>
					</thead>
					<tbody class="align-middle" id="cartItemTable">` + temp + `</tbody>
				</table>`;
		}
		else {
			resultRow = `<h3><center>No order? <label onclick="window.location.href = 'shop.html'" style="color: red">Search</label> the things you need</center></h3>`;
		}
		return resultRow;
	} catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function removeItem(item) {
	try {
		let deleteQuery = `DELETE from order_items where order_item_id = ?`;
		const result = await queryAsync(deleteQuery, [item]);
		
		return 'successfully';
	} catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function adminGetOrder() {
	try {
	
		let selectQuery = `select * from orders`;
		const result = await queryAsync(selectQuery);

		let resultRow = "";
		result.forEach((row) => {
			resultRow += `<option id="${row.order_id}" data-coupon_id="${row.coupon_id}" data-total_amount="${row.total_amount}" data-order_status="${row.status}" data-create_at="${row.create_at}" data-update_at="${row.update_at}">ID:${row.order_id}, Customer: ${row.user_id}</option>`;
		});
		return resultRow;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function adminDeleteOrder(admin, orderId) {
	try {
		const deleteQuery = `DELETE FROM orders WHERE order_id = ?;`;
		const insertQuery = `INSERT INTO order_admin_management (admin_id, order_id, action) VALUES (?, ?, 'delete')`;
		await queryAsync(deleteQuery, orderId);
		await queryAsync(insertQuery, [admin, orderId]);

		return;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getOrderListForReturn(userId) {
	try {
		const selectQuery = `
			SELECT orders.order_id, coupon.coupon_type, coupon.discount, orders.coupon_id, order_items.quantity, order_items.order_item_id, order_items.status, product.*
			FROM orders 
			JOIN order_items ON order_items.order_id = orders.order_id
			JOIN product ON product.product_id = order_items.product_id
			LEFT JOIN coupon ON coupon.coupon_id = orders.coupon_id
			WHERE orders.user_id = ? AND order_items.status IN ('paid', 'shipped', 'delivered');
		`;	

		const result = await queryAsync(selectQuery, userId);

		return result;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function adminUpdateOrder(admin, orderId, totalAmount, orderStatus) {
	try {
		const updateQuery = `UPDATE orders SET total_amount = ?, status= ? WHERE order_id = ?`;
		const insertQuery = `INSERT INTO order_admin_management (admin_id, order_id, action) VALUES (?, ?, 'update')`;
		
		await queryAsync(updateQuery, [totalAmount, orderStatus, orderId]);
		await queryAsync(insertQuery, [admin, orderId]);

		return;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

module.exports = { 
	orderCartItem,
	updateOrderStatusWhenSuccess,
	getOrderStatusWhenSuccessfully,
	getOrder,
	removeItem,
	adminGetOrder,
	adminDeleteOrder,
	adminUpdateOrder,
	getOrderListForReturn,
 };
