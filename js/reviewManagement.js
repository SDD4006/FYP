require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const crypto = require("crypto");
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function insertReview(productId, userId, userIconUrl, userName, reviewMessage, isActive) {
	try  {
		const insertQuery = `INSERT INTO review (product_id, user_id, user_icon_url, author, content, status) VALUES (?, ?, ?, ?, ?, ?)`;
        const result = await queryAsync(insertQuery, [productId, userId, userIconUrl, userName, reviewMessage, isActive]);

		return result;

	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function deleteReview(admin, review, oldContent, user_id) {
	
	try  {
		const updateQuery = `DELETE FROM review WHERE review_id = ?;`;
		const insertQuery = `INSERT INTO review_admin_management (admin_id, review_id, action, old_review_content, user_id) VALUES (?, ?, 'delete', ?, ?)`;

		let result = await queryAsync(updateQuery, review);
		result = await queryAsync(insertQuery, [admin, review, oldContent, user_id]);

		return result;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function updateReviewStatus(admin, review, reviewContent, reviewStatus, modifyCount, oldContent, user_id) {
	
	try {
		const updateQuery = `UPDATE review SET content = ?, status = ?, modify_count = ? WHERE review_id = ?;`;
		const insertQuery = `INSERT INTO review_admin_management (admin_id, review_id, user_id, action, modified_review_content, old_review_content) VALUES (?, ?, ?, 'update', ?, ?)`;

		await queryAsync(updateQuery, [reviewContent, reviewStatus, modifyCount, review]);
		const result = await queryAsync(insertQuery, [admin, review, user_id, reviewContent, oldContent]);
		
		return result;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function reviewManagerGetReview(product) {
	try {
		const selectQuery = `SELECT * FROM review where product_id = ?`;
		let resultRow = "";

		const result = await queryAsync(selectQuery, product);
		result.forEach((row) => {
			resultRow += `<option id="${row.review_id}" data-content="${row.content}" data-author="${row.author}" data-status="${row.status}" data-modify_count="${row.modify_count}" data-create_at="${row.create_at}" data-last_update="${row.update_at}">ID: ${row.review_id}, Author: ${row.author}, Content: ${row.content}</option>`;
		});
		return resultRow;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getReview(productId) {
	const selectQuery = `select * from review where product_id = ?`;
	let resultRow = "";

	const result = await queryAsync(selectQuery, productId);
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
	return resultRow;
}


module.exports = { 
	insertReview,
	deleteReview,
	updateReviewStatus,
	reviewManagerGetReview,
	getReview,
 };
