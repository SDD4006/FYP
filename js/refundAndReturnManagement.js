require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const crypto = require("crypto");
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function insertRefund(refundId, userId, orderItemId, reason, isReturn) {
	try {
		
		let returnId;
	
		if (isReturn == "false") {
			returnId = "null";
		}
		else {
			returnId = crypto.randomBytes(10).toString("hex");
		}
		
		const insertQuery = `INSERT INTO refund (refund_id, order_item_id, user_id, amount, status, reason, return_id) SELECT ?, order_item_id, ?, price * quantity, 'pending', ?, ? FROM order_items WHERE order_item_id = ? AND status != 'requestingRefund'`;	
        await queryAsync(insertQuery, [refundId, userId, reason, returnId, orderItemId]);
		
		const updateQuery = `UPDATE order_items set status = 'requestingRefund' WHERE order_item_id = ?`;
        await queryAsync(updateQuery, [orderItemId]);
		
		if (isReturn == "true") {
			const insertQuery2 = `INSERT INTO return_item (return_id, refund_id, user_id, order_item_id) VALUES (?, ?, ?, ?)`;	
			await queryAsync(insertQuery2, [returnId, refundId, userId, orderItemId]);
		}
		return;
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function updateRefundAndReturn(userId, refundId, refundStatus, returnId, returnStatus) {
	const updateQuery = `UPDATE refund set status=? where refund_id = ?`;
	const insertQuery = `INSERT INTO refund_admin_management (admin_id, refund_id, action, updated_status) VALUES (?, ?, 'update', ?)`;
	const selectQuery = `SELECT order_item_id FROM refund WHERE refund_id = ?`;
	
	try {
        const result = await queryAsync(selectQuery, [refundId]);
        await queryAsync(updateQuery, [refundStatus, refundId]);
        await queryAsync(insertQuery, [userId, refundId, refundStatus]);
		
		let orderItemsRefundStatus = "";
		if (refundStatus == "approve")
			orderItemsRefundStatus = "refundApproved"
		else if (refundStatus == "reject")
			orderItemsRefundStatus = "refundRejected"
		
		const updateQuery3 = `UPDATE order_items set status=? where order_item_id = ?`;
		
		if (result.length > 0)
			await queryAsync(updateQuery3, [orderItemsRefundStatus, result[0].order_item_id]);
		
		if (returnId == "undefined" || returnStatus == "null") {
			return;
		}
		else {
			const updateQuery2 = `UPDATE return_item set status=? where return_id = ?`;
			const insertQuery2 = `INSERT INTO return_admin_management (admin_id, return_id, action, updated_status) VALUES (?, ?, 'update', ?)`;
			
			await queryAsync(updateQuery2, [returnStatus, returnId]);
			await queryAsync(insertQuery2, [userId, refundId, returnStatus]);
			
			return;
		}
		
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getRefundRequest() {
	try {
		let selectQuery = "SELECT refund.*, refund.refund_id AS refund_refund_id, refund.order_item_id AS refund_order_item_id, refund.create_at AS refund_create_at, return_item.*, refund.status AS refund_status, return_item.status AS return_item_status From refund LEFT JOIN return_item ON refund.refund_id = return_item.refund_id";
		let resultRow = "";
		
		const result = await queryAsync(selectQuery);
		
		if (result.length > 0) {
			result.forEach((row) => {
				resultRow += `<option data-refund_id='${row.refund_refund_id}' data-order_item_id='${row.refund_order_item_id}' data-amount=${row.amount} data-reason='${row.reason}' data-request_date='${row.refund_create_at}' data-refund_status='${row.refund_status}' data-return_status='${row.return_item_status}' data-return_item_id='${row.return_id}'>Refund ID: ${row.refund_refund_id}</option>`;
				
			});
		}
		return resultRow;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
	
}

async function getRefundProduct(userId, orderItemId) {
	try {
		let selectQuery = `SELECT order_items.*, product.*, orders.user_id FROM orders JOIN order_items ON order_items.order_item_id = ? JOIN product ON product.product_id = order_items.product_id
						Where orders.user_id = ?`;
		let resultRow = "";
		
		const result = await queryAsync(selectQuery, [orderItemId, userId]);
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
		return resultRow;
		
	} catch (error) {
	console.error("Error executing query:", error.message);
	throw error;
	}
}
module.exports = { 
	insertRefund,
	updateRefundAndReturn,
	getRefundRequest,
	getRefundProduct,
 };
