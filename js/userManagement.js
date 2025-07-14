require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const crypto = require("crypto");
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function getUser(callback) {
	try {
		let resultRow = "";
		let index = 0;
		
		const selectQuery = `SELECT * FROM user`;
        const result = await queryAsync(selectQuery);
        
		result.forEach((row) => {
			resultRow += `<option id="${index}" data-user_id='${row.user_id}' data-status_id='${row.status == "Active" ?　0 : row.status == "Inactive" ? 1 : 2}' data-secuity_question_id='${row.secuity_question_id}'  data-secuity_question_answer='${row.secuity_question_answer}'  data-email='${row.email}'  data-password='${row.password}'  data-status='${row.status}'  data-create_at='${row.create_at}'  data-last_login='${row.last_login}'>User ID: ${row.user_id}, Email: ${row.email}</option>`;
			index++;
		});
		return resultRow;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function deleteUser(adminId, userId) {
	try {
		const deleteQuery = `Delete from user where user_id = ?`;	
		const insertQuery = `INSERT INTO user_admin_management (admin_id, user_id, action) VALUES (?, ?, 'delete')`;
		
        let result = await queryAsync(deleteQuery, [userId]);
        result = await queryAsync(insertQuery, [adminId, userId]);
        
		return result;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function updateUser(adminId, userId, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer) {

	try {
		const updateQuery = `UPDATE user SET secuity_question_id = ?, secuity_question_answer = ?, email = ?, password = ?, status = ? WHERE user_id = ?;`;
		const insertQuery = `INSERT INTO user_admin_management (admin_id, user_id, action) VALUES (?, ?, 'update')`;
        let result = await queryAsync(updateQuery, [userSecuityQuestionSelection, userSecuityQuestionAnswer, userEmail, userPassword, userStatusSelection, userId]);
        result = await queryAsync(insertQuery, [adminId, userId]);
        
		return result;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function insertUser(adminId, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer) {
	const userId = crypto.randomBytes(30).toString("hex");
	try {
		const insertQuery = `INSERT INTO user (user_id, secuity_question_id, secuity_question_answer, email, password, status) VALUES (?, ?, ?, ?, ?, ?)`;
		const insertQuery2 = `INSERT INTO shopping_cart (user_id, cart_name, cart_discription) values (?, ?, 'null')`;
		const insertQuery3 = `INSERT INTO user_admin_management (admin_id, user_id, action) VALUES (?, ?, 'create')`;
		const insertQuery4 = `INSERT INTO wish_list (wish_list_id , user_id) VALUES (?, ?)`;
        
		let result = await queryAsync(insertQuery, [userId, userSecuityQuestionSelection, userSecuityQuestionAnswer, userEmail, userPassword, userStatusSelection]);
        result = await queryAsync(insertQuery2, [userId, userId]);
        result = await queryAsync(insertQuery3, [adminId, userId]);
        result = await queryAsync(insertQuery4, [crypto.randomBytes(6).toString("hex"), userId]);
        
		return result;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function userLogin(userEmail, password) {
	const selectQuery = `SELECT * FROM user WHERE email=? and password=?`;
    const result = await queryAsync(selectQuery, [userEmail, password]);
	
	if (result.length > 0)
		return result[0].user_id;
	else
		return "fail";
}

module.exports = { 
	getUser,
	deleteUser,
	updateUser,
	insertUser,
	userLogin,
 };
