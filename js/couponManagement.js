require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function createCoupon(couponId, userId, couponTarget, name, description, couponType, discountAmount, couponUsageLimit, expirationDate, image_url) {
	try {
		const insertQuery = `INSERT INTO coupon (coupon_id, coupon_target, coupon_name, duration, coupon_type, discount, limit_use, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		const insertQuery2 = `INSERT INTO coupon_admin_management (admin_id, coupon_id, action) VALUES (?, ?, 'create')`;

		let result = await queryAsync(insertQuery, [couponId, couponTarget, name, expirationDate, couponType, discountAmount, couponUsageLimit, description, image_url]);
		result = await queryAsync(insertQuery2, [userId, couponId]);
		
		return result;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function deleteCoupon(userId, couponId) {

	try {
		const deleteQuery = `Delete from coupon where coupon_id = ?`;	
		const insertQuery = `INSERT INTO coupon_admin_management (admin_id, coupon_id, action) VALUES (?, ?, 'delete')`;
		
        let result = await queryAsync(deleteQuery, [couponId]);
        result = await queryAsync(insertQuery, [userId, userId]);
        
		return result;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function userGetCoupon(userId) {
	try {
		const today = new Date();
		const formattedToday = today.toISOString().split('T')[0];
		let resultRow = "";

		const selectQuery = `SELECT * FROM coupon WHERE duration >= ? AND limit_use > 0 AND (coupon_target = "all" OR coupon_target = ?)`;
        const result = await queryAsync(selectQuery, [formattedToday, userId]);
		
        result.forEach((row) => {
			let couponType = "";
			if (row.coupon_type == "persentage")
				couponType = row.discount + "% ON";
			if (row.coupon_type == "amount")
				couponType = "-$" + row.discount;

			resultRow += `<option id="${row.coupon_id}" value="${row.coupon_id}" data-coupon_type="${row.coupon_type}" data-discount="${row.discount}">Discount ${couponType}</option>`;
		});
		
		return resultRow;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function userUseCoupon(userId, couponId) {

	try {	
		const selectQuery = `SELECT * FROM coupon WHERE coupon_id = ? AND limit_use > 0 AND (coupon_target = "all" OR coupon_target = ?)`;
        const result = await queryAsync(selectQuery, [couponId, userId]);
		
		return result;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getCoupon() {
	let resultRow = "";

	try {	
		const selectQuery = `SELECT * FROM coupon`;
        const result = await queryAsync(selectQuery);
		
		result.forEach((row) => {
			resultRow += `<option id="${row.coupon_id}" value="${row.coupon_id}">ID: ${row.coupon_id}, Name: ${row.coupon_name}, Expiration Date: ${row.duration}, Description: ${row.description}, Target: ${row.coupon_target}</option>`;

		});

		return resultRow;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

module.exports = { 
	userUseCoupon,
	userGetCoupon,
	createCoupon,
	deleteCoupon,
	getCoupon,
 };
