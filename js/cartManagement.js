require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function getCartItem(userId, isOrder) {
    const selectQuery = `SELECT shopping_cart.cart_id, wish_list.wish_list_id FROM shopping_cart JOIN wish_list ON wish_list.user_id = ? WHERE shopping_cart.user_id = ?`;
	
    let resultRow = "";
	let lastRow;
	let subTotalPrice = 0;;
	let shippingPrice = 30;
	
    try {
        const cartIds = await queryAsync(selectQuery, [userId, userId]); // Wait for cart IDs query to finish
        for (const row of cartIds) {
            const selectCartQuery = `SELECT cart_item_id, quantity, product_id FROM cart_item WHERE cart_id = ?`;
            const cartItems = await queryAsync(selectCartQuery, [row.cart_id]); // Wait for cart items query to finish

            for (const row3 of cartItems) {
                const selectProductQuery = `SELECT product_name, product_price, product_display_image_url FROM product WHERE product_id = ?`;
                const products = await queryAsync(selectProductQuery, [row3.product_id]); // Wait for product details queryaf to finish
                products.forEach((row2) => {
					subTotalPrice += parseFloat(row2.product_price * parseFloat(row3.quantity));
					if (isOrder == "false") {
						resultRow += `<tr id="productGrid${row3.cart_item_id}">
							<td class="align-middle"><img src="${row2.product_display_image_url}" alt="" style="width: 50px;"> ${row2.product_name}</td>
							<td class="align-middle" name="productPrice">$${row2.product_price}</td>
							<td class="align-middle">
								<div class="input-group quantity mx-auto" style="width: 100px;">
									<div class="input-group-btn">
										<button onclick="changeItemStatus(-1, 'productGrid${row3.cart_item_id}', false)" class="btn btn-sm btn-primary btn-minus">
										<i class="fa fa-minus"></i>
										</button>
									</div>
									<input type="text" id="quantityproductGrid${row3.cart_item_id}" onchange="changeItemStatus(this.value, 'productGrid${row3.cart_item_id}', true)" class="form-control form-control-sm bg-secondary text-center" value="${row3.quantity}">
									<div class="input-group-btn">
										<button onclick="changeItemStatus(1, 'productGrid${row3.cart_item_id}', false)" class="btn btn-sm btn-primary btn-plus">
											<i class="fa fa-plus"></i>
										</button>
									</div>
								</div>
							</td>
							<td class="align-middle" name="productTotalPrice">$${parseFloat(row2.product_price) * parseFloat(row3.quantity)}</td>
							<td class="align-middle">
								<button onclick="changeItemStatus(0, 'productGrid${row3.cart_item_id}', true)" class="btn btn-sm btn-primary" title="Remove from shopping cart">
									<i class="fa fa-times"></i>
								</button>
								<button onclick="moveToWishListItem('${row3.cart_item_id}', '${row3.product_id}', '${row3.quantity}', '${row.wish_list_id}')" class="btn btn-sm btn-primary" title="Move to wish list">
									<i class="fas fa-list"></i>
								</button>
							</td>
						</tr>`;
					}
					else {
						resultRow += `<div class="d-flex justify-content-between">
									<p>${row2.product_name}</p>
									<p>$${row2.product_price} * ${row3.quantity}</p>
								</div>`;
								
						lastRow = `<div class="d-flex justify-content-between mb-3 pt-1">
									<h6 class="font-weight-medium">Subtotal</h6>
									<h6 class="font-weight-medium">$${subTotalPrice}</h6>
								</div>
								<div class="d-flex justify-content-between">
									<h6 class="font-weight-medium">Shipping</h6>
									<h6 class="font-weight-medium">$${shippingPrice}</h6>
								</div>`;
					}
                });
            }
        }
		
		if (resultRow == "")
			return "null";
		if (isOrder == "false") {
			
		}
		else {
			resultRow = `<h5 class="font-weight-medium mb-3">Products</h5>` + resultRow + lastRow + ":" + (subTotalPrice + shippingPrice);
		}
		return resultRow; // Return the fully populated resultRow
    } catch (err) {
		console.error(err);
        throw err; // Pass the error back to the calling function
    }
}

async function insertCartItem(productId, userId, quantity) {
	const selectQuery = `SELECT cart_id FROM shopping_cart WHERE user_id = ?`;
	
	try {
		let result = await queryAsync(selectQuery, [userId]);
		const cartId = result[0].cart_id;
		const selectCartItemQuery = `SELECT product_id, quantity FROM cart_item WHERE cart_id = ? and product_id = ?`;
		result = await queryAsync(selectCartItemQuery, [cartId, productId]);
		
		if (result.length > 0) {
			const updateQuery = `UPDATE cart_item SET quantity = ? WHERE cart_id = ? and product_id = ?`;
			result = await queryAsync(updateQuery, [parseFloat(result[0].quantity) + parseFloat(quantity), cartId, productId]);
			return "Add to cart successfully";
		}
		else {
			const updateQuery = `INSERT INTO cart_item (cart_id, product_id, quantity) VALUES (?, ?, ?)`;
			result = await queryAsync(updateQuery, [cartId, productId, quantity]);
			return "Add to cart successfully";
		}
	} catch (err) {
		console.error(err);
        throw err; // Pass the error back to the calling function
    }
}

async function modifyCartItem(productGridId, quantity) {
	let selectQuery = "";
	
	try {
		let result = "";
		if (quantity == '0') {
			selectQuery = `delete from cart_item where cart_item_id = ?`;
			result = await queryAsync(selectQuery, [productGridId.replace("productGrid", "")]);
		
		}
		else {
			selectQuery = `Update cart_item set quantity = ? where cart_item_id = ?`;
			result = await queryAsync(selectQuery, [quantity, productGridId.replace("productGrid", "")]);
		}
		
        return "update cart item successfully";
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

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

async function moveWishListItemToCart(userId, wishListItemId) {
    try {
		const insertQuery = `INSERT INTO cart_item (cart_id, product_id, quantity) SELECT c.cart_id, w.product_id, w.product_quantity FROM shopping_cart c JOIN wish_list_item w ON w.wish_list_item_id = ? WHERE c.user_id = ? ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`;
        const deleteQuery = `DELETE FROM wish_list_item WHERE wish_list_item_id = ?`;
        
		let result = await queryAsync(insertQuery, [wishListItemId, userId]);
        result = await queryAsync(deleteQuery, [wishListItemId]);
        
        return result;
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

module.exports = { 
	getCartItem,
	modifyCartItem,
	insertCartItem,
	moveWishListItemToCart,
 };
