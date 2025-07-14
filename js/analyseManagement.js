require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function getPageView(unique, page, date) {
	
	let selectQuery = ``;
	let result = "";
	
	try {
		if (page == 'all') {
			if (unique == 'false') {
				selectQuery = `SELECT page_url, COUNT(*) AS views FROM page_views where view_date = ? group by page_url`;
			}
			else {
				selectQuery = `SELECT page_url, COUNT(DISTINCT ip_address) AS views FROM page_views where view_date = ? group by page_url`;		
			}
			
			result = await queryAsync(selectQuery, [date]);
		}
		else {
			if (unique == 'false') {
				selectQuery = `SELECT page_url, COUNT(*) AS views FROM page_views WHERE view_date = '${date}' and page_url = '${page}'`;
			}
			else {
				selectQuery = `SELECT page_url, COUNT(DISTINCT ip_address) AS views FROM page_views where view_date = ? and page_url = ?`;		
			}
			result = await queryAsync(selectQuery, [date, page]);
		}
		return result;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getDataByDate(dateA, dateB, type) {
	const newDateA = new Date(dateA);
	const newDateB = new Date(dateB);
	
	const yearA = newDateA.getFullYear();
	const monthA = newDateA.getMonth() + 1
	const yearB = newDateB.getFullYear();
	const monthB = newDateB.getMonth() + 1
	
	let selectQuery = ""

	try {
		if (type == "pageView") {
			selectQuery = `SELECT COUNT(page_views_id) as total_views, DATE_FORMAT(view_date, '%Y-%m') AS new_view_date from page_views where ((YEAR(view_date) = ? AND MONTH(view_date) >= ?) OR YEAR(view_date) > ?) AND ((YEAR(view_date) = ? AND MONTH(view_date) <= ?) OR YEAR(view_date) < ?) GROUP BY new_view_date`;
		}
		else if (type == "revenue") {
			selectQuery = `SELECT SUM(amount) as total_amount, DATE_FORMAT(transaction_date, '%Y-%m') AS new_transaction_date from transactions where ((YEAR(transaction_date) = ? AND MONTH(transaction_date) >= ?) OR YEAR(transaction_date) > ?) AND ((YEAR(transaction_date) = ? AND MONTH(transaction_date) <= ?) OR YEAR(transaction_date) < ?) GROUP BY new_transaction_date`;
		}
		else if (type == "user") {
			selectQuery = `SELECT COUNT(user_id) as total_amount, DATE_FORMAT(create_at, '%Y-%m') AS new_create_date from user where ((YEAR(create_at) = ? AND MONTH(create_at) >= ?) OR YEAR(create_at) > ?) AND ((YEAR(create_at) = ? AND MONTH(create_at) <= ?) OR YEAR(create_at) < ?) GROUP BY new_create_date`;
		}
		else {
			return null;
		}
		result = await queryAsync(selectQuery, [yearA, monthA, yearA, yearB, monthB, yearB]);
		return result;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getTopProduct(date) {
	
	const selectQuery = `SELECT COUNT(order_items.product_id) AS productCount, SUM(order_items.quantity) AS totalQuantity, DATE_FORMAT(order_items.create_at, '%Y-%m-%d') AS newDate, product.product_name, product.product_url, product.product_display_image_url FROM order_items JOIN product ON product.product_id = order_items.product_id where DATE_FORMAT(order_items.create_at, '%Y-%m-%d') = '${date}' group by newDate, product.product_name, product.product_display_image_url`;
	
	try {
		const result = await queryAsync(selectQuery, [date]);
		return result;
	} catch (error) {
        console.error("Error executing query:", error.message);
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

async function updatePageView(userId, page, userIp, dateString) {
	//let updateQuery = `INSERT INTO page_views (page_url, view_date, total_views) VALUES ('${page}', ${new Date()}, 1) ON DUPLICATE KEY UPDATE total_views = total_views + 1;`;
	const updateQuery = `INSERT INTO page_views (page_url, user_id, view_date, ip_address) VALUES (?, ?, ?, ?)`;

	try {
		const result = await queryAsync(updateQuery, [page, userId, dateString, userIp]);
		return result;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

module.exports = { 
	getPageView,
	getDataByDate,
	getTopProduct,
	updatePageView,
 };
