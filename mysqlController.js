require('dotenv').config();
const mysql = require('mysql');
const util = require("util");
const crypto = require("crypto");
const stripe = require('stripe')('sk_test_51Qo2BgRvAcFq2AQeYhKDfJx2GLPzsO2xojsi55laFwrthN5mVjppEmh6lSTaYeqdygRjmvnJgRsDTEwnSkec0IIl00tGM3BEQ3');
const siteLink = process.env.siteLink;

// Create connection
const connection = mysql.createConnection({
    host: process.env.mysqlHost,     // Your database host
    user: process.env.mysqlUser,          // Your database user
    password: process.env.mysqlPassword,  // Your database password
    database: process.env.mysqlDatabase // Your database name
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL');
});

function createCoupon(callback, couponId, userId, couponTarget, name, description, couponType, discountAmount, couponUsageLimit, expirationDate, image_url) {
	const insertQuery = `INSERT INTO coupon (coupon_id, coupon_target, coupon_name, duration, coupon_type, discount, limit_use, description, image_url) VALUES ('${couponId}', '${couponTarget}', '${name}', '${expirationDate}', '${couponType}', '${discountAmount}', '${couponUsageLimit}', '${description}', '${image_url}')`;
	const insertQuery2 = `INSERT INTO coupon_admin_management (admin_id, coupon_id, action) VALUES ('${userId}', '${couponId}', 'create')`;

	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery2, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function createSecurityQuestion(callback, admin, securityQuestionContentInput) {
	const insertQuery = `INSERT INTO security_questions (question_content) VALUES ('${securityQuestionContentInput}')`;

	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function getHomeCarouselImage(callback) {
	const selectQuery = `SELECT * FROM home_page_layout_images`;
	let resultRow = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		
		for (let i = 0; i < result.length; i++) {
			resultRow += `<div class="carousel-item ${i == 0 ? "active" : ""}" style="height: 410px;">
					<img class="img-fluid" src="${result[i].image_path}" alt="carousel" id="carousel${result[i].image_id}">
					<div class="carousel-caption d-flex flex-column align-items-center justify-content-center">
						<div class="p-3" style="max-width: 700px;">
							<h4 class="text-light text-uppercase font-weight-medium mb-3">${result[i].image_title}</h4>
							<h3 class="display-4 text-white font-weight-semi-bold mb-4">${result[i].image_content}</h3>
							<a href="shop.html" class="btn btn-light py-2 px-3">${result[i].image_button_name}</a>
						</div>
					</div>
				</div>`;
		}
		callback(null, resultRow);
	});
}

function getCarouselImage(callback) {
	const selectQuery = `SELECT * FROM home_page_layout_images`;
	let resultRow = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.image_id }" data-image_path="${row.image_path}" data-image_title="${row.image_title}" data-image_content="${row.image_content}" data-create_at="${row.create_at}">ID: ${row.image_id }, Title: ${row.image_title}, Description: ${row.image_content}, Button Name: ${row.image_button_name}</option>`;

		});
		callback(null, resultRow);
	});
}

function createCarouselImage(callback, admin, image_path, image_title, image_content, carouselButtonName) {
	const insertQuery = `INSERT INTO home_page_layout_images (image_path, image_title, image_content, image_button_name) VALUES ('${image_path}', '${image_title}', '${image_content}', '${carouselButtonName}' )`;

	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function deleteCarouselImage(callback, admin, carouselImageId) {
	const deleteQuery = `DELETE FROM  home_page_layout_images WHERE image_id  = ${carouselImageId}`;

	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function deleteSecurityQuestion(callback, admin, securityQuestionId) {
	const deleteQuery = `DELETE FROM security_questions WHERE question_id = ${securityQuestionId}`;

	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function getSecurityQuestion(callback) {
	const selectQuery = `SELECT * FROM security_questions`;
	let resultRow = "";

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.question_id}" data-content="${row.question_content}">ID:${row.question_id}, Content: ${row.question_content}</option>`;

		});
		callback(null, resultRow);
	});
}

function userLogin(callback, userEmail, password) {
	const selectQuery = `SELECT * FROM user WHERE email="${userEmail}" and password="${password}"`;

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}

		if (result.length > 0)
			callback(null, result[0].user_id);
		else
			callback(null, "fail");
	});
}

function adminLogin(callback, userEmail, password) {
	const selectQuery = `SELECT * FROM admin WHERE email="${userEmail}" and password="${password}"`;

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}

		if (result.length > 0)
			callback(null, result[0].admin_id);
		else
			callback(null, "fail");
	});
}

function productPageGetProduct(callback, productId) {
	const selectQuery = `SELECT * FROM product WHERE product_id = '${productId}'`;
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		const jsonData = {
			productName: result[0].product_name,
			price: result[0].product_price,
			stockLevel: result[0].stock_level,
			description: result[0].product_description
		};
		callback(null, jsonData);
	});
}

function adminGetProduct(callback) {
	const selectQuery = `SELECT * FROM product`;
	let resultRow = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.product_id}" data-name="${row.product_name}" data-price="${row.product_price}" data-stock="${row.stock_level}" data-category="${row.categories_id}" data-description="${row.product_description}" value="${row.product_id}">ID: ${row.product_id}, Name: ${row.product_name}, Price: $${row.product_price}, Stock: ${row.stock_level}, Categories: ${row.categories_id}, Description: ${row.product_description}</option>`;

		});
		callback(null, resultRow);
	});
}
function adminDeleteProduct(callback, admin, product_id) {
	const deleteQuery = `DELETE FROM product WHERE product_id = '${product_id}'`;
	const insertQuery = `INSERT INTO product_admin_management (admin_id, product_id, action) VALUES ('${admin}', '${product_id}', 'delete')`;
	
	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function adminUpdateOrder(callback, admin, orderId, totalAmount, orderStatus) {
	const updateQuery = `UPDATE orders SET total_amount = '${totalAmount}', status= '${orderStatus}' WHERE order_id = '${orderId}'`;
	const insertQuery = `INSERT INTO order_admin_management (admin_id, order_id, action) VALUES ('${admin}', '${orderId}', 'update')`;
	
	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function adminDeleteOrder(callback, admin, orderId) {
	const updateQuery = `DELETE FROM orders WHERE order_id = '${orderId}';`;
	const insertQuery = `INSERT INTO order_admin_management (admin_id, order_id, action) VALUES ('${admin}', '${orderId}', 'delete')`;

	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function adminUpdateProduct(callback, admin, product_id, product_name, product_price, product_description, categories_id, stock_level) {
	const updateQuery = `UPDATE product SET product_name = '${product_name}', product_price = '${product_price}', product_description = '${product_description}', categories_id = '${categories_id}', stock_level = '${stock_level}' WHERE product_id = '${product_id}';`;
	const insertQuery = `INSERT INTO product_admin_management (admin_id, product_id, action) VALUES ('${admin}', '${product_id}', 'update')`;

	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function insertProduct(callback, admin, product_id, product_name, product_price, product_url, imageUrl, product_description, product_detail, categories_id, stock_level, detailFileNames, productDesplayIcon) {
	const insertQuery = `INSERT INTO product (product_id, product_name, product_price, product_url, product_display_image_url, product_description, product_detail, categories_id, stock_level) VALUES ('${product_id}', '${product_name}', '${product_price}', '${product_url}', '${imageUrl}', '${product_description}', '${product_detail}', '${categories_id}', '${stock_level}')`;
	const insertQuery3 = `INSERT INTO product_admin_management (admin_id, product_id, action) VALUES ('${admin}', '${product_id}', 'create')`;

	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		if (detailFileNames != null) {
			if (Array.isArray(detailFileNames)) {
				for (let i = 0; i < detailFileNames.length; i++) {
					let insertQuery2 = `INSERT INTO product_detail_image (product_detail_image_id, product_id, url) VALUES ('${detailFileNames[i]}', '${product_id}', '${siteLink + "products/" + product_id + "/images/" + detailFileNames[i]}')`;
					connection.query(insertQuery2, (err, result) => {
						if (err) {
							callback(err, null);
						}
						
					});
				}
			}
			else {
				let insertQuery2 = `INSERT INTO product_detail_image (product_detail_image_id, product_id, url) VALUES ('${detailFileNames}', '${product_id}', '${siteLink + "products/" + product_id +"/images/" + detailFileNames}')`;
				connection.query(insertQuery2, (err, result) => {
					if (err) {
						callback(err, null);
					}
					
				});
			}
		}
		if (productDesplayIcon != null) {
			if (Array.isArray(productDesplayIcon)) {
				for (let i = 0; i < productDesplayIcon.length; i++) {
					let insertQuery2 = `INSERT INTO product_icon (product_icon_id, product_id, url) VALUES ('${productDesplayIcon[i]}', '${product_id}', '${siteLink + "products/" + product_id +"/displayImages/" + productDesplayIcon[i]}')`;
					connection.query(insertQuery2, (err, result) => {
						if (err) {
							callback(err, null);
						}
						
					});
				}
			}
			else {
				let insertQuery2 = `INSERT INTO product_icon (product_icon_id, product_id, url) VALUES ('${productDesplayIcon}', '${product_id}', '${siteLink + "products/" + product_id +"/displayImages/" + productDesplayIcon}')`;
				connection.query(insertQuery2, (err, result) => {
					if (err) {
						callback(err, null);
					}
					
				});
			}
		}
		connection.query(insertQuery3, (err, result) => {
			if (err) {
				callback(err, null);
			}
		});
		callback(null, result);
	});
}

function getCoupon(callback) {
	const selectQuery = `SELECT * FROM coupon`;
	let resultRow = "";

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.coupon_id}" value="${row.coupon_id}">ID: ${row.coupon_id}, Name: ${row.coupon_name}, Expiration Date: ${row.duration}, Description: ${row.description}, Target: ${row.coupon_target}</option>`;

		});

		callback(null, resultRow);
	});
}

function reviewManagerGetProduct(callback) {
	const selectQuery = `SELECT * FROM product`;
	let resultRow = "";

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.product_id}" data-product_name="{$row.product_name}">ID: ${row.product_id}, Name: ${row.product_name}</option>`;

		});

		callback(null, resultRow);
	});
}

function reviewManagerGetReview(callback, product) {
	const selectQuery = `SELECT * FROM review where product_id = '${product}'`;
	let resultRow = "";

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.review_id}" data-content="${row.content}" data-author="${row.author}" data-status="${row.status}" data-modify_count="${row.modify_count}" data-create_at="${row.create_at}" data-last_update="${row.update_at}">ID: ${row.review_id}, Author: ${row.author}, Content: ${row.content}</option>`;

		});

		callback(null, resultRow);
	});
}

function insertCategories(callback, admin, categorieName, parentCategorie, categorieDescription) {
	const categorie_id = crypto.randomBytes(6).toString("hex");
	
	const insertQuery = `INSERT INTO categories (categories_id, categories_name, parent_categories_id, categories_description) VALUES ('${categorie_id}', '${categorieName}', '${parentCategorie}', '${categorieDescription}')`;
	const insertQuery2 = `INSERT INTO categories_admin_management (admin_id, categories_id, action) VALUES ('${admin}', '${categorie_id}', 'create')`;

	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery2, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function insertCartItem(callback, productId, userId, quantity) {
	const selectQuery = `SELECT cart_id FROM shopping_cart WHERE user_id = '${userId}'`;
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		
		const cartId = result[0].cart_id;
		const selectCartItemQuery = `SELECT product_id, quantity FROM cart_item WHERE cart_id = '${cartId}' and product_id = '${productId}'`;
		
		connection.query(selectCartItemQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			if (result.length > 0) {
				
				const updateQuery = `UPDATE cart_item SET quantity = ${parseFloat(result[0].quantity) + parseFloat(quantity)} WHERE cart_id = '${cartId}' and product_id = '${productId}'`;
				connection.query(updateQuery, (err, result) => {
					if (err) {
						callback(err, null);
					}
					callback(null, "Add to cart successfully");
				});
			}
			else {
				const insertQuery = `INSERT INTO cart_item (cart_id, product_id, quantity) VALUES ('${cartId}', '${productId}', '${quantity}')`;
				connection.query(insertQuery, (err, result) => {
					if (err) {
						callback(err, null);
					}
					callback(null, "Add to cart successfully");
				});
			}
		});
	});
}

function insertAdminRole(callback, name, description) {
	const insertQuery = `INSERT INTO admin_role (role_name, description) VALUES ('${name}', '${description}')`;
	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function insertAdmin(callback, admin, name, email, adminPassword, roleId, isActive) {
	const adminId = crypto.randomBytes(20).toString("hex");
	const selectQuery = `SELECT admin_id, email FROM admin WHERE admin_id='${adminId}' or email='${email}'`;
	const insertQuery = `INSERT INTO admin (admin_id, role_id, user_name, email, password, status) VALUES ('${adminId}', '${roleId}', '${name}', '${email}', '${adminPassword}', '${isActive}')`;
	const insertQuery2 = `INSERT INTO admin_admin_management (admin_id, affected_admin_id, action) VALUES ('${admin}', '${adminId}', 'create')`;

	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		if (result.length > 0) {
			callback(null, 'failure');
		}
		else {
			connection.query(insertQuery, (err, result) => {
				if (err) {
					callback(err, null);
				}
				connection.query(insertQuery2, (err, result) => {
					if (err) {
						callback(err, null);
					}
					callback(null, 'successfully');
				});
			});
		}
	});
}

function insertReview(callback, productId, userId, userIconUrl, userName, user_icon_url, reviewMessage, isActive) {
	const insertQuery = `INSERT INTO review (product_id, user_id, user_icon_url, author, content, status) VALUES ('${productId}', '${userId}', '${user_icon_url}', '${userName}', '${reviewMessage}', '${isActive}')`;

	let resultContent;

	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function createDelivery(callback, userId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode, isPrimary) {
	let isPrimary2 = (isPrimary == "true") ? 1 : 0;

	let insertQuery = `INSERT INTO users_delivery (delivery_id, user_id, first_name, last_name, contact_phone, contact_email, address1, address2, region, city_area, city, city_code, is_primary) VALUES ('${crypto.randomBytes(6).toString("hex")}', '${userId}', '${firstName}', '${lastName}', ${contactPhone}, '${contactEmail}', '${address1}', '${address2}', '${region}', '${cityArea}', '${city}', '${cityCode}', ${isPrimary2})`;
	const selectQuery = `SELECT * from users_delivery where user_id = "${userId}"`;
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		if (result.length < 1) {
			insertQuery = `INSERT INTO users_delivery (delivery_id, user_id, first_name, last_name, contact_phone, contact_email, address1, address2, region, city_area, city, city_code, is_primary) VALUES ('${crypto.randomBytes(6).toString("hex")}', '${userId}', '${firstName}', '${lastName}', ${contactPhone}, '${contactEmail}', '${address1}', '${address2}', '${region}', '${cityArea}', '${city}', '${cityCode}', 1)`;
		}
		result.forEach((row) => {
			if (row.is_primary == 1 && isPrimary2 == 1) {
				connection.query(`UPDATE users_delivery set is_primary = 0 WHERE delivery_id = '${row.delivery_id}'`, (err, result) => {
					if (err) {
						//callback(err, null);
					}
				});
			}
		});
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, "insert delivery successfully");
		});
	});
}

function getDelivery(callback, userId, isPrimary) {
	let isPrimary2 = (isPrimary == "true") ? 1 : 0;

	const selectQuery = `SELECT * from users_delivery where user_id = "${userId}"`;
	
	let resultRow = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			return;
			callback(err, null);
		}
		result.forEach((row) => {
			let checkBox = "";
			let temp = "";
			if (row.is_primary == 0) {
				checkBox = `<div class="custom-control custom-checkbox">
								<input type="checkbox" class="custom-control-input" id="isPrimaryDeliveryGroup${row.delivery_id}">
								<label class="custom-control-label" for="isPrimaryDeliveryGroup${row.delivery_id}"  data-toggle="collapse">Is Primary</label>
								<br>
							</div>`;
			}
			else {
				checkBox = `<div class="custom-control custom-checkbox">
					<input type="checkbox" checked class="custom-control-input" id="isPrimaryDeliveryGroup${row.delivery_id}">
					<label class="custom-control-label" for="isPrimaryDeliveryGroup${row.delivery_id}"  data-toggle="collapse">Is Primary</label>
					<br>
				</div>`;
			}
			
			temp = `
				<div style="display: flex; align-items: center;" data-toggle="collapse" data-target="#deliveryAddressDeliveryGroup${row.delivery_id}">
					<h4 class="font-weight-semi-bold mb-4">NAME: ${row.last_name} ${row.first_name}</h4>
					<label style="margin-left: auto;">${row.is_primary == 1? "PRIMARY + ": "+"}</label>
				</div>
				<div class="collapse mb-4" id="deliveryAddressDeliveryGroup${row.delivery_id}">
					<div class="row">
						<div class="col-md-6 form-group">
							<label>First Name</label>
							<input id="firstNameDeliveryGroup${row.delivery_id}" class="form-control" type="text" value="${row.first_name}">
						</div>
						<div class="col-md-6 form-group">
							<label>Last Name</label>
							<input id="lastNameDeliveryGroup${row.delivery_id}" class="form-control" type="text" value="${row.last_name}">
						</div>
						<div class="col-md-6 form-group">
							<label>E-mail</label>
							<input id="contactEmailDeliveryGroup${row.delivery_id}" class="form-control" type="email" placeholder="example@email.com" value="${row.contact_email}">
						</div>
						<div class="col-md-6 form-group">
							<label>Mobile No</label>
							<input id="contactPhoneDeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="+852 1234 5678" value="${row.contact_phone}">
						</div>
						<div class="col-md-6 form-group">
							<label>Address Line 1</label>
							<input id="address1DeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="123 Street" value="${row.address1}">
						</div>
						<div class="col-md-6 form-group">
							<label>Address Line 2</label>
							<input id="address2DeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="123 Street" value="${row.address2}">
						</div>
						<div class="col-md-6 form-group">
							<label>Country</label>
							<select class="custom-select" id="regionDeliveryGroup${row.delivery_id}" disabled>
								<option selected>China</option>
							</select>
						</div>
						<div class="col-md-6 form-group">
							<label>City</label>
							<input id="cityDeliveryGroup${row.delivery_id}" class="form-control" type="text" value="Hong Kong" placeholder="Hong Kong" disabled>
						</div>
						<div class="col-md-6 form-group">
							<label>Area</label>
							<select class="custom-select" id="cityAreaDeliveryGroup${row.delivery_id}">
								${row.city_area == 'New Territories' ? '<option selected>New Territories</option><option>Kowloon</option><option>Hong Kong Island</option>': 
								row.city_area == 'Kowloon' ? '<option>New Territories</option><option selected>Kowloon</option><option>Hong Kong Island</option>': 
								'<option>Hong Kong Island</option><option>Kowloon</option><option selected>Hong Kong Island</option>'}
							</select>
						</div>
						<div class="col-md-6 form-group" hidden>
							<label>ZIP Code</label>
							<input id="cityCodeDeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="123">
						</div>
						<div class="col-md-6 form-group">
						</div>
						<div class="col-md-6 form-group">` + 
							checkBox + 
						`</div>
						<div class="col-md-12 form-group">
							<div class="card-footer border-secondary bg-transparent">
								<button class="btn btn-lg btn-block btn-primary font-weight-bold my-3 py-3" onclick="updateAddress('${row.delivery_id}')">Save Delivery</button>
							</div>
						</div>
					</div>
				</div><hr>`;
			
			if (row.is_primary == 0) {
				resultRow += temp;
			}
			else {
				resultRow = temp + resultRow;
			}
		});
		callback(null, resultRow);
	});
}

function getPageProduct(callback, page, minPrice, maxPrice, method, productName, productCategory, keywords) {
	const maxNum = (page - 1) * 20 + 20;
	const minNum = (page - 1) * 20;
	let selectQuery = `select count(*) as product_Count from product order by create_at desc limit ${maxNum} offset ${minNum};`;
	let selectQuery2 = `select * from product order by create_at desc limit ${maxNum} offset ${minNum};`;
	let productNum;
	let resultRow = "";
	let productCount;
	
	if (productCategory != null && productCategory != "null") {
		selectQuery = `select count(*) as product_Count from product where categories_id = '${productCategory}' order by create_at desc limit ${maxNum} offset ${minNum};`;
		selectQuery2 = `select * from product where categories_id = '${productCategory}' order by create_at desc limit ${maxNum} offset ${minNum};`;
	}

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		if (result.length > 0)
			productCount = result[0].product_Count;
		else 
			productCount = 0;
	});
	connection.query(selectQuery2, (err, result) => {
		if (err) {
			callback(err, null);
		}
		
		result.forEach((row) => {
			let pageContent = `<div class="col-lg-2 col-md-6 col-sm-12 pb-1">
				<div class="card product-item border-0 mb-4">
					<div class="card-header product-img position-relative overflow-hidden bg-transparent border p-0">
						<a href="${row.product_url}" target="_blank"><img class="img-fluid w-100" src="${row.product_display_image_url}" style="height=200px; min-height: 200px; max-height: 200px;" alt=""></a>
					</div>
					<div class="card-body border-left border-right text-center p-0 pt-4 pb-3">
						<h6 class="text-truncate mb-3">${row.product_name}</h6>
						<div class="d-flex justify-content-center">
							<h6>$${row.product_price}</h6><h6 class="text-muted ml-2"></h6>
						</div>
					</div>
					<div class="card-footer d-flex justify-content-between bg-light border">
						<a href="${row.product_url}" target="_blank" class="btn btn-sm text-dark p-0"><i class="fas fa-eye text-primary mr-1"></i></a>
						<a onclick="addToCart('${row.product_id}')" class="btn btn-sm text-dark p-0"><i class="fas fa-shopping-cart text-primary mr-1"></i></a>
					</div>
				</div>
			</div>`;
			productNum = row.total_record;
			
			if (keywords != "null") {
				if (row.product_name.includes(keywords) || row.product_description.includes(keywords) || row.product_detail.includes(keywords))
					resultRow += pageContent;
			}
			else 
				resultRow += pageContent;
		});
			
			const pageLinkContent = `<div class="col-12 pb-1">
				<nav aria-label="Page navigation">
				  <ul class="pagination justify-content-center mb-3">
				  ${(parseFloat(page) - 1 !== 0)
					? `<li class="page-item">`
					: `<li class="page-item disabled">`
				   }
					  <a class="page-link" onclick="paging(${parseFloat(page) - 1})" aria-label="Previous">
						<span aria-hidden="true"><</span>
						<span class="sr-only">Previous</span>
					  </a>
					</li>
					${(parseFloat(page) - 1 !== 0)
						? `<li class="page-item"><a class="page-link" onclick="paging(${parseFloat(page) - 1})">${parseFloat(page) - 1}</a></li>`
						: ''
					}

					<li class="page-item active"><a class="page-link" onclick="paging(${parseFloat(page)})">${parseFloat(page)}</a></li>
					${(page * 20 < productCount)
						? `<li class="page-item"><a class="page-link" onclick="paging(${parseFloat(page) + 1}) + ''">${parseFloat(page) + 1}</a></li>
						<li class="page-item">	
						  <a class="page-link" onclick="paging(${parseFloat(page) + 1})" aria-label="Next">
							<span aria-hidden="true">></span>
							<span class="sr-only">Next</span>
						  </a>
						</li>`
						: ''
					}
				  </ul>
				</nav>
			</div>`;
		resultRow += pageLinkContent;
		callback(null, resultRow);
	});
}

function getAdminRole(callback) {
	let selectQuery = `select role_id, role_name, description from admin_role`;

	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.role_id}">id:${row.role_id}, Name: ${row.role_name}, Description: ${row.description}</option>`;
		});
		callback(null, resultRow);
	});
}

function getOrderDelivery(callback, userId) {
	let selectQuery = `SELECT * from users_delivery where user_id = "${userId}" and is_primary=1`;

	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow = `
					<div class="row" id="deliveryAddressDeliveryGroup" data-delivery_id="${row.delivery_id}">
						<div class="col-md-6 form-group">
							<label>First Name</label>
							<input id="firstNameDeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled value="${row.first_name}">
						</div>
						<div class="col-md-6 form-group">
							<label>Last Name</label>
							<input id="lastNameDeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled value="${row.last_name}">
						</div>
						<div class="col-md-6 form-group">
							<label>E-mail</label>
							<input id="contactEmailDeliveryGroup${row.delivery_id}" class="form-control" type="email" disabled placeholder="example@email.com" value="${row.contact_email}">
						</div>
						<div class="col-md-6 form-group">
							<label>Mobile No</label>
							<input id="contactPhoneDeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled placeholder="+852 1234 5678" value="${row.contact_phone}">
						</div>
						<div class="col-md-6 form-group">
							<label>Address Line 1</label>
							<input id="address1DeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled placeholder="123 Street" value="${row.address1}">
						</div>
						<div class="col-md-6 form-group">
							<label>Address Line 2</label>
							<input id="address2DeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled placeholder="123 Street" value="${row.address2}">
						</div>
						<div class="col-md-6 form-group">
							<label>Country</label>
							<select class="custom-select" id="regionDeliveryGroup${row.delivery_id}" disabled>
								<option selected>China</option>
							</select>
						</div>
						<div class="col-md-6 form-group">
							<label>City</label>
							<input id="cityDeliveryGroup${row.delivery_id}" class="form-control" type="text" value="Hong Kong" placeholder="Hong Kong" disabled>
						</div>
						<div class="col-md-6 form-group">
							<label>Area</label>
							<select disabled class="custom-select" id="cityAreaDeliveryGroup${row.delivery_id}">
								${row.city_area == 'New Territories' ? '<option selected>New Territories</option><option>Kowloon</option><option>Hong Kong Island</option>': 
								row.city_area == 'Kowloon' ? '<option>New Territories</option><option selected>Kowloon</option><option>Hong Kong Island</option>': 
								'<option>Hong Kong Island</option><option>Kowloon</option><option selected>Hong Kong Island</option>'}
							</select>
						</div>
						<div class="col-md-6 form-group" hidden>
							<label>ZIP Code</label>
							<input id="cityCodeDeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="123">
						</div>
						<div class="col-md-6 form-group">
						</div>
					</div>`;
		});
		callback(null, resultRow);
	});
}

function modifyCartItem(callback, productGridId, quantity) {
	let selectQuery = "";
	
	if (quantity == '0')
		selectQuery = `delete from cart_item where cart_item_id = '${productGridId.replace("productGrid", "")}'`;
	else
		selectQuery = `Update cart_item set quantity="${quantity}" where cart_item_id = '${productGridId.replace("productGrid", "")}'`;
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, "update cart item successfully");
	});
}

async function payOrder(callback, userId, order) {
	const selectQuery = `SELECT order_items.*, product.*, coupon.*, orders.coupon_id FROM order_items 
	JOIN product ON product.product_id = order_items.product_id 
	JOIN orders ON orders.order_id = '${order}' 
	LEFT JOIN coupon ON coupon.coupon_id = orders.coupon_id where orders.order_id = '${order}'`;
	connection.query(selectQuery, async (err, result) => {
		if (err) {
			callback(err, null);
		}

		let lineItems = result.map(item => ({
			price_data: {
				currency: "hkd",
				product_data: { name: item.product_name },
				unit_amount: item.coupon_id == null ? parseFloat(item.price) * 100 : item.coupon_type == "persentage" ? parseFloat(item.discount) * parseFloat(item.price) : parseFloat(item.price) * 100,
			},
			quantity: parseInt(item.quantity),
		}));
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
			success_url: siteLink + "orderSuccess.html?order=" + order,
			cancel_url: siteLink + "orderCancel.html",
		});
		callback(null, session.url);
	});
}

async function orderCartItem(callback, userId, coupon = "", deliveryId) {
	
	if (!coupon) {
		coupon = "";
		if (coupon.trim() == "") {
			coupon = "";
		}
	}
	const today = new Date();
	const formattedToday = today.toISOString().split('T')[0];

	let selectCouponQuery = `SELECT * FROM coupon WHERE duration >= '${formattedToday}' AND (coupon_target = "all" OR coupon_target = '${userId}') AND limit_use > 0 AND coupon_id = '${coupon}'`;
	
	const queryAsync = util.promisify(connection.query).bind(connection);
	const couponResult = await queryAsync(selectCouponQuery);

	// Validate coupon
	if (couponResult.length === 0 && coupon !== "") {
		return callback(null, "Coupon invalid");
	}

    const selectQuery = `
        SELECT cart_item.cart_item_id, cart_item.quantity, product.product_id, product.product_name, product.product_price
        FROM shopping_cart 
        JOIN cart_item ON shopping_cart.cart_id = cart_item.cart_id 
        JOIN product ON product.product_id = cart_item.product_id
        WHERE shopping_cart.user_id = '${userId}';
    `;
	
    try {
        const queryAsync = util.promisify(connection.query).bind(connection);
        const result = await queryAsync(selectQuery);

        if (!result.length) {
            return callback(null, "No items found in the cart.");
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
			insertOrderQuery = `INSERT INTO orders(order_id, user_id, coupon_id, total_amount, status, delivery_id) VALUES ('${orderId}', '${userId}', '${coupon}', ${totalAmount}, 'pending', '${deliveryId}')`;
		}
		else {       
			insertOrderQuery = `INSERT INTO orders(order_id, user_id, total_amount, status, delivery_id) VALUES ('${orderId}', '${userId}', ${totalAmount}, 'pending', '${deliveryId}')`;
		}

		await queryAsync(insertOrderQuery);

        // Insert all order items in parallel
		const orderItemsQueries = result.map(item => {
            return queryAsync(`INSERT INTO order_items(order_id, product_id, quantity, price, status) VALUES ('${orderId}', '${item.product_id}', ${item.quantity}, ${item.product_price}, 'pending')`);
        });

        await Promise.all(orderItemsQueries);

		const deleteQuery = `DELETE FROM cart_item WHERE cart_id IN (SELECT cart_id FROM shopping_cart WHERE user_id = '${userId}')`;
		connection.query(deleteQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
		});

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
        callback(null, session.url);
    } catch (error) {
        callback(error, null);
    }
}



function updateDelivery(callback, userId, deliveryId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode2, isPrimary) {
	const isPrimary2 = (isPrimary == "true") ? 1 : 0;
	
	let updateQuery = `Update users_delivery set first_name="${firstName}", last_name="${lastName}", contact_phone=${contactPhone}, contact_email='${contactEmail}', address1='${address1}', address2='${address2}', region='${region}', city_area='${cityArea}', city='${city}', city_code=${cityCode2}, is_primary=${isPrimary2} where delivery_id = ${deliveryId}`;
	
	const selectQuery = `SELECT * from users_delivery where user_id = "${userId}"`;
	let temp = false;
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		for (let i = 0; i < result.length; i++) {
			if (isPrimary2 == 1) {
				if (result[i].is_primary == 1) {
					connection.query(`UPDATE users_delivery set is_primary = 0 WHERE delivery_id = ${result[i].delivery_id}`, (err, result) => {
						if (err) {
							//callback(err, null);
						}
					});
				}
			}
			else {
				if (result[i].is_primary == 1) {
					temp = true;
				}
			}
		}
		
		if (temp == false) {
			updateQuery = `Update users_delivery set first_name="${firstName}", last_name="${lastName}", contact_phone=${contactPhone}, contact_email='${contactEmail}', address1='${address1}', address2='${address2}', region='${region}', city_area='${cityArea}', city='${city}', city_code=${cityCode2}, is_primary=1 where delivery_id = ${deliveryId}`;
		}
		
		connection.query(updateQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, "update delivery successfully");
		});
	});
}

async function getCartItem(userId, isOrder) {
    const query = util.promisify(connection.query).bind(connection); // Promisify 'query' for easier async handling
    const selectQuery = `SELECT cart_id FROM shopping_cart WHERE user_id = '${userId}'`;
	
    let resultRow = "";
	let lastRow;
	let subTotalPrice = 0;;
	let shippingPrice = 30;
	
    try {
        const cartIds = await query(selectQuery); // Wait for cart IDs query to finish
        for (const row of cartIds) {
            const selectCartQuery = `SELECT cart_item_id, quantity, product_id FROM cart_item WHERE cart_id = '${row.cart_id}'`;
            const cartItems = await query(selectCartQuery); // Wait for cart items query to finish

            for (const row3 of cartItems) {
                const selectProductQuery = `SELECT product_name, product_price, product_display_image_url FROM product WHERE product_id = '${row3.product_id}'`;
                const products = await query(selectProductQuery); // Wait for product details queryaf to finish
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
							<td class="align-middle"><button onclick="changeItemStatus(0, 'productGrid${row3.cart_item_id}', true)" class="btn btn-sm btn-primary"><i class="fa fa-times"></i></button></td>
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
        throw err; // Pass the error back to the calling function
    }
}

function getReview(callback, productId) {
	let selectQuery = `select * from review where product_id = '${productId}'`;

	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {			
			let reviewContent = row.content;
			let textBefore;
			let textAfter;
			for (let i = 0; i < reviewContent.length; i++) {
				if (i % 30 == 0) {
					textBefore = reviewContent.substring(0, i);
					textAfter = reviewContent.substring(i);
					reviewContent = textBefore + "\n" + textAfter;
				}
			}
			
			resultRow = `<div class="media mb-4">
				<img src="${row.user_icon_url}" alt="Image" class="img-fluid mr-3 mt-1" style="width: 45px;">
				<div class="media-body">
					<h6>${row.author}<small> - <i>${row.update_at}</i></small></h6>
					<div class="text-primary mb-2">
						<i class="fas fa-star"></i>
						<i class="fas fa-star"></i>
						<i class="fas fa-star"></i>
						<i class="fas fa-star-half-alt"></i>
						<i class="far fa-star"></i>
					</div>
					<p id="${row.review_id}">${reviewContent}</p>
				</div>
			</div>` + resultRow;
		});
		callback(null, resultRow);
	});
}

function adminGetOrder(callback) {
	let selectQuery = `select * from orders`;

	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.order_id}" data-coupon_id="${row.coupon_id}" data-total_amount="${row.total_amount}" data-order_status="${row.status}" data-create_at="${row.create_at}" data-update_at="${row.update_at}">ID:${row.order_id}, Customer: ${row.user_id}</option>`;
		});
		callback(null, resultRow);
	});
}

function getAdmin(callback) {
	let selectQuery = `select * from admin`;

	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.admin_id}">Email: ${row.email}, Name: ${row.user_name}</option>`;
		});
		callback(null, resultRow);
	});
}

function userGetCoupon(callback, userId) {
	const today = new Date();
	const formattedToday = today.toISOString().split('T')[0];

	let selectQuery = `SELECT * FROM coupon WHERE duration >= '${formattedToday}' AND limit_use > 0 AND (coupon_target = "all" OR coupon_target = '${userId}')`;
	let resultRow = "";

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			let couponType = "";
			if (row.coupon_type == "persentage")
				couponType = row.discount + "% ON";
			if (row.coupon_type == "amount")
				couponType = "-$" + row.discount;

			resultRow += `<option id="${row.coupon_id}" value="${row.coupon_id}" data-coupon_type="${row.coupon_type}" data-discount="${row.discount}">Discount ${couponType}</option>`;
		});
		callback(null, resultRow);
	});
}

function userUseCoupon(callback, userId, couponId) {
	let selectQuery = `SELECT * FROM coupon WHERE coupon_id = '${couponId}' AND limit_use > 0 AND (coupon_target = "all" OR coupon_target = '${userId}')`;

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.coupon_id}" value="${row.coupon_id}">${row.coupon_id}</option>`;
		});
		callback(null, result);
	});
}

function insertUser(callback, adminId, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer) {
	const userId = crypto.randomBytes(50).toString("hex");
	
	const insertQuery = `INSERT INTO user (user_id, secuity_question_id, secuity_question_answer, email, password, status) VALUES ('${userId}', ${userSecuityQuestionSelection}, '${userSecuityQuestionAnswer}', '${userEmail}', '${userPassword}', '${userStatusSelection}')`;
	const insertQuery2 = `INSERT INTO user_admin_management (admin_id, user_id, action) VALUES ('${adminId}', '${userId}', 'create')`;


	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery2, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function updateReviewStatus(callback, admin, review, reviewContent, reviewStatus, modifyCount, oldContent) {
	const updateQuery = `UPDATE review SET content = '${reviewContent}', status = '${reviewStatus}', modify_count = '${modifyCount}' WHERE review_id = '${review}';`;
	const insertQuery = `INSERT INTO review_admin_management (admin_id, review_id, action, modified_review_content, old_review_content) VALUES ('${admin}', '${review}', 'update', '${reviewContent}', '${oldContent}')`;

	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function deleteReview(callback, admin, review, oldContent, user_id) {
	const updateQuery = `DELETE FROM review WHERE review_id = '${review}';`;
	const insertQuery = `INSERT INTO review_admin_management (admin_id, review_id, action, old_review_content, user_id) VALUES ('${admin}', '${review}', 'delete', '${oldContent}', '${user_id}')`;

	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function updateUser(adminId, userId, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer) {
	const updateQuery = `UPDATE user SET secuity_question_id = ${userSecuityQuestionSelection}, secuity_question_answer = '${userSecuityQuestionAnswer}', email = '${userEmail}', password = '${userPassword}', status = '${userStatusSelection}' WHERE user_id = '${userId}';`;
	const insertQuery = `INSERT INTO user_admin_management (admin_id, user_id, action) VALUES ('${adminId}', '${userId}', 'update')`;

	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function getUser(callback) {
	const selectQuery = `SELECT * FROM user`;

	let resultRow = "";

	let index = 0;
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${index}" data-user_id='${row.user_id}' data-status_id='${row.status == "Active" ? 0 : row.status == "Inactive" ? 1 : 2}' data-secuity_question_id='${row.secuity_question_id}'  data-secuity_question_answer='${row.secuity_question_answer}'  data-email='${row.email}'  data-password='${row.password}'  data-status='${row.status}'  data-create_at='${row.create_at}'  data-last_login='${row.last_login}'>User ID: ${row.user_id}, Email: ${row.email}</option>`;
			index++;
		});
		
		callback(null, resultRow);
	});
}

function deleteUser(callback, adminId, userId) {
	const deleteQuery = `Delete from user where user_id = '${userId}'`;	
	const insertQuery = `INSERT INTO user_admin_management (admin_id, user_id, action) VALUES ('${adminId}', '${userId}', 'delete')`;
	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function deleteCoupon(callback, userId, couponId) {
	const deleteQuery = `Delete from coupon where coupon_id = '${couponId}'`;	
	const insertQuery = `INSERT INTO coupon_admin_management (admin_id, coupon_id, action) VALUES ('${userId}', '${couponId}', 'delete')`;

	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function deleteAdmin(callback, operatedAdmin, adminId) {
	let deleteQuery = `Delete from admin where admin_id = '${adminId}'`;
	let insertQuery = `INSERT INTO admin_admin_management (admin_id, affected_admin_id, action) VALUES ('${operatedAdmin}', '${adminId}', 'delete')`;

	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function deleteRole(callback, roleId) {
	let deleteQuery = `Delete from admin_role where role_id = ${roleId}`;

	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function getDataByDate(callback, dateA, dateB, type) {
	const newDateA = new Date(dateA);
	const newDateB = new Date(dateB);
	
	const yearA = newDateA.getFullYear();
	const monthA = newDateA.getMonth() + 1
	const yearB = newDateB.getFullYear();
	const monthB = newDateB.getMonth() + 1
	
	let selectQuery = ""

	if (type == "pageView") {
		selectQuery = `SELECT COUNT(page_views_id) as total_views, DATE_FORMAT(view_date, '%Y-%m') AS new_view_date from page_views where YEAR(view_date) >= ${yearA} OR (YEAR(view_date) < ${yearA} AND MONTH(view_date) >= ${monthA}) AND YEAR(view_date) <= ${yearB} AND MONTH(view_date) <= ${monthB} GROUP BY new_view_date`;
	}
	else if (type == "revenue") {
		selectQuery = `SELECT SUM(amount) as total_amount, DATE_FORMAT(transaction_date, '%Y-%m') AS new_transaction_date from transactions where YEAR(transaction_date) >= ${yearA} OR (YEAR(transaction_date) < ${yearA} AND MONTH(transaction_date) >= ${monthA}) AND YEAR(transaction_date) <= ${yearB} AND MONTH(transaction_date) <= ${monthB} GROUP BY new_transaction_date`;
	}
	else if (type == "user") {
		selectQuery = `SELECT COUNT(user_id) as total_amount, DATE_FORMAT(create_at, '%Y-%m') AS new_create_date from user where YEAR(create_at) >= ${yearA} OR (YEAR(create_at) < ${yearA} AND MONTH(create_at) >= ${monthA}) AND YEAR(create_at) <= ${yearB} AND MONTH(create_at) <= ${monthB} GROUP BY new_create_date`;
	}
	else {
		return;
	}

	connection.query(selectQuery, (err, result) => {
		if (err) {
			console.log(err);
			return;
			callback(err, null);
		}
		callback(null, result);
	});
}

function getTopProduct(callback, date) {
	
	const selectQuery = `SELECT COUNT(order_items.product_id) AS productCount, SUM(order_items.quantity) AS totalQuantity, DATE_FORMAT(order_items.create_at, '%Y-%m-%d') AS newDate, product.product_name, product.product_url, product.product_display_image_url FROM order_items JOIN product ON product.product_id = order_items.product_id where DATE_FORMAT(order_items.create_at, '%Y-%m-%d') = '${date}' group by newDate, product.product_name, product.product_display_image_url`;

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function getPageView(callback, unique, page, date) {
	
	let selectQuery = ``;
	if (page == 'all') {
		if (unique == 'false') {
			selectQuery = `SELECT page_url, COUNT(*) AS views FROM page_views where view_date = '${date}' group by page_url`;
		}
		else {
			selectQuery = `SELECT page_url, COUNT(DISTINCT ip_address) AS views FROM page_views where view_date = '${date}' group by page_url`;		
		}
	}
	else {
		if (unique == 'false') {
			selectQuery = `SELECT page_url, COUNT(*) AS views FROM page_views WHERE view_date = '${date}' and page_url = '${page}'`;
		}
		else {
			selectQuery = `SELECT page_url, COUNT(DISTINCT ip_address) AS views FROM page_views where view_date = '${date}' and page_url = '${page}'`;		
		}
	}
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function updatePageView(callback, userId, page, userIp, dateString) {
	//let updateQuery = `INSERT INTO page_views (page_url, view_date, total_views) VALUES ('${page}', ${new Date()}, 1) ON DUPLICATE KEY UPDATE total_views = total_views + 1;`;
	let updateQuery = `INSERT INTO page_views (page_url, user_id, view_date, ip_address) VALUES ('${page}', '${userId}', '${dateString}', '${userIp}')`;

	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function updateCategories(callback, admin, action, categorieId, categorieName, parentCategorie, categorieDescription) {
	let updateQuery = "";
	let insertQuery2 = "";
	
	if (action == "update") {
		updateQuery = `UPDATE categories set categories_name='${categorieName}', parent_categories_id='${parentCategorie}', categories_description='${categorieDescription}' where categories_id=${categorieId}`;
		insertQuery2 = `INSERT INTO categories_admin_management (admin_id, categories_id, action) VALUES ('${admin}', '${categorieId}', 'update')`;

	}
	else if (action == "delete") {
		updateQuery = `DELETE FROM categories WHERE categories_id="${categorieId}"`;
		insertQuery2 = `INSERT INTO categories_admin_management (admin_id, categories_id, action) VALUES ('${admin}', '${categorieId}', 'delete')`;

	}
	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(insertQuery2, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, result);
		});
	});
}

function updateRefundAndReturn(callback, userId, refundId, refundStatus, returnId, returnStatus) {
	const updateQuery = `UPDATE refund set status='${refundStatus}' where refund_id = '${refundId}'`;
	const insertQuery = `INSERT INTO refund_admin_management (admin_id, refund_id, action, updated_status) VALUES ('${userId}', '${refundId}', 'update', '${refundStatus}')`;
	const selectQuery = `SELECT order_item_id FROM refund WHERE refund_id = '${refundId}'`;
	
	connection.query(selectQuery, (err, selectedResult) => {
		if (err) {
			console.log(err);
						return;
			callback(err, null);
		}
		connection.query(updateQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			connection.query(insertQuery, (err, result) => {
				if (err) {
					console.log(err);
						return;
					callback(err, null);
				}
				let orderItemsRefundStatus = "";
				if (refundStatus == "approve")
					orderItemsRefundStatus = "refundApproved"
				else if (refundStatus == "reject")
					orderItemsRefundStatus = "refundRejected"
				
				const updateQuery3 = `UPDATE order_items set status='${orderItemsRefundStatus}' where order_item_id = '${selectedResult[0].order_item_id}'`;
				connection.query(updateQuery3, (err, result) => {
					if (err) {
						console.log(err);
						return;
						callback(err, null);
					}
					if (returnId == "undefined" || returnStatus == "null") {
						callback(null, result);
					}
					else {
						const updateQuery2 = `UPDATE return_item set status='${returnStatus}' where return_id = '${returnId}'`;
						const insertQuery2 = `INSERT INTO return_admin_management (admin_id, return_id, action, updated_status) VALUES ('${userId}', '${returnId}', 'update', '${returnStatus}')`;
						connection.query(updateQuery2, (err, result) => {
							if (err) {
								callback(err, null);
							}
							connection.query(insertQuery2, (err, result) => {
								if (err) {
									callback(err, null);
								}
								callback(null, result);
							});
						});
					}
				});
			});
		});
	});
}

function getSecureityQuestion(callback) {
	let selectQuery = "SELECT question_id, question_content FROM security_questions";
	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		let optionId = 0;
		result.forEach((row) => {
			resultRow += `<option id="${row.question_id}" data-optionsId=${optionId}>${row.question_content}</option>`;
			optionId++;
		});
		callback(null, resultRow);
	});
}

function getRefundRequest(callback) {
	let selectQuery = "SELECT refund.*, refund.refund_id AS refund_refund_id, refund.order_item_id AS refund_order_item_id, refund.create_at AS refund_create_at, return_item.*, refund.status AS refund_status, return_item.status AS return_item_status From refund LEFT JOIN return_item ON refund.refund_id = return_item.refund_id";
	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option data-refund_id='${row.refund_refund_id}' data-order_item_id='${row.refund_order_item_id}' data-amount=${row.amount} data-reason='${row.reason}' data-request_date='${row.refund_create_at}' data-refund_status='${row.refund_status}' data-return_status='${row.return_item_status}' data-return_item_id='${row.return_id}'>Refund ID: ${row.refund_refund_id}</option>`;
			
		});
		callback(null, resultRow);
	});
}

function insertRefund(callback, refundId, userId, orderItemId, reason, isReturn) {
	let returnId;
	
	if (isReturn == "false") {
		returnId = "null";
	}
	else {
		returnId = crypto.randomBytes(10).toString("hex");
	}
	
	let insertQuery = `INSERT INTO refund (refund_id, order_item_id, user_id, amount, status, reason, return_id) SELECT '${refundId}', order_item_id, '${userId}', price * quantity, 'pending', '${reason}', '${returnId}' FROM order_items WHERE order_item_id = '${orderItemId}' AND status != 'requestingRefund'`;	
	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		const updateQuery = `UPDATE order_items set status = 'requestingRefund' WHERE order_item_id = '${orderItemId}'`;
		connection.query(updateQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			if (isReturn == "true") {
				let insertQuery2 = `INSERT INTO return_item (return_id, refund_id, user_id, order_item_id) VALUES ('${returnId}', '${refundId}', '${userId}', '${orderItemId}')`;	

				connection.query(insertQuery2, (err, result) => {
					if (err) {
						callback(err, null);
					}
					callback(null, result);
				});
			}
			else {
				callback(null, result);
			}
		});
	});
}

function getRefundProduct(callback, userId, orderItemId) {
	let selectQuery = `SELECT order_items.*, product.*, orders.user_id FROM orders JOIN order_items ON order_items.order_item_id = '${orderItemId}' JOIN product ON product.product_id = order_items.product_id
						Where orders.user_id = '${userId}'`;
	let resultRow = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		if (result.length > 0) {
			resultRow = `<div class="control-group">
				<h5 class="font-weight-semi-bold mb-3">Your item</h5>
				<input type="text" class="form-control" disabled id="productName" data-order_item_id="${result[0].order_item_id}" value="${result[0].product_name}" />
			</div>
			<br>
			<div class="control-group">
				<h5 class="font-weight-semi-bold mb-3">Price</h5>
				<p id="priceFormula">$${result[0].price} x ${result[0].quantity}</p>
				<p id="totalAmount"><b>Total: $${parseFloat(result[0].price) * parseInt(result[0].quantity)}</b></p>
			</div>
			<br>
			<div class="control-group">
				<h5 class="font-weight-semi-bold mb-3">Reason</h5>
				<textarea class="form-control" rows="6" id="reason"></textarea>
			</div>
			<br>
			<div class="control-group">
				<label>Also return item</label> &nbsp
				<input id="isReturn" type="checkbox">
			</div>
			<br>
			<div class="control-group">
				<button onclick="refund()" class="btn btn-primary py-2 px-4">Confirm</button>
			</div>`;
		}
		else {
			resultRow = `<center><h3>Item not Found</h3></center>`;
		}
		callback(null, resultRow);
	});
}

function updateOrderStatusWhenSuccess(callback, order, action, userId) {
	const updateQuery = `UPDATE orders SET status = 'paid' WHERE order_id = '${order}' AND status = 'pending'`;
	const updateQuery2 = `UPDATE order_items SET status = 'paid' WHERE order_id = '${order}' AND status = 'pending'`;
	const updateQuery3 = `UPDATE coupon JOIN orders ON coupon.coupon_id = orders.coupon_id SET coupon.limit_use = coupon.limit_use - 1 WHERE orders.coupon_id IS NOT NULL AND orders.status = 'pending';`;
	const transactionId = crypto.randomBytes(30).toString("hex");
	const insertQuery = `INSERT INTO transactions (transaction_id, order_id, user_id, amount, status) SELECT '${transactionId}', '${order}', '${userId}', total_amount, 'paid' FROM orders WHERE order_id = '${order}' AND NOT EXISTS ( SELECT 1 FROM transactions WHERE order_id = '${order}' ); `;
	const insertQuery2 = `INSERT INTO coupon_usage (user_id, coupon_id, order_id) SELECT '${userId}', coupon_id, order_id FROM orders WHERE coupon_id IS NOT NULL AND order_id = '${order}'`;
	const selectQuery = `SELECT * FROM orders WHERE order_id = '${order}' AND status = 'pending'`;
	
	let resultRow = "";
	
	connection.query(selectQuery, (err, selectResult) => {
		if (err) {
			callback(err, null);
		}
		if (selectResult.length > 0) {
			connection.query(updateQuery3, (err, result) => {
				if (err) {
					callback(err, null);
					}
				connection.query(updateQuery, (err, result) => {
					if (err) {
						callback(err, null);
					}
					connection.query(updateQuery2, (err, result) => {
						if (err) {
							callback(err, null);
						}
						connection.query(insertQuery, (err, result) => {
							if (err) {
								callback(err, null);
							}
							connection.query(insertQuery2, (err, result) => {
								if (err) {
									callback(err, null);
								}
								callback(null, 'insert successfully');
							});
						});
					});
				});
			});
		}
		else {
			callback(null, 'check successfully');
		}
	});
}

function getOrder(callback, userId) {
	const selectQuery = `
			SELECT orders.order_id, coupon.coupon_type, coupon.discount, orders.coupon_id, order_items.quantity, order_items.order_item_id, order_items.status, product.*
			FROM orders 
			JOIN order_items ON order_items.order_id = orders.order_id
			JOIN product ON product.product_id = order_items.product_id
			LEFT JOIN coupon ON coupon.coupon_id = orders.coupon_id
			WHERE orders.user_id = '${userId}';
		`;
	const deleteQuery = `DELETE FROM orders WHERE order_id NOT IN (SELECT order_id FROM order_items);`;
	
	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		
		let resultRow = "";
		let temp = "";
			
		connection.query(selectQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
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
			callback(null, resultRow);
		});
	});
}

function getOrderStatusWhenSuccessfully(callback, order) {
	let selectQuery = `select transactions.*, orders.*, users_delivery.*, order_items.quantity, product.* from orders 
	JOIN order_items ON order_items.order_id = orders.order_id 
	JOIN product ON product.product_id = order_items.product_id 
	JOIN transactions ON transactions.order_id = '${order}'
	JOIN users_delivery ON users_delivery.delivery_id = orders.delivery_id
	where orders.order_id = '${order}'`;

	let resultRow = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			console.error('Error updating data:' + err.message);
		}
		result.forEach((row) => {
			resultRow += `
				<a href="${row.product_url}">${row.product_name}</a> * ${row.quantity}<br>
			`;
		});
		
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
		callback(null, resultRow);	
	});
}

function removeItem(callback, item) {
	let deleteQuery = `DELETE from order_items where order_item_id = '${item}'`;

	connection.query(deleteQuery, (err, result) => {
		if (err) {
			console.error('Error updating data:' + err.message);
		}			
		callback(null, "successfully");	
	});
}

function getCategories(callback, action) {
	let selectQuery = `select categories_id, parent_categories_id, categories_name from categories`;

	let resultRow = "";
	let categoriesTemp = "";
	let subCategoriesTemp = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			console.error('Error updating data:' + err.message);
		}
		result.forEach((row) => {
			if (row.parent_categories_id == -1){
				categoriesTemp += `<option id="${row.categories_id}" name="${row.parent_categories_id}">ID: ${row.categories_id}, Name: ${row.categories_name}</option>`;
			}
			else {
				subCategoriesTemp += `<option id="${row.categories_id}" name="${row.parent_categories_id}">ID: ${row.categories_id}, Name: ${row.categories_name}</option>`;
			}
		});

		resultRow = categoriesTemp + "|" + subCategoriesTemp;

		if (action == "categorie") {
			callback(null, resultRow);	
		}
		else if (action == "product") {
			callback(null, resultRow);	
		}	
	});
}

function getCategories_homePage(callback) {
	let selectQuery = `select * from categories`;

	let resultRow = "";
	let categoriesTemp = [];
	let subCategoriesTemp = [];
	
	let tempParent = "";
	let temp = "";
	let temp2 = "";
	let isParent = false;
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			console.error('Error updating data:' + err.message);
		}
		result.forEach((row) => {
			if (row.parent_categories_id != "-1"){
				subCategoriesTemp.push([row.categories_id, row.parent_categories_id, row.categories_name, `<a href="shop.html?category=${row.categories_id}" id="category${row.categories_id}" name="${row.parent_categories_id}" class="dropdown-item">${row.categories_name}</a>`]);
			}
			else {
				categoriesTemp.push([row.categories_id, row.categories_name]);
			}
		});
		
		for (let i = 0; i < categoriesTemp.length; i++) {
			isParent = false;
			temp = "";
			temp2 = "";
			for (let j = 0; j < subCategoriesTemp.length; j++) {
				if (categoriesTemp[i][0] == subCategoriesTemp[j][1]) {
					isParent = true;
					temp += subCategoriesTemp[j][3];
				}
			}
			if (isParent) {
				temp2 = `
					<div class="nav-item dropdown">
						<a href="#" id="category${categoriesTemp[i][0]}" class="nav-link" data-toggle="dropdown"><label onclick="window.location.href='shop.html?category=${categoriesTemp[i][0]}'">${categoriesTemp[i][1]}</label><i class="fa fa-angle-down float-right mt-1"></i></a>
						<div class="dropdown-menu position-absolute bg-secondary border-0 rounded-0 w-100 m-0">
							${temp}
						</div>
					</div>`;
			}
			else {
				temp2 = `<a href="shop.html?category=${categoriesTemp[i][0]}" id="category${categoriesTemp[i][0]}" class="nav-item nav-link">${categoriesTemp[i][1]}</a>`;
			}
			resultRow += temp2;
		}
		resultRow = `<div class="navbar-nav w-100 overflow-hidden" style="height: ${categoriesTemp * 41}px">` + resultRow + `</div>`;
		callback(null, resultRow);
	});
}

function endDatabaseConnection() {
	connection.end((err) => {
		if (err) {
			console.error('Error closing connection:', err.message);
			return;
		}
		console.log('Connection closed');
	});
}

module.exports = {
    adminUpdateProduct,
    adminUpdateOrder,
    updatePageView,
    adminGetOrder,
    adminDeleteOrder,
    reviewManagerGetProduct,
    updateRefundAndReturn,
    deleteCoupon,
    getRefundRequest,
    insertRefund,
    getPageView,
    getRefundProduct,
    adminGetProduct,
    userGetCoupon,
    getUser,
    userUseCoupon,
    insertCategories,
    payOrder,
    createCarouselImage,
    deleteCarouselImage,
    getCarouselImage,
    getCoupon,
	updateCategories,
	getCategories,
	insertProduct,
	getSecureityQuestion,
	insertAdminRole,
	getAdminRole,
	getDataByDate,
	insertAdmin,
	getAdmin,
	deleteAdmin,
	deleteRole,
	insertReview,
	getTopProduct,
	getReview,
	deleteReview,
	getPageProduct,
	insertCartItem,
	getCartItem,
	modifyCartItem,
	userLogin,
	createDelivery,
	updateDelivery,
	getDelivery,
	getOrderDelivery,
	getCategories_homePage,
	orderCartItem,
	getOrder,
	insertUser,
	adminLogin,
	removeItem,
	getOrderStatusWhenSuccessfully,
	deleteUser,
	updateUser,
	updateOrderStatusWhenSuccess,
	adminDeleteProduct,
	createCoupon,
	reviewManagerGetReview,
	productPageGetProduct,
	updateReviewStatus,
	getSecurityQuestion,
	deleteSecurityQuestion,
	createSecurityQuestion,
	getHomeCarouselImage,
	connection
};