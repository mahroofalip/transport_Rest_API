const express = require('express');
const router = express.Router();
const {
  subAdminLogin,
  subAdminRegister,
  customerListController,
  addCommentController,
  driverListController,
  driverAddComment,
  bookingList,
  bookingAddComment,
  getDashboardDetails,
  getGraphData
} = require('../controllers/sub_adminController');
const { subAdminProtect } = require('../middlewares/auth_middlewares');
router.put("/booking-add-comment", subAdminProtect, bookingAddComment);
router.post('/register', subAdminRegister);
router.post('/login', subAdminLogin);
router.get('/customer-list', subAdminProtect, customerListController);
router.put('/add-comment', subAdminProtect, addCommentController);
router.get("/driver-list", subAdminProtect, driverListController)
router.put('/add-driver-comment', subAdminProtect, driverAddComment);
router.get('/bookinglist', bookingList)
router.get('/dashboard-graph/:date/:place', getGraphData)
router.get("/dashboard/:from/:to/:place", getDashboardDetails);
module.exports = router;
