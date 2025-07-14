require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

async function getAboutUs() {
	try {
		const selectQuery = `SELECT about_us_content, about_us_image_url, about_us_button_text, update_from FROM about_us`;
		const result = await queryAsync(selectQuery);
		
		return JSON.stringify(result);
		
    } catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getHomeCarouselImage() {
	try {
		const selectQuery = `SELECT * FROM home_page_layout_images`;
		const result = await queryAsync(selectQuery);
		let resultRow = "";
		
		for (let i = 0; i < result.length; i++) {
			resultRow += `<div class="carousel-item ${i == 0 ? "active" : ""}" style="height: 410px;">
					<img class="img-fluid" src="${result[i].image_path}" alt="carousel" id="carousel${result[i].image_id}">
					<div class="carousel-caption d-flex flex-column align-items-center justify-content-center">
						<div class="p-3" style="max-width: 700px;">
							<h4 class="text-light text-uppercase font-weight-medium mb-3">${result[i].image_title}</h4>
							<h3 class="display-4 text-white font-weight-semi-bold mb-4">${result[i].image_content}</h3>
							<a href="shop.html" class="btn btn-light py-2 px-3">${result[i].image_button_name}</a>
						</div>
					</div>
				</div>`;
		}
		return resultRow;
	
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function getCarouselImage() {
	try {
		const selectQuery = `SELECT * FROM home_page_layout_images`;
		const result = await queryAsync(selectQuery);
		let resultRow = "";
		
		result.forEach((row) => {
			resultRow += `<option id="${row.image_id }" data-image_path="${row.image_path}" data-image_title="${row.image_title}" data-image_content="${row.image_content}" data-create_at="${row.create_at}">ID: ${row.image_id }, Title: ${row.image_title}, Description: ${row.image_content}, Button Name: ${row.image_button_name}</option>`;
		});
		
		return resultRow;
		
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function createCarouselImage(admin, image_path, image_title, image_content, carouselButtonName) {

	try {
		const insertQuery = `INSERT INTO home_page_layout_images (image_path, image_title, image_content, image_button_name) VALUES (?, ?, ?, ?)`;
		const result = await queryAsync(insertQuery, [image_path, image_title, image_content, carouselButtonName]);
			
		return result;
	
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

async function deleteCarouselImage(admin, carouselImageId) {

	try {
		const deleteQuery = `DELETE FROM home_page_layout_images WHERE image_id  = ?`;
		const result = await queryAsync(deleteQuery, [carouselImageId]);
			
		return result;
	
	} catch (error) {
        console.error("Error executing query:", error.message);
        throw error;
    }
}

module.exports = { 
	getCarouselImage,
	getHomeCarouselImage,
	createCarouselImage,
	deleteCarouselImage
 };
