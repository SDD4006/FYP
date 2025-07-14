require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);


async function insertProduct(admin, product_id, product_name, product_price, product_url, imageUrl, product_description, product_detail, categories_id, stock_level, detailFileNames, productDesplayIcon) {
	const insertQuery = `INSERT INTO product (product_id, product_name, product_price, product_url, product_display_image_url, product_description, product_detail, categories_id, stock_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

	try {
		let result = await queryAsync(insertQuery, [product_id, product_name, product_price, product_url, imageUrl, product_description, product_detail, categories_id, stock_level]);

		if (detailFileNames != null) {
			if (Array.isArray(detailFileNames)) {
				for (let i = 0; i < detailFileNames.length; i++) {
					let insertQuery2 = `INSERT INTO product_detail_image (product_detail_image_id, product_id, url) VALUES (?, ?, ?)`;
					result = await queryAsync(insertQuery2, [detailFileNames[i], product_id, siteLink + "products/" + product_id +"/images/" + detailFileNames[i]]);
				}
			}
			else {
				let insertQuery2 = `INSERT INTO product_detail_image (product_detail_image_id, product_id, url) VALUES (?, ?, ?)`;
				result = await queryAsync(insertQuery2, [detailFileNames, product_id, siteLink + "products/" + product_id +"/images/" + detailFileNames]);
			}
		}
		if (productDesplayIcon != null) {
			if (Array.isArray(productDesplayIcon)) {
				for (let i = 0; i < productDesplayIcon.length; i++) {
					let insertQuery2 = `INSERT INTO product_icon (product_icon_id, product_id, url) VALUES (?, ?, ?)`;
					result = await queryAsync(insertQuery2, [productDesplayIcon[i], product_id, siteLink + "products/" + product_id +"/displayImages/" + productDesplayIcon[i]]);
				}			
			}
			else {
				let insertQuery2 = `INSERT INTO product_icon (product_icon_id, product_id, url) VALUES (?, ?, ?)`;
				result = await queryAsync(insertQuery2, [productDesplayIcon, product_id, siteLink + "products/" + product_id +"/displayImages/" + productDesplayIcon]);
			}
		}
		const insertQuery3 = `INSERT INTO product_admin_management (admin_id, product_id, action) VALUES (?, ?, ?)`;
		result = await queryAsync(insertQuery3, [admin, product_id, "create"]);
		return result;
	} catch (error) {
		console.error("Error executing query:", error.message);
        throw error;
	}
}

async function adminGetProduct() {
	try {
        const selectQuery = `SELECT * FROM product`;
        const result = await queryAsync(selectQuery);
		let resultRow = "";
        
		result.forEach((row) => {
			resultRow += `<option id="${row.product_id}" data-name="${row.product_name}" data-price="${row.product_price}" data-stock="${row.stock_level}" data-category="${row.categories_id}" data-description="${row.product_description}" value="${row.product_id}">ID: ${row.product_id}, Name: ${row.product_name}, Price: $${row.product_price}, Stock: ${row.stock_level}, Categories: ${row.categories_id}, Description: ${row.product_description}</option>`;

		});

        return resultRow;
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function productPageGetProduct(productId) {
	try {
		const selectQuery = `SELECT * FROM product WHERE product_id = ?`;
        const result = await queryAsync(selectQuery, [productId]);

		const jsonData = {
			productName: result[0].product_name,
			price: result[0].product_price,
			stockLevel: result[0].stock_level,
			description: result[0].product_description
		};
		return jsonData;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function adminUpdateProduct(admin, product_id, product_name, product_price, product_description, categories_id, stock_level) {
	const updateQuery = `UPDATE product SET product_name = '${product_name}', product_price = '${product_price}', product_description = '${product_description}', categories_id = '${categories_id}', stock_level = '${stock_level}' WHERE product_id = '${product_id}';`;
	const insertQuery = `INSERT INTO product_admin_management (admin_id, product_id, action) VALUES ('${admin}', '${product_id}', 'update')`;

	try {
		const updateQuery = `UPDATE product SET product_name = ?, product_price = ?, product_description = ?, categories_id = ?, stock_level = ? WHERE product_id = ?;`;
		const insertQuery = `INSERT INTO product_admin_management (admin_id, product_id, action) VALUES (?, ?, 'update')`;
	
        let result = await queryAsync(updateQuery, [product_name, product_price, product_description, categories_id, stock_level, product_id]);
        result = await queryAsync(insertQuery, [admin, product_id]);
		
        return result;
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function reviewManagerGetProduct() {
	try {
		const selectQuery = `SELECT product.*, review.product_id FROM product JOIN review ON review.product_id = product.product_id`;
		const result = await queryAsync(selectQuery);
		
		let resultRow = "";

		result.forEach((row) => {
			resultRow += `<option id="${row.product_id}" data-product_name="{$row.product_name}">ID: ${row.product_id}, Name: ${row.product_name}</option>`;
		});
		
		return resultRow;

	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function adminDeleteProduct(admin, product_id) {
	const deleteQuery = `DELETE FROM product WHERE product_id = ?`;
	const insertQuery = `INSERT INTO product_admin_management (admin_id, product_id, action) VALUES ('${admin}', '${product_id}', 'delete')`;
	await queryAsync(deleteQuery, product_id);
	await queryAsync(insertQuery, [admin, product_id]);
	
	return;
}

module.exports = { 
	insertProduct,
	adminUpdateProduct,
	adminGetProduct,
	productPageGetProduct,
	reviewManagerGetProduct,
	adminDeleteProduct
 };
