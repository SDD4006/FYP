require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const crypto = require("crypto");
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function getWishListItem(userId) {
	
	const selectQuery = `SELECT wish_list.wish_list_id, wish_list_item.*, product.product_price, product.product_name, product.product_display_image_url, product.product_url FROM wish_list JOIN wish_list_item ON wish_list.wish_list_id = wish_list_item.wish_list_id
						JOIN product ON product.product_id = wish_list_item.product_id WHERE user_id = ?`;
	
	try {
		const result = await queryAsync(selectQuery, [userId]);
		return result;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}


async function deleteWishListItem(wishListItemId) {
    try {
        const deleteQuery = `DELETE FROM wish_list_item WHERE wish_list_item_id = ?`;
        const result = await queryAsync(deleteQuery, [wishListItemId]);
        
        return result;
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function updateWishListItem(wishListItemId, action, productQuantity) {

	try {
		let updateQuery = "";
		let result = "";
		if (action == "inputNum") {
			updateQuery = `UPDATE wish_list_item SET product_quantity = ? WHERE wish_list_item_id = ?`;
			result = await queryAsync(updateQuery, [productQuantity, wishListItemId]);
		}
		else if (action == "minus") {
			updateQuery = `UPDATE wish_list_item SET product_quantity = product_quantity - 1 WHERE wish_list_item_id = ? AND product_quantity >= 0`;
			result = await queryAsync(updateQuery, [wishListItemId]);
		}
		else if (action == "plus") {
			updateQuery = `UPDATE wish_list_item SET product_quantity = product_quantity + 1 WHERE wish_list_item_id = ?`;
			result = await queryAsync(updateQuery, [wishListItemId]);
		}

		return result;
		
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function createWishListItem(productId, productQuantity, cartItemId, wishListId) {
	const deleteQuery = `DELETE FROM cart_item WHERE cart_item_id = ?`;
	const insertQuery = `INSERT INTO wish_list_item (wish_list_item_id, wish_list_id, product_id, product_quantity) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE product_quantity = product_quantity + ?`;

	try {
		let result = await queryAsync(deleteQuery, [cartItemId]);
		result = await queryAsync(insertQuery, [crypto.randomBytes(10).toString("hex"), wishListId, productId, productQuantity, productQuantity]);
		
		return result;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

module.exports = { 
	createWishListItem,
	updateWishListItem,
	deleteWishListItem,
	getWishListItem
};
