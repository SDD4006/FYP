require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const crypto = require("crypto");
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

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

async function insertCategories(admin, categorieName, parentCategorie, categorieDescription) {
	try {
		const categorie_id = crypto.randomBytes(6).toString("hex");
		
		const insertQuery = `INSERT INTO categories (categories_id, categories_name, parent_categories_id, categories_description) VALUES (?, ?, ?, ?)`;
		const insertQuery2 = `INSERT INTO categories_admin_management (admin_id, categories_id, action) VALUES (?, ?, 'create')`;
		await queryAsync(insertQuery, [categorie_id, categorieName, parentCategorie, categorieDescription]);
		await queryAsync(insertQuery2, [admin, categorie_id]);

		return;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function updateCategories(admin, action, categorieId, categorieName, parentCategorie, categorieDescription) {
	try {
		let updateQuery = "";
		let insertQuery2 = "";
		
		if (action == "update") {
			updateQuery = `UPDATE categories set categories_name=?, parent_categories_id=?, categories_description=? where categories_id=?`;
			insertQuery2 = `INSERT INTO categories_admin_management (admin_id, categories_id, action) VALUES (?, ?, 'update')`;
			await queryAsync(updateQuery, [categorieName, parentCategorie, categorieDescription, categorieId]);
			await queryAsync(insertQuery2, [admin, categorieId]);

		}
		else if (action == "delete") {
			updateQuery = `DELETE FROM categories WHERE categories_id=?`;
			insertQuery2 = `INSERT INTO categories_admin_management (admin_id, categories_id, action) VALUES (?, ?, 'delete')`;
			await queryAsync(updateQuery, [categorieId]);
			await queryAsync(insertQuery2, [admin, categorieId]);
		}
		
		return;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getCategories(action) {
	try {
		let selectQuery = `select categories_id, parent_categories_id, categories_name from categories`;
		const result = await queryAsync(selectQuery);

		let resultRow = "";
		let categoriesTemp = "";
		let subCategoriesTemp = "";
		
		if (result.length > 0) {
			result.forEach((row) => {
				if (row.parent_categories_id == -1){
					categoriesTemp += `<option id="${row.categories_id}" name="${row.parent_categories_id}">ID: ${row.categories_id}, Name: ${row.categories_name}</option>`;
				}
				else {
					subCategoriesTemp += `<option id="${row.categories_id}" name="${row.parent_categories_id}">ID: ${row.categories_id}, Name: ${row.categories_name}</option>`;
				}
			});

			resultRow = categoriesTemp + "|" + subCategoriesTemp;

			if (action == "categorie") {
				return resultRow;
			}
			else if (action == "product") {
				return resultRow;
			}	
			else 
				return;
		}
		return;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getCategories_homePage() {
	try {
		let selectQuery = `select * from categories`;

		let resultRow = "";
		let categoriesTemp = [];
		let subCategoriesTemp = [];
		
		let tempParent = "";
		let temp = "";
		let temp2 = "";
		let isParent = false;
		
		const result = await queryAsync(selectQuery);
		
		if (result.length > 0) {
			result.forEach((row) => {
				if (row.parent_categories_id != "-1"){
					subCategoriesTemp.push([row.categories_id, row.parent_categories_id, row.categories_name, `<a href="shop.html?category=${row.categories_id}" id="category${row.categories_id}" name="${row.parent_categories_id}" class="dropdown-item">${row.categories_name}</a>`]);
				}
				else {
					categoriesTemp.push([row.categories_id, row.categories_name]);
				}
			});
			
			for (let i = 0; i < categoriesTemp.length; i++) {
				isParent = false;
				temp = "";
				temp2 = "";
				for (let j = 0; j < subCategoriesTemp.length; j++) {
					if (categoriesTemp[i][0] == subCategoriesTemp[j][1]) {
						isParent = true;
						temp += subCategoriesTemp[j][3];
					}
				}
				if (isParent) {
					temp2 = `
						<div class="nav-item dropdown">
							<a href="#" id="category${categoriesTemp[i][0]}" class="nav-link" data-toggle="dropdown"><label onclick="window.location.href='shop.html?category=${categoriesTemp[i][0]}'">${categoriesTemp[i][1]}</label><i class="fa fa-angle-down float-right mt-1"></i></a>
							<div class="dropdown-menu position-absolute bg-secondary border-0 rounded-0 w-100 m-0">
								${temp}
							</div>
						</div>`;
				}
				else {
					//temp2 = `<a href="shop.html?category=${categoriesTemp[i][0]}" id="category${categoriesTemp[i][0]}" class="nav-item nav-link">${categoriesTemp[i][1]}</a>`;
					temp2 = `<button onclick="searchCategory('${categoriesTemp[i][0]}')" id="category${categoriesTemp[i][0]}" class="nav-item nav-link">${categoriesTemp[i][1]}</button>`;
				}
				resultRow += temp2;
			}
			resultRow = `<div class="navbar-nav w-100 overflow-hidden" style="height: ${categoriesTemp * 41}px">` + resultRow + `</div>`;
		}

		return resultRow;
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}


module.exports = { 
	insertCategories,
	updateCategories,
	getCategories,
	getCategories_homePage,
 };
