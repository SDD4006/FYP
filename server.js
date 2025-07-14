require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');
//const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const multer = require("multer");
const util = require("util");
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const stripe = require('stripe')(process.env.stripe);

const carouselImageManagement = require("./js/carouselImageManagement.js");
const securityQuestionManagement = require("./js/securityQuestionManagement.js");
const productManagement = require("./js/productManagement.js");
const analyseManagement = require("./js/analyseManagement.js");
const cartManagement = require("./js/cartManagement.js");
const shopManagement = require("./js/shopManagement.js");
const userManagement = require("./js/userManagement.js");
const adminAndRoleManagement = require("./js/adminAndRoleManagement.js");
const couponManagement = require("./js/couponManagement.js");
const orderManagement = require("./js/orderManagement.js");
const reviewManagement = require("./js/reviewManagement.js");
const deliveryManagement = require("./js/deliveryManagement.js");
const refundAndReturnManagement = require("./js/refundAndReturnManagement.js");
const categoriesManagement = require("./js/categoriesManagement.js");
const wishListManagement = require("./js/wishListManagement.js");

require('dotenv').config();
const socketio = require('./socketio.js');
const { 
	getHomeCarouselImage,
	getCarouselImage,
	createCarouselImage,
	deleteCarouselImage,
	getSecurityQuestion,
	deleteSecurityQuestion, 
	createSecurityQuestion, 
	getOrder,
	updatePageView,
	getDataByDate,
	getPageView,
	adminLogin,
	getTopProduct,
	userLogin,
	payOrder, 
	updateReviewStatus, 
	adminGetOrder, 
	adminDeleteOrder, 
	adminUpdateOrder, 
	deleteReview, 
	updateRefundAndReturn, 
	reviewManagerGetProduct, 
	reviewManagerGetReview, 
	getRefundRequest, 
	getUser, 
	insertRefund, 
	getRefundProduct, 
	adminUpdateProduct, 
	insertUser, 
	adminGetProduct, 
	adminDeleteProduct, 
	productPageGetProduct, 
	updateUser, 
	deleteUser, 
	deleteCoupon, 
	userGetCoupon, 
	userUseCoupon, 
	getCoupon, 
	updateOrderStatusWhenSuccess, 
	getOrderStatusWhenSuccessfully, 
	createCoupon, 
	removeItem, 
	orderCartItem, 
	getCategories_homePage, 
	getOrderDelivery, 
	updateDelivery, 
	getDelivery, 
	createDelivery, 
	modifyCartItem, 
	getCartItem, 
	insertCartItem, 
	getPageProduct, 
	getReview, 
	insertReview, 
	deleteRole, 
	deleteAdmin, 
	getAdmin, 
	insertCategories, 
	getCategories, 
	updateCategories, 
	insertProduct, 
	getSecureityQuestion, 
	insertAdminRole, 
	getAdminRole, 
	insertAdmin } = require('./mysqlController.js');

const app = express();
const httpApp = express();

const options = {
	key: fs.readFileSync('/etc/letsencrypt/live/toolshop.sadnovice.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/toolshop.sadnovice.com/cert.pem')
};
const server = https.createServer(options, app);

//const server = http.createServer(app);
const siteLink = process.env.siteLink;
const PORT = process.env.PORT || 7777;

let tokenBlacklist = [];

httpApp.get("*", function(req, res, next) {
    res.redirect("https://" + req.headers.host + req.path);
});

app.use(fileUpload());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
    origin: ['http://localhost', 'https://toolshop.sadnovice.com'], // Allowed origins
    credentials: true,
    allowedHeaders: ['X-Requested-With', 'Content-Type', 'x-refresh-token', 'Authorization'],
    exposedHeaders: ['Authorization', 'x-refresh-token'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE']
}));

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
    } else {
        next();
    }
});


socketio(server);

const SECRET_KEY = 'GqEfhAZyM5WaPnynI3CH3qUraT2gK9hHItky';

app.post('/get_home_carouselImage', async (req, res) => {
	try {
        const result = await carouselImageManagement.getHomeCarouselImage(); // Assuming this returns a Promise
		return res.status(200).send(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.post('/get_carouselImage', async (req, res) => {
	try {
        const result = await carouselImageManagement.getCarouselImage(); // Assuming this returns a Promise
		return res.status(200).send(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.post('/create_carouselImage', async (req, res) => {
	const { admin, image_title, image_content, carouselButtonName } = req.body;
    if (!admin || !image_title || !image_content || !req.files)
        return res.status(400).send('Please provide the full body.');
	if (!req.files.carouselImageUpload)
        return res.status(400).send('Please provide the full body.');
	
	try {
		
		const fileBakPath = path.join(__dirname, 'public/carouselImage/');
		if (!fs.existsSync(path.join(__dirname, 'public/carouselImage/'))) {
			fs.mkdirSync(path.join(__dirname, 'public/carouselImage/')); // Create 'products' directory if it doesn't exist
		}
		
		const imageFileName = generateRandomString(10);
		const imageFilePath = siteLink + 'carouselImage/' + imageFileName + req.files.carouselImageUpload.name;
		const imageFileUrl = 'public/carouselImage/' + imageFileName + req.files.carouselImageUpload.name;
	
		req.files.carouselImageUpload.mv(imageFileUrl, (err) => {
			if (err) {
				console.error(err);
				return res.status(500).send('Failed to save the image file.');
			}
		});

        const result = await carouselImageManagement.createCarouselImage(admin, imageFilePath, image_title, image_content, carouselButtonName); // Assuming this returns a Promise
		return res.status(200).send('successfully');
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.post('/delete_carouselImage', async (req, res) => {
	const { admin, carouselImageId } = req.body;
    if (!admin || !carouselImageId) {
        return res.status(400).send('Please provide the full body.');
    }
	
	try {
        const result = await carouselImageManagement.deleteCarouselImage(admin, carouselImageId); // Assuming this returns a Promise
		return res.status(200).send('successfully');
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.post('/delete_securityQuestion', async (req, res) => {
	const { admin, securityQuestionId } = req.body;
    if (!admin || !securityQuestionId) {
        return res.status(400).send('Please provide the full body.');
    }
	
	try {
        const result = await securityQuestionManagement.deleteSecurityQuestion(admin, securityQuestionId); // Assuming this returns a Promise
		return res.status(200).send('successfully');
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.post('/get_securityQuestion', async (req, res) => {
	try {
        const result = await securityQuestionManagement.getSecurityQuestion(); // Assuming this returns a Promise
		return res.status(200).send(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.post('/create_SecurityQuestion', async (req, res) => {
	const { admin, securityQuestionContentInput } = req.body;
    if (!admin || !securityQuestionContentInput) {
        return res.status(400).send('Please provide the full body.');
    }
	
	try {
        const result = await securityQuestionManagement.createSecurityQuestion(admin, securityQuestionContentInput); // Assuming this returns a Promise
		return res.status(200).send("successfully");
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});


app.post('/create_product', async (req, res) => {
	const { admin, name, price, description, detail, stockLevel, parentCategorie, subCategories, url, detailFileNames, productDesplayIconNames} = req.body;
	if (!admin || !name || !price || !description || !detail || !stockLevel || !parentCategorie) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
	
		const product_id = url;
		
		const filePath = path.join(__dirname, 'public/products/' + url + "/" + url + ".html");
		
		const fileBakPath = path.join(__dirname, 'public/products/' + url + "/" + url + ".txt");
		if (!fs.existsSync(path.join(__dirname, 'public/products/'))) {
			fs.mkdirSync(path.join(__dirname, 'public/products/')); // Create 'products' directory if it doesn't exist
		}
		if (!fs.existsSync(path.join(__dirname, 'public/products/' + url))) {
			fs.mkdirSync(path.join(__dirname, 'public/products/' + url)); // Create 'products' directory if it doesn't exist
		}
		if (!fs.existsSync(path.join(__dirname, 'public/products/' + url + "/images/"))) {
			fs.mkdirSync(path.join(__dirname, 'public/products/' + url + "/images/")); // Create 'products' directory if it doesn't exist
		}
		if (!fs.existsSync(path.join(__dirname, 'public/products/' + url + "/displayImages/"))) {
			fs.mkdirSync(path.join(__dirname, 'public/products/' + url + "/displayImages/")); // Create 'products' directory if it doesn't exist
		}
		
		let displayImageUrl = 'products/' + url + "/displayImages/";
		
		if (req.files && req.files.productDesplayIcon && productDesplayIconNames) {
			const imageFilePath = 'public/products/' + url + "/images/";
			if (req.files.detailFiles) {
				if (Array.isArray(req.files.detailFiles)) {
					for (let i = 0; i < req.files.detailFiles.length; i++) {
						req.files.detailFiles[i].mv(imageFilePath + detailFileNames[i], (err) => {
							if (err) {
								console.error(err);
								return res.status(500).send('Failed to save the image file.');
							}
						});
					}
				}
				else {
					req.files.detailFiles.mv(imageFilePath + detailFileNames, (err) => {
						if (err) {
							console.error(err);
							return res.status(500).send('Failed to save the image file.');
						}
					});
				}
			}
			
			const displayFilesPath = 'public/products/' + url + "/displayImages/";
			if (Array.isArray(req.files.productDesplayIcon)) {
				for (let i = 0; i < req.files.productDesplayIcon.length; i++) {
					
					req.files.productDesplayIcon[i].mv(displayFilesPath + productDesplayIconNames[i], (err) => {
						if (err) {
							console.error(err);
							return res.status(500).send('Failed to save the image file.');
						}
					});
				}
				displayImageUrl += productDesplayIconNames[0];
			}
			else {
				req.files.productDesplayIcon.mv(displayFilesPath + productDesplayIconNames, (err) => {
					if (err) {
						console.error(err);
						return res.status(500).send('Failed to save the image file.');
					}
				});
				displayImageUrl += productDesplayIconNames;
			}
		}
		else {
			return res.status(400).send('Please upload display images');
		}
		
		fs.readFile(path.join(__dirname, 'contentTemplate/productTemplate.html'), 'utf8', async (err, data) => {
			let bakData = data;
			
			if (err) {
			  console.error('Error reading template:', err); // Log the error for debugging
			  return res.status(500).send('Failed to read the template file.');
			}
		
			data = data.replace("${detail}", detail);
			
			if (req.files.detailFiles) {
				if (Array.isArray(req.files.detailFiles)) {
					for (let i = 0; i < req.files.detailFiles.length; i++) {
						data = data.replace("(img){" + detailFileNames[i] + "}", '<img src="' + siteLink + 'products/' + url + "/images/" + detailFileNames[i] + '"width="1600" height="900"/>');
					}
				}
				else {
					data = data.replace("(img){" + detailFileNames + "}", '<img src="' + siteLink + 'products/' + url + "/images/" + detailFileNames + '"width="1600" height="900"/>');
				}
			}

			if (req.files.productDesplayIcon) {
				if (Array.isArray(req.files.productDesplayIcon)) {
					data += `<script> document.getElementById("productDesplayIconDiv").innerHTML = '`;
					data += `<div class="carousel-item active">`;
					data += `<img class="w-100 h-100" src="${siteLink}products/${url}/displayImages/${productDesplayIconNames[0]}" />`;
					data += `</div>`;
					for (let i = 1; i < req.files.productDesplayIcon.length; i++) {
						data += `<div class="carousel-item">`;
						data += `<img class="w-100 h-100" src="${siteLink}products/${url}/displayImages/${productDesplayIconNames[i]}" />`;
						data += `</div>`;
					}
				}
				else {
					data += `<script>document.getElementById("productDesplayIconDiv").innerHTML = '`;
					data += `<div class="carousel-item active">`;
					data += `<img class="w-100 h-100" src="${siteLink}products/${url}/displayImages/${productDesplayIconNames}" />`;
					data += `</div>`;
				}
			}
			data += `';</script>`;
			data += `<script> const productId = "${url}"; </script>`;
			data += `<script src="${siteLink}js/globalFunction.js"></script>
					<script src="${siteLink}js/productPage.js"></script>`;
			data += `<script src="${siteLink}js/productContent.js"></script>`;
			
			fs.writeFile(filePath, data, (err) => {
				if (err) {
					return res.status(500).send('Failed to save product HTML file.');
				}
				fs.writeFile(fileBakPath, bakData, (err) => {
					if (err) {
						return res.status(500).send('Failed to save product HTML file.');
					}
				});
			});
			
			const productCreated = stripe.products.create({
				name: name,
				description: description,
				default_price_data: {
					currency: 'hkd',
					unit_amount: parseFloat(price) * 100, // Convert to cents
				},
			});
			
			const result = await productManagement.insertProduct(admin, product_id, name, price, siteLink + "products/" + url + "/" + url + ".html", displayImageUrl, description, detail, parentCategorie, stockLevel, detailFileNames, productDesplayIconNames); // Assuming this returns a Promise
			return res.status(200).send("successfully");
					
		});
	} catch (error){
        console.error(error);
        return res.status(500).end();
	}
		
});

app.post('/admin_GetProduct', async (req, res) => {

	try {
		const result = await productManagement.adminGetProduct(); // Assuming this returns a Promise
		return res.status(200).send(result);
	} catch (error) {
        console.error(error);
        return res.status(500).end();
	}
});

app.post('/get_data_by_date', async (req, res) => {
	const { dateA, dateB, type} = req.body;

	if (!dateA || !dateB || !type) {
        return res.status(400).send('Please provide the full body.');
    }
	try {
		const result = await analyseManagement.getDataByDate(dateA, dateB, type); // Assuming this returns a Promise
		return res.status(200).json(result);
	} catch (error) {
        console.error(error);
        return res.status(500).end();
	}
});

app.post('/getTopProduct', async (req, res) => {
	const { date } = req.body;
	
	if (!date) {
        return res.status(400).send('Please provide the full body.');
    }
	try {
		const result = await analyseManagement.getTopProduct(date); // Assuming this returns a Promise
		return res.status(200).json(result);
	} catch (error) {
        console.error(error);
        return res.status(500).end();
	}
});

app.post('/get_page_view', async (req, res) => {
	const { unique, page, date } = req.body;
	
	if (!unique || !page || !date) {
        return res.status(400).send('Please provide the full body.');
    }
	
    try {
		const result = await analyseManagement.getPageView(unique, page, date); // Assuming this returns a Promise
		return res.status(200).json(result);
	} catch (error) {
        console.error(error);
        return res.status(500).end();
	}
});

app.post('/udpate_page_view', async (req, res) => {
	const { userId, page } = req.body;
	const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	const hongKongTime = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" }).toString();

	let date = hongKongTime;
	
	if (date.includes(',')) 
		date = hongKongTime.split(',')[0].replaceAll("/", "-");
	
    if (!page) {
        return res.status(400).send('Please provide the full body.');
    }
	if (!userId || userId == "")
		userId = null;

	try {
		const result = await analyseManagement.updatePageView(userId, page, userIp, date); // Assuming this returns a Promise
		return res.status(200).json(result);
	} catch (error) {
        console.error(error);
        return res.status(500).end();
	}
});

app.post('/get_cartItem', async (req, res) => {
    const { userId, isOrder } = req.body;
    if (!userId || !isOrder) {
        return res.status(400).send('Please provide the full body.');
    }

    try {
        const result = await cartManagement.getCartItem(userId, isOrder); // Call the async function
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/productPage_getProduct', async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).send('Please provide the full body.');
    }
	
	try {
        const result = await productManagement.productPageGetProduct(productId); // Call the async function
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/modify_cartItem', async (req, res) => {
    const { productGridId, quantity } = req.body;
    if (!productGridId || !quantity) {
        return res.status(400).send('Please provide the full body.');
    }
	
	try {
        const result = await cartManagement.modifyCartItem(productGridId, quantity); // Call the async function
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/pay_order', async (req, res) => {
    const { userId, order } = req.body;
    if (!userId || !order) {
        return res.status(400).send('Please provide the full body.');
    }

    payOrder((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		return res.status(200).send(result);
	}, userId, order);
});

app.post('/getProductContent', async (req, res) => {
	const { page, minPrice, maxPrice, method, productName, productCategory, keywords} = req.body;
	if (!page) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await shopManagement.getPageProduct(page, minPrice, maxPrice, method, productName, productCategory, keywords); // Call the async function
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/getUser', async (req, res) => {
	try {
        const result = await userManagement.getUser(); // Call the async function
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/deleteUser', async (req, res) => {
	const { admin, userId} = req.body;
	if (!admin || !userId) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await userManagement.deleteUser(admin, userId); // Call the async function
        return res.status(200).send('successfully');
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/updateUser', async (req, res) => {
	const { admin, userId, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer} = req.body;
	if (!admin || !userId || !userEmail || !userPassword || !userStatusSelection || !userSecuityQuestionSelection || !userSecuityQuestionAnswer) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await userManagement.updateUser(admin, userId, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer); // Call the async function
        return res.status(200).send('successfully');
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/adminUpdateProduct', async (req, res) => {
	const { admin, product_id, product_name, product_price, product_description, categories_id, stock_level } = req.body;

	if (!admin || !product_id|| !product_name || !product_price || !product_description || !categories_id || !stock_level) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await productManagement.adminUpdateProduct(admin, product_id, product_name, product_price, product_description, categories_id, stock_level);
        return res.status(200).send('admin update successfully! ' + result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/createUser', async (req, res) => {
	const { admin, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer} = req.body;
	if (!admin || !userEmail || !userPassword || !userStatusSelection || !userSecuityQuestionSelection || !userSecuityQuestionAnswer) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await userManagement.insertUser(admin, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer);
        return res.status(200).send('User create successfully! ');
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/create_admin', async (req, res) => {
	const { admin, name, email, adminPassword, roleId, isActive} = req.body;
	if (!name || !email || !adminPassword || !roleId || !isActive) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await adminAndRoleManagement.insertAdmin(admin, name, email, adminPassword, roleId, isActive);
        return res.status(200).send('Admin create successfully! ');
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/create_coupon', async (req, res) => {
	const { userId, name, couponTarget, description, couponType, discountAmount, couponUsageLimit, expirationDate} = req.body;
	if (!userId || !couponTarget || !name || !description || !couponType || !discountAmount || !couponUsageLimit || !expirationDate) {
		return res.status(400).send('Please provide the full body.');
	}

	let url = "";


	if (!fs.existsSync(path.join(__dirname, 'public/coupon'))) {
		fs.mkdirSync(path.join(__dirname, 'public/coupon/'));
	}
	
	if (req.files) {
		if (req.files.couponImage) {
			const fileType = req.files.couponImage.name.split('.').pop();
			url = generateRandomString(50) + "." + fileType;
			const imageFilePath = 'public/coupon/' + url;
			req.files.couponImage.mv(imageFilePath, (err) => {
				if (err) {
					console.error(err);
					return res.status(500).send('Failed to save the image file.');
				}
			});
		}
	}
	else 
		return res.status(400).send('Please provide coupon icon.');

	try {
        const result = await couponManagement.createCoupon(generateRandomString(6), userId, couponTarget, name, description, couponType, discountAmount, couponUsageLimit, expirationDate, url);
        return res.status(200).send('Coupon inserted successfully! ');
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/deleteCoupon', async (req, res) => {
	const { userId, coupon } = req.body;
	if (!userId || !coupon) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await couponManagement.deleteCoupon(userId, coupon);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/userGetCoupon', async (req, res) => {
	const { userId } = req.body;
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await couponManagement.userGetCoupon(userId);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/userUseCoupon', async (req, res) => {
	const { userId, coupon } = req.body;
	if (!userId || !coupon) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await couponManagement.userUseCoupon(userId, coupon);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/getCoupon', async (req, res) => {
	try {
        const result = await couponManagement.getCoupon();
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/getWishListItem', async (req, res) => {
	const { userId } = req.body;
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await wishListManagement.getWishListItem(userId);
        return res.status(200).json(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/deleteWishListItem', async (req, res) => {
	const { wishListItemId } = req.body;
	if (!wishListItemId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await wishListManagement.deleteWishListItem(wishListItemId);
        return res.status(200).json(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/updateWishListItem', async (req, res) => {
	const { wishListItemId, action, productQuantity } = req.body;
	if (!wishListItemId || !action || !productQuantity) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await wishListManagement.updateWishListItem(wishListItemId, action, productQuantity);
        return res.status(200).end();
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/createWishListItem', async (req, res) => {
	const { productId, productQuantity, cartItemId, wishListId } = req.body;

	if (!productId || !productQuantity || !cartItemId || !wishListId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await wishListManagement.createWishListItem(productId, productQuantity, cartItemId, wishListId);
        return res.status(200).end();
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/order', async (req, res) => {
	const { userId, coupon, deliveryId } = req.body;
	if (!userId || !deliveryId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await orderManagement.orderCartItem(userId, coupon, deliveryId);
        return res.status(200).send(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/moveWishListItemToCart', async (req, res) => {
	const { userId, wishListItemId } = req.body;
	if (!userId || !wishListItemId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await cartManagement.moveWishListItemToCart(userId, wishListItemId);
        return res.status(200).send(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/getOrderListForReturn', async (req, res) => {
	const { userId } = req.body;
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await orderManagement.getOrderListForReturn(userId);
        return res.status(200).json(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/orderStatus', async (req, res) => {
	const { order } = req.body;
	if (!order) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await orderManagement.getOrderStatusWhenSuccessfully(order);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/updateOrderStatusWhenSuccess', async (req, res) => {
	const { order, action, userId } = req.body;
	if (!order || !action || !userId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await orderManagement.updateOrderStatusWhenSuccess(order, action, userId);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/add_cartItem', async(req, res) => {
	const { productId, userId, quantity} = req.body;
	
	if (!productId || !userId || !quantity) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await cartManagement.insertCartItem(productId, userId, quantity);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/insert_review', async (req, res) => {
	const { productId, userId, userIconUrl, userName, reviewMessage, isActive} = req.body;
	if (!productId || !userId || !userName || !reviewMessage || !isActive) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await reviewManagement.insertReview(productId, userId, userIconUrl, userName, reviewMessage, isActive);
        return res.status(200).send('Rewiew inserted successfully! ');
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/create_role', async (req, res) => {
	const { name, description } = req.body;	
	
	if (!name || !description) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await adminAndRoleManagement.insertAdminRole(name, description);
        return res.status(200).send('Admin role inserted successfully! ');
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/create_delivery', async (req, res) => {
	const { userId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode, isPrimary} = req.body;	
	
	const cityCode2 = '000000';
	
	if (!userId || !firstName || !lastName || !contactEmail || !contactPhone || !address1 || !address2 || !region || !cityArea || !city || !cityCode2 || !isPrimary) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await deliveryManagement.createDelivery(userId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode2, isPrimary);
        return res.status(200).send('Admin role inserted successfully! ');
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/update_delivery', async (req, res) => {
	const { userId, deliveryGroup, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode, isPrimary} = req.body;	
	
	const cityCode2 = '000000';
	
	if (!userId || !deliveryGroup || !firstName || !lastName || !contactPhone || !contactEmail || !address1 || !address2 || !region || !cityArea || !city || !cityCode2 || !isPrimary) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await deliveryManagement.updateDelivery(userId, deliveryGroup, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode2, isPrimary);
        return res.status(200).send('Delivery inserted successfully! ');
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/get_order', async (req, res) => {
	
	const {userId} = req.body;
	
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await orderManagement.getOrder(userId);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/reviewManagerGetProduct', async (req, res) => {
	try {
        const result = await productManagement.reviewManagerGetProduct();
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/deleteReview', async (req, res) => {
	const {admin, review, oldContent, user_id} = req.body;
	if (!admin || !review || !oldContent || !user_id) {
		return res.status(400).send('Please provide the full body.');
	}

	try {
        const result = await reviewManagement.deleteReview(admin, review, oldContent, user_id);
        return res.status(200).send("successfully");
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/updateReviewStatus', async (req, res) => {
	const {admin, review, reviewContent, reviewStatus, modifyCount, oldContent, user_id} = req.body;
	if (!admin || !review || !reviewContent || !reviewStatus || !modifyCount || !oldContent || !user_id) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await reviewManagement.updateReviewStatus(admin, review, reviewContent, reviewStatus, modifyCount, oldContent, user_id);
        return res.status(200).send("successfully");
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/reviewManagerGetReview', async (req, res) => {
	const {product} = req.body;
	
	if (!product) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await reviewManagement.reviewManagerGetReview(product);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/insertRefund', async (req, res) => {
	
	const {userId, orderItemId, reason, isReturn} = req.body;
	
	if (!userId || !orderItemId || !reason || !isReturn) {
		return res.status(400).send('Item Not Found');
	}
	
	try {
        const result = await refundAndReturnManagement.insertRefund(generateRandomString(20), userId, orderItemId, reason, isReturn);
        return res.status(200).send("successfully");
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/updateRefundAndReturn', async (req, res) => {
	
	const {admin, refundId, refundStatus, returnId, returnStatus} = req.body;

	if (!admin || !refundId || !refundStatus || !returnId || !returnStatus) {
		return res.status(400).send('Item Not Found');
	}
	
	try {
        const result = await refundAndReturnManagement.updateRefundAndReturn(admin, refundId, refundStatus, returnId, returnStatus);
        return res.status(200).send("successfully");
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/getRefundRequest', async (req, res) => {
	try {
        const result = await refundAndReturnManagement.getRefundRequest();
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/get_refundProduct', async (req, res) => {
	
	const {userId, orderItemId} = req.body;
	
	if (!userId || !orderItemId) {
		return res.status(400).send('Item Not Found');
	}
	
	try {
        const result = await refundAndReturnManagement.getRefundProduct(userId, orderItemId);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/remove_item', async (req, res) => {
	
	const {item} = req.body;
	
	if (!item) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await orderManagement.removeItem(item);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/get_delivery', async (req, res) => {
	
	const {userId} = req.body;
	
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await deliveryManagement.getDelivery(userId);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/get_OrderDelivery', async (req, res) => {
	
	const {userId} = req.body;
	
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await deliveryManagement.getOrderDelivery(userId);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/get_role', async (req, res) => {
	try {
        const result = await adminAndRoleManagement.getAdminRole();
        return res.status(200).send(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/get_admin', async (req, res) => {
	try {
        const result = await adminAndRoleManagement.getAdmin();
        return res.status(200).send(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/adminGetOrder', async (req, res) => {
	try {
        const result = await orderManagement.adminGetOrder();
        return res.status(200).send(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/adminDeleteOrder', async (req, res) => {
	const { admin, orderId } = req.body;
	
	if (!admin || !orderId) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await orderManagement.adminDeleteOrder(admin, orderId);
        return res.status(200).send("successfully");
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/adminUpdateOrder', async (req, res) => {
	const { admin, orderId, totalAmount, orderStatus } = req.body;
	
	if (!admin || !orderId || !totalAmount || !orderStatus) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await orderManagement.adminUpdateOrder(admin, orderId, totalAmount, orderStatus);
        return res.status(200).send("successfully");
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});


app.post('/get_review', async (req, res) => {
	const { productId } = req.body;
	
	if (!productId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await reviewManagement.getReview(productId);
        return res.status(200).send(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/admin_deleteProduct', async (req, res) => {
	const { admin, product } = req.body;
	
	if (!admin || !product) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await productManagement.adminDeleteProduct(admin, product);
        return res.status(200).send('successfully');
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/delete_admin', async (req, res) => {
	const { operatedAdmin, adminId} = req.body;
	
	if (!operatedAdmin || !adminId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await adminAndRoleManagement.deleteAdmin(operatedAdmin, adminId);
        return res.status(200).send('successfully');
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/delete_role', async (req, res) => {
	const { roleId } = req.body;
	
	try {
        const result = await adminAndRoleManagement.deleteRole(roleId);
        return res.status(200).send('successfully');
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/create_user', async (req, res) => {
	const { admin, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer } = req.body;	
	
	if (!admin || !userEmail || !userPassword || !userStatusSelection || !userSecuityQuestionSelection || !userSecuityQuestionAnswer) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await userManagement.insertUser(admin, userEmail, userPassword, userStatusSelection, userSecuityQuestionSelection, userSecuityQuestionAnswer);
        return res.status(200).send('successfully');
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/create_categorie', async (req, res) => {
	const { admin, action, categorieName, parentCategorie, categorieDescription } = req.body;	

	if (!admin || !action || !categorieName || !parentCategorie || !categorieDescription) {
		return res.status(400).send('Please provide the full body.');
	}
	
	try {
        const result = await categoriesManagement.insertCategories(admin, categorieName, parentCategorie, categorieDescription);
        return res.status(200).send('Category inserted successfully!');
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/update_categorie', async (req, res) => {
	const { admin, action, categorieId, categorieName, parentCategorie, categorieDescription } = req.body;	
	if (!admin || !action || !categorieId|| !categorieName || !parentCategorie || !categorieDescription) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await categoriesManagement.updateCategories(admin, action, categorieId, categorieName, parentCategorie, categorieDescription);
        return res.status(200).send('Category updated successfully! ');
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/delete_categorie', async (req, res) => {
	const {admin, action, categorieId} = req.body;	
	if (!admin || !action || !categorieId) {
		return res.status(400).send('Please provide the full body.');
	}
	try {
        const result = await categoriesManagement.updateCategories(admin, action, categorieId);
        return res.status(200).send('Delete category successfully! ');
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/get_categorie', async (req, res) => {
	const { action } = req.body
	try {
        const result = await categoriesManagement.getCategories(action);
        return res.status(200).send(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/get_categorie_homePage', async (req, res) => {
	try {
        const result = await categoriesManagement.getCategories_homePage();
        return res.status(200).send(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/getSecureityQuestion', async (req, res) => {
	const { action } = req.body
	
	try {
        const result = await securityQuestionManagement.getSecureityQuestion();
        return res.status(200).send(result);
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/login', async (req, res) => {
  const { userEmail, password } = req.body;

	try {
        const result = await userManagement.userLogin(userEmail, password);

		if (result != "fail"){
			const accessToken = jwt.sign({ userEmail }, SECRET_KEY, { expiresIn: '1h' });
			const refreshToken = jwt.sign({ userEmail }, SECRET_KEY, { expiresIn: '7d' });
			
			res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 60 * 60 * 1000 // 15 minutes expiration
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
            });

			
			res.status(200).json(result);
		}
		else {
			res.status(401).json('fail');
		}
    } catch (err) {
		console.log(err);
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/adminLogin', async (req, res) => {
  const { userEmail, password } = req.body;

	try {
        const result = await adminAndRoleManagement.adminLogin(userEmail, password);

		if (result != "fail"){
			const adminAccessToken = jwt.sign({ userEmail }, SECRET_KEY, { expiresIn: '1h' });
			const adminRefreshToken = jwt.sign({ userEmail }, SECRET_KEY, { expiresIn: '7d' });
			
			res.cookie('adminAccessToken', adminAccessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 60 * 60 * 1000
            });

            res.cookie('adminRefreshToken', adminRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
			res.status(200).json({ adminAccessToken, adminRefreshToken, result });
		}
		else {
			res.status(401).json('fail');
		}
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/logout', async (req, res) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict'
    });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict'
    });

    return res.json({ message: 'Logged out successfully' });
});

app.get('/protected', (req, res) => {

	if (!req.cookies)
        return res.status(401).json({ message: 'Access denied: Token invalidated' });
	if (!req.cookies.accessToken && !req.cookies.refreshToken)
        return res.status(401).json({ message: 'Access denied: Token invalidated' });
	
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken) {
        return res.status(401).json({ message: 'Access denied: Missing access token' });
    }

    if (tokenBlacklist.includes(accessToken)) {
        return res.status(401).json({ message: 'Access denied: Token invalidated' });
    }

    try {
        // Verify Access Token
        const verified = jwt.verify(accessToken, SECRET_KEY);
        return res.status(200).json({ message: 'Access granted', user: verified });
    } catch (err) {
        // Handle Expired Access Token
        if (err.name === 'TokenExpiredError') {
            if (!refreshToken) return res.status(401).json({ message: 'Access denied: Missing refresh token' });

            try {
                // Verify Refresh Token
                const verifiedRefresh = jwt.verify(refreshToken, SECRET_KEY);

                // Generate a new Access Token
				const newAccessToken = jwt.sign({ username: verifiedRefresh.username }, SECRET_KEY, { expiresIn: '1h' });
				const newRefreshToken = jwt.sign({ username: verifiedRefresh.username }, SECRET_KEY, { expiresIn: '7d' });

                // Set new Access Token in HTTP-Only Cookie
                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Strict',
                    maxAge: 60 * 60 * 1000 // 60 minutes
                });
                // Set new Access Token in HTTP-Only Cookie
                res.cookie('refreshToken', newRefreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Strict',
					maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
                return res.status(200).json({ message: 'Access granted with refreshed token', user: verifiedRefresh });
            } catch (refreshErr) {
                return res.status(401).json({ message: 'Access denied: Invalid refresh token' });
            }
        } else {
            return res.status(400).json({ message: 'Access denied: Invalid token' });
        }
    }
});

app.get('/adminProtected', (req, res) => {
	const accessToken = req.headers['authorization'];
	const refreshToken = req.headers['x-refresh-token'];
	const { userEmail, password } = req.body;

	if (!accessToken) return res.status(401).json({ message: 'Access denied: Missing access token' });

	if (tokenBlacklist.includes(accessToken)) {
		return res.status(401).json({ message: 'Access denied: Token invalidated' });
	}

	try {
	// Verify Access Token
		const verified = jwt.verify(accessToken, SECRET_KEY);

		return res.status(200).json({ message: 'Access granted', user: verified });
	} catch (err) {
		// Handle Expired Access Token
		if (err.name === 'TokenExpiredError') {
		  if (!refreshToken) return res.status(401).json({ message: 'Access denied: Missing refresh token' });

		  try {
			// Verify Refresh Token
			const verifiedRefresh = jwt.verify(refreshToken, SECRET_KEY);

			// Generate a new Access Token
			const newAccessToken = jwt.sign({ username: verifiedRefresh.username }, SECRET_KEY, { expiresIn: '1h' });

			// Optional: Rotate Refresh Token for enhanced security
			const newRefreshToken = jwt.sign({ username: verifiedRefresh.username }, SECRET_KEY, { expiresIn: '7d' });

			// Add the new tokens in response headers and body
			res.setHeader('Authorization', newAccessToken);
			res.setHeader('x-refresh-token', newRefreshToken);

			return res.status(200).json({
			  message: 'Access granted with refreshed tokens',
			  user: verifiedRefresh,
			  accessToken: newAccessToken,
			  refreshToken: newRefreshToken,
			});
		  } catch (refreshErr) {
			return res.status(401).json({ message: 'Access denied: Invalid refresh token' });
		  }
		} else {
			console.log(err);
		  // Handle Other Errors (e.g., Invalid Token)
		  return res.status(400).json({ message: 'Access denied: Invalid token' });
		}
	}
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

function authenticateToken(req, res, next) { 
	if (!req.cookies)
        return res.status(401).json({ message: 'Access denied: Token invalidated' });
	if (!req.cookies.accessToken && !req.cookies.refreshToken)
        return res.status(401).json({ message: 'Access denied: Token invalidated' });
	
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    try {
        const decoded = jwt.verify(accessToken, SECRET_KEY); // Verify JWT
        req.user = decoded; // Attach user info to request object
        next(); // Proceed to route handler
    } catch (err) {
        return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
    }
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
