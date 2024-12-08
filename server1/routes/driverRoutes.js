const express = require('express');
const router = express.Router();

const {
  personalDetails,
  getDriverBanner,
  checkDriver,
  online,
  fcmGetting,
  vehicleDetails,
  bankDetails,
  getProfile,
  getTransactionHistory,
  updateCurrentLocation,
  orderHistory,
  getBookingDetails,
 getEarningsHistory,
 createReview,
 getDriverRejectedDocuments,
 updateDriverDetails,
 currentLocaionUpdating
} = require('../controllers/driverController');

const {
  paytmPayment,
  generateTxnToken,
  verifypayment,
  failedPayment,
} = require('../controllers/paytmController');

const {
  check_customerOrDriver,
  driverProtect,
} = require('../middlewares/auth_middlewares');

router.post('/check', checkDriver);
// router.post('/page-check',pageCheck)
router.post('/personal-details', personalDetails);
router.post('/vehicle-details', vehicleDetails);
router.post('/bank-details', bankDetails);
router.post('/online', driverProtect, online);
router.post('/fcm', fcmGetting);
router.get('/getBanner', getDriverBanner);
router.put('/current-location', updateCurrentLocation);
router.get('/profile/:id', driverProtect, getProfile);
router.get('/transaction-history/:id', driverProtect, getTransactionHistory);
router.get('/order-history/:id', orderHistory);
router.get('/booking-details/:id', driverProtect, getBookingDetails);
router.get('/earnings-history/:driverid/:date', getEarningsHistory)
router.get('/get-rejected-documents/:id', getDriverRejectedDocuments)

router.put('/update-driver-details', driverProtect, updateDriverDetails)
router.put('/current-location-updating',currentLocaionUpdating)
// paytm
router.post('/paytm-payment', check_customerOrDriver, paytmPayment);
router.post('/generatetxntoken', check_customerOrDriver, generateTxnToken);
router.post('/paytm-verify', check_customerOrDriver, verifypayment);
router.post('/payment-failed', check_customerOrDriver, failedPayment)

module.exports = router;