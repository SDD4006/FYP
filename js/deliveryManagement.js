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


async function createDelivery(userId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode, isPrimary) {
	
	try {
		let isPrimary2 = (isPrimary == "true") ? 1 : 0;
		let insertQuery = "";
		const selectQuery = `SELECT * from users_delivery where user_id = ?`;
		
		const result = await queryAsync(selectQuery, [userId]);
		
		result.forEach(async (row) => {
			if (row.is_primary == 1 && isPrimary2 == 1) {
				const updateQuery = `UPDATE users_delivery set is_primary = 0 WHERE delivery_id = ?`;
				await queryAsync(updateQuery, [row.delivery_id]);
			}
		});
		
		if (result.length < 1) {
			insertQuery = `INSERT INTO users_delivery (delivery_id, user_id, first_name, last_name, contact_phone, contact_email, address1, address2, region, city_area, city, city_code, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
			await queryAsync(insertQuery, [crypto.randomBytes(6).toString("hex"), userId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode]);
		}
		else {
			insertQuery = `INSERT INTO users_delivery (delivery_id, user_id, first_name, last_name, contact_phone, contact_email, address1, address2, region, city_area, city, city_code, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
			await queryAsync(insertQuery, [crypto.randomBytes(6).toString("hex"), userId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode, isPrimary2]);
		}
			
		return "insert delivery successfully";
		
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function updateDelivery(userId, deliveryId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode2, isPrimary) {
	try {
		const isPrimary2 = (isPrimary == "true") ? 1 : 0;
		
		let updateQuery = ``;
		
		let temp = false;
		const selectQuery = `SELECT * from users_delivery where user_id = ?`;
		const result = await queryAsync(selectQuery, [userId]);
		
		if (result.length > 0) {
			for (let i = 0; i < result.length; i++) {
				if (isPrimary2 == 1) {
					if (result[i].is_primary == 1) {
						await queryAsync(`UPDATE users_delivery set is_primary = 0 WHERE delivery_id = ?`, [result[i].delivery_id]);
					}
				}
				else {
					if (result[i].is_primary == 1) {
						temp = true;
					}
				}
			}
		}
		
		if (temp == false) {
			updateQuery = `Update users_delivery set first_name=?, last_name=?, contact_phone=?, contact_email=?, address1=?, address2=?, region=?, city_area=?, city=?, city_code=?, is_primary=1 where delivery_id = ?`;
			await queryAsync(updateQuery, [firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode2, deliveryId]);
		}
		else {
			updateQuery = `Update users_delivery set first_name=?, last_name=?, contact_phone=?, contact_email=?, address1=?, address2=?, region=?, city_area=?, city=?, city_code=?, is_primary=? where delivery_id = ?`;
			await queryAsync(updateQuery, [firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode2, isPrimary2, deliveryId]);
		}
		
		return "update delivery successfully";
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getDelivery(userId, isPrimary) {
	try {
		let isPrimary2 = (isPrimary == "true") ? 1 : 0;

		const selectQuery = `SELECT * from users_delivery where user_id = ?`;
		const result = await queryAsync(selectQuery, userId);
		
		let resultRow = "";

		if (result.length > 0) {
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
		}
		
		return resultRow;
		
	} catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getOrderDelivery(userId) {
	try {
		let selectQuery = `SELECT * from users_delivery where user_id = ? and is_primary=1`;
		const result = await queryAsync(selectQuery, userId);
		
		let resultRow = "";
		
		if (result.length > 0) {
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
		}
		return resultRow;
	} catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

module.exports = { 
	createDelivery,
	updateDelivery,
	getDelivery,
	getOrderDelivery,
 };
