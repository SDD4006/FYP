require('dotenv').config({path:`../../.env`});
const util = require("util");
const conn = require("../mysqlController.js");
const siteLink = process.env.siteLink;
const queryAsync = util.promisify(conn.connection.query).bind(conn.connection);

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

async function getPageProduct(page, minPrice, maxPrice, method, productName, productCategory, keywords) {
	const maxNum = (page - 1) * 20 + 20;
	const minNum = (page - 1) * 20;
	let selectQuery = `select count(*) as product_Count from product order by create_at desc limit ${maxNum} offset ${minNum};`;
	let selectQuery2 = `select * from product order by create_at desc limit ${maxNum} offset ${minNum};`;
	let productNum;
	let resultRow = "";
	let productCount;
	
	let result = "";
	try {
		if (productCategory != null && productCategory != "null") {
			selectQuery = `select count(*) as product_Count from product where categories_id = ? order by create_at desc limit ? offset ?;`;
			result = await queryAsync(selectQuery, [productCategory, maxNum, minNum]);
			
			if (result.length > 0)
				productCount = result[0].product_Count;
			else 
				productCount = 0;
			
			selectQuery2 = `select * from product where categories_id = ? order by create_at desc limit ? offset ?;`;
			result = await queryAsync(selectQuery2, [productCategory, maxNum, minNum]);
		}
		else {
			result = await queryAsync(selectQuery, [maxNum, minNum]);
			
			if (result.length > 0)
				productCount = result[0].product_Count;
			else 
				productCount = 0;
			
			result = await queryAsync(selectQuery2, [maxNum, minNum]);
		}

		result.forEach((row) => {
			let pageContent = `<div class="col-lg-2 col-md-6 col-sm-12 pb-1">
				<div class="card product-item border-0 mb-4">
					<div class="card-header product-img position-relative overflow-hidden bg-transparent border p-0">
						<a href="${row.product_url}" target="_blank"><img class="img-fluid w-100" src="${row.product_display_image_url}" style="height=200px; min-height: 200px; max-height: 200px;" alt=""></a>
					</div>
					<div class="card-body border-left border-right text-center p-0 pt-4 pb-3">
						<h6 class="text-truncate mb-3">${row.product_name}</h6>
						<div class="d-flex justify-content-center">
							<h6>$${row.product_price}</h6><h6 class="text-muted ml-2"></h6>
						</div>
					</div>
					<div class="card-footer d-flex justify-content-between bg-light border">
						<a href="${row.product_url}" target="_blank" class="btn btn-sm text-dark p-0"><i class="fas fa-eye text-primary mr-1"></i></a>
						<a onclick="addToCart('${row.product_id}')" class="btn btn-sm text-dark p-0"><i class="fas fa-shopping-cart text-primary mr-1"></i></a>
					</div>
				</div>
			</div>`;
			productNum = row.total_record;
			
			if (keywords != "null") {
				if (row.product_name.includes(keywords) || row.product_description.includes(keywords) || row.product_detail.includes(keywords))
					resultRow += pageContent;
			}
			else 
				resultRow += pageContent;
		});
				
		const pageLinkContent = `<div class="col-12 pb-1">
			<nav aria-label="Page navigation">
			  <ul class="pagination justify-content-center mb-3">
			  ${(parseFloat(page) - 1 !== 0)
				? `<li class="page-item">`
				: `<li class="page-item disabled">`
			   }
				  <a class="page-link" onclick="paging(${parseFloat(page) - 1})" aria-label="Previous">
					<span aria-hidden="true"><</span>
					<span class="sr-only">Previous</span>
				  </a>
				</li>
				${(parseFloat(page) - 1 !== 0)
					? `<li class="page-item"><a class="page-link" onclick="paging(${parseFloat(page) - 1})">${parseFloat(page) - 1}</a></li>`
					: ''
				}

				<li class="page-item active"><a class="page-link" onclick="paging(${parseFloat(page)})">${parseFloat(page)}</a></li>
				${(page * 20 < productCount)
					? `<li class="page-item"><a class="page-link" onclick="paging(${parseFloat(page) + 1}) + ''">${parseFloat(page) + 1}</a></li>
					<li class="page-item">	
					  <a class="page-link" onclick="paging(${parseFloat(page) + 1})" aria-label="Next">
						<span aria-hidden="true">></span>
						<span class="sr-only">Next</span>
					  </a>
					</li>`
					: ''
				}
			  </ul>
			</nav>
		</div>`;
		resultRow += pageLinkContent;
		return resultRow;
	} catch(error) {
        console.error("Error executing query:", error.message);
        throw error;
	}
}

module.exports = { 
	getPageProduct,
 };
