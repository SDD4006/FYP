require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function getSecurityQuestion() {
	let resultRow = "";
	
	try {
		const selectQuery = `SELECT * FROM security_questions`;
		const result = await queryAsync(selectQuery);
		
		result.forEach((row) => {
			resultRow += `<option id="${row.question_id}" data-content="${row.question_content}">ID:${row.question_id}, Content: ${row.question_content}</option>`;

		});
		return resultRow;
	
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function createSecurityQuestion(admin, securityQuestionContentInput) {
    try {
        const insertQuery = `INSERT INTO security_questions (question_content) VALUES (?)`;
        const result = await queryAsync(insertQuery, [securityQuestionContentInput]);
        
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
async function getSecureityQuestion() {
    try {
	let selectQuery = "SELECT question_id, question_content FROM security_questions";
	const result = await queryAsync(selectQuery);
	let resultRow = "";
	
	if (result.length > 0) {
		let optionId = 0;
		result.forEach((row) => {
			resultRow += `<option id="${row.question_id}" data-optionsId=${optionId}>${row.question_content}</option>`;
			optionId++;
		});
	}
		
	return resultRow;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}


module.exports = { 
	getSecurityQuestion,
	createSecurityQuestion,
	getSecureityQuestion,
	deleteSecurityQuestion
 };
