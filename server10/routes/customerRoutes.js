const express = require('express');
const router = express.Router();

const {
  checkCustomer,
  customerSignup,
  customerLogin,
  getCustomer,
  editCustomer,
  getAmount,
  getPricingType,
  getSinglePricingType,
  bookingOrder,
  getTransactionHistory,
  checkPromocode,
  getPromocode,
  cancelOrder,
  getCustomerBanner,
  orderHistory,
  checkEnteredPromocode,
  rentalController,
  rentalPlaceOrder,
  rentalApplyCoupon,
  createReview,
  getCoins,
  createClaimWithdrawalRequest
} = require('../controllers/customerController');
const {
  paytmPayment,
  generateTxnToken,
  verifypayment,
  failedPayment,
} = require('../controllers/paytmController');
const {
  customerProtect,
  check_customerOrDriver,
} = require('../middlewares/auth_middlewares');

router.post('/check', checkCustomer);
router.post('/signup', customerSignup);
router.post('/login', customerLogin);
router.get('/me', customerProtect, getCustomer);
router.put('/me', customerProtect, editCustomer);
router.post('/get-amount', customerProtect, getAmount);
router.get('/pricing-type', customerProtect, getPricingType);
router.get('/single-pricing-type/:id', customerProtect, getSinglePricingType);
router.post('/booking-order', customerProtect, bookingOrder);
router.get('/transaction-history/:id', customerProtect, getTransactionHistory);
router.get('/coupons', customerProtect, getPromocode);
router.post('/cancel-order', customerProtect, cancelOrder);
router.post('/check-promocode', checkPromocode);
router.get('/getBanner', getCustomerBanner);
router.get('/order-history/:id', orderHistory);
router.post('/check-entered-promocode', customerProtect, checkEnteredPromocode)
router.get('/rental', rentalController)
router.post('/rental/place-order', customerProtect, rentalPlaceOrder)
router.get('/rental/coupon/:couponid', rentalApplyCoupon)
router.post('/write-driver-review', customerProtect, createReview)
router.get('/get-coins/:customerid', customerProtect, getCoins)
router.post('/claim-withdrawal-request', customerProtect, createClaimWithdrawalRequest)


// payment
router.post('/paytm-payment', check_customerOrDriver, paytmPayment);
router.post('/generatetxntoken', check_customerOrDriver, generateTxnToken);
router.post('/paytm-verify', check_customerOrDriver, verifypayment);
router.post('/payment-failed', check_customerOrDriver, failedPayment)

module.exports = router;
