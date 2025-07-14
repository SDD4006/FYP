require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const crypto = require("crypto");
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function insertAdminRole(name, description) {
	try {
		const insertQuery = `INSERT INTO admin_role (role_name, description) VALUES (?, ?)`;
        const result = await queryAsync(insertQuery, [name, description]);

		return result;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function insertAdmin(admin, name, email, adminPassword, roleId, isActive) {
	try {
		const adminId = crypto.randomBytes(20).toString("hex");
		const selectQuery = `SELECT admin_id, email FROM admin WHERE admin_id=? or email=?`;
		const insertQuery = `INSERT INTO admin (admin_id, role_id, user_name, email, password, status) VALUES (?, ?, ?, ?, ?, ?)`;
		const insertQuery2 = `INSERT INTO admin_admin_management (admin_id, affected_admin_id, action) VALUES (?, ?, 'create')`;

		let result = await queryAsync(selectQuery, [adminId, email]);
		result = await queryAsync(insertQuery, [adminId, roleId, name, email, adminPassword, isActive]);
		result = await queryAsync(insertQuery2, [admin, adminId]);
		
		return 'successfully';
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getAdminRole() {
	try {
		let selectQuery = `select role_id, role_name, description from admin_role`;
		const result = await queryAsync(selectQuery);
		let resultRow = "";
		
		if (result.length > 0) {
			result.forEach((row) => {
				resultRow += `<option id="${row.role_id}">id:${row.role_id}, Name: ${row.role_name}, Description: ${row.description}</option>`;
			});
		}
		return resultRow;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getAdmin() {
	try {
		let selectQuery = `select * from admin`;
		const result = await queryAsync(selectQuery);

		let resultRow = "";
		
		result.forEach((row) => {
			resultRow += `<option id="${row.admin_id}">Email: ${row.email}, Name: ${row.user_name}</option>`;
		});
		
		return resultRow;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function deleteAdmin(operatedAdmin, adminId) {
	try {
		let deleteQuery = `Delete from admin where admin_id = ?`;
		let insertQuery = `INSERT INTO admin_admin_management (admin_id, affected_admin_id, action) VALUES (?, ?, 'delete')`;
		
		await queryAsync(deleteQuery, adminId);
		await queryAsync(insertQuery, [operatedAdmin, adminId]);

		return;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function deleteRole(roleId) {
	try {
		let deleteQuery = `Delete from admin_role where role_id = ${roleId}`;
		await queryAsync(deleteQuery, roleId);

		return;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function adminLogin(userEmail, password) {
	try {
		const selectQuery = `SELECT * FROM admin WHERE email=? and password=?`;
		const result = await queryAsync(selectQuery, [userEmail, password]);

		if (result.length > 0)
			return result[0].admin_id;
		else
			return "fail";
		
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

module.exports = { 
	insertAdminRole,
	insertAdmin,
	getAdminRole,
	getAdmin,
	deleteAdmin,
	deleteRole,
	adminLogin,
 };
