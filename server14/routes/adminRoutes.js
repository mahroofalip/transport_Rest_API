const express = require("express");
const router = express.Router();
const {
  adminLogin,
  adminRegister,
  createCustomer,
  manageCutomers,
  blockCustomer,
  unblockCustomer,
  addComment,
  addWallet,
  getSingleCustomer,
  createPricingTableData,
  pricingData,
  getSinglePricingType,
  updatePricing,
  updateRentalPricing,
  addDriverBanner,
  getDriverBanner,
  updateDriverBanner,
  deleteDriverBanner,
  addUserBanner,
  getUserBanner,
  updateUserBanner,
  deleteUserBanner,
  getBookings,
  getUserOrders,
  bookingAddComment,
  bookingUnAssignComment,
  bookingCancelComment,
  getDriverList,
  approveDriver,
  getDriverDetails,
  addDriverWallet,
  addDriverComment,
  updateDriverVehicleDetails,
  updateDriverPanDetails,
  updateDriverPersonalDetails,
  updateDriverRcDetails,
  updateDriverAadhaarDetails,
  updateDriverVaccineDetails,
  updateDriverBankDetails,
  updateDriverLicenseDetails,
  updateInsuranceDetails,
  generatePromocode,
  createPromocode,
  getAllPromocodes,
  deletePromocode,
  activeInactivePromocode,
  updatePromocode,
  getSinglePromocode,
  getDriverCommets,
  getCustomerComment,
  blockDriver,
  unblockDriver,
  addCommision,
  getWithdrawalRequests,
  promotionNotification,
  getDriverReviews,
  getWithdrawalRequestDriverDetails,
  rejectWithdrawalRequest,
  approveWithdrawaRequest,
  getCommisonRate,
  driverCurrentLocationBooking,
  updateVersion,
  getVersion,
  getDashboardDetails,
  getDashboardGraph,
  subAdminsList,
  createSubAdmin,
  editSubAdmin,
  deleteSubAdmin,
  resetPassword,
  adminCheckPassword,
  adminEditDetails,
  createClaimOffers,
  getClaimOffers,
  createCoinPricing,
  testCoinPricing,
  getCoinPricing,
  updateCoinPricing,
  updateClaimOffers,
  getOfferClaimRequests,
  deleteCoinPricing,
  deleteClaimOffers,
  approveOrRejectOfferClaim,
  getCustomerCoinLogs,
  driverRejection,
  driverTransactions,
  customerTransactions,
  getDriversForNotification,
  getUserListNotification,
  downloadAllDrivers,
  downloadAllCustomers,
  downloadAllBookings
} = require("../controllers/adminController");

const { adminProtect } = require("../middlewares/auth_middlewares");
router.post("/register", adminRegister);
router.post("/login", adminLogin);
router.get("/get-version", adminProtect, getVersion);
router.post("/create-customer", createCustomer);
router.get("/manage-customers", adminProtect, manageCutomers);
router.put("/block-customer", adminProtect, blockCustomer);
router.put("/unblock-customer", adminProtect, unblockCustomer);
router.get("/dashboard/:from/:to/:place", getDashboardDetails);
router.get("/dashboard-graph/:date/:place", getDashboardGraph);
router.post("/add-push-notification", adminProtect, promotionNotification);
router.put("/block-driver", adminProtect, blockDriver);
router.put("/unblock-driver", adminProtect, unblockDriver);
router.put("/add-comment", adminProtect, addComment);
router.put("/add-wallet", adminProtect, addWallet);
router.get("/single-customer/:customerid", adminProtect, getSingleCustomer);
router.post("/create-pricing", createPricingTableData);
router.get("/pricing-data", pricingData);
router.get("/single-pricing-type/:id", adminProtect, getSinglePricingType);
router.post("/update-pricing-type", adminProtect, updatePricing);
router.post("/update-rental-pricing-type", adminProtect, updateRentalPricing);
router.get("/bookings", getBookings);
// router.get("/get-driver-orders/:driverid", getDriverBookings)
router.get("/getorders/:id/:user", getUserOrders);
router.put("/booking-add-comment", adminProtect, bookingAddComment);
router.put("/booking-unassign-comment", adminProtect, bookingUnAssignComment);
router.put("/booking-cancel-comment", adminProtect, bookingCancelComment);
router.post("/add-driver-banner", adminProtect, addDriverBanner);
router.get("/list-driver-banner", adminProtect, getDriverBanner);
router.put("/update-driver-banner", adminProtect, updateDriverBanner);
router.delete("/delete-driver-banner/:id", adminProtect, deleteDriverBanner);
router.post("/add-user-banner", adminProtect, addUserBanner);
router.get("/list-user-banner", adminProtect, getUserBanner);
router.put("/update-user-banner", adminProtect, updateUserBanner);
router.delete("/delete-user-banner/:id", adminProtect, deleteUserBanner);
router.get("/list-drivers", getDriverList); //adminProtect
router.get("/list-drivers-for-notification", getDriversForNotification);
router.put("/approve-driver", adminProtect, approveDriver);
router.get("/driver-details/:id", getDriverDetails);
router.get("/get-driver-comment/:id", adminProtect, getDriverCommets);
router.get("/get-customer-comment/:id", adminProtect, getCustomerComment);
router.put("/add-driver-wallet", adminProtect, addDriverWallet);
router.put("/add-driver-comment", adminProtect, addDriverComment);
router.post("/check-password", adminProtect, adminCheckPassword);
router.put("/update-admin-details", adminProtect, adminEditDetails);
router.put("/update-admin-details", adminProtect, adminEditDetails);
// router.post("/driver-rejection",adminProtect,reject)
router.put(
  "/edit-driver-personal-details",
  adminProtect,
  updateDriverPersonalDetails
);
router.put("/edit-driver-rc-details", adminProtect, updateDriverRcDetails);
router.put(
  "/edit-driver-aadhaar-details",
  adminProtect,
  updateDriverAadhaarDetails
);
router.put(
  "/edit-driver-Vaccine-details",
  adminProtect,
  updateDriverVaccineDetails
);
router.put(
  "/edit-driver-insurance-details",
  adminProtect,
  updateInsuranceDetails
);
router.put(
  "/edit-driver-license-details",
  adminProtect,
  updateDriverLicenseDetails
);
router.put(
  "/edit-driver-vehicle-details",
  adminProtect,
  updateDriverVehicleDetails
);
router.put("/edit-driver-pan-details", adminProtect, updateDriverPanDetails);
router.put("/edit-driver-bank-details", adminProtect, updateDriverBankDetails);
router.get("/generate-promocode", generatePromocode);
router.post("/create-promocode", adminProtect, createPromocode);
router.get("/get-all-promocodes", adminProtect, getAllPromocodes);
router.delete("/delete-promocode/:id", adminProtect, deletePromocode);
router.put("/promocode-active-inactive", adminProtect, activeInactivePromocode);
router.put("/update-promocode", adminProtect, updatePromocode);
router.get("/single-promocode/:id", adminProtect, getSinglePromocode);

router.get("/current-commision", adminProtect, getCommisonRate);
router.post("/add-commision", adminProtect, addCommision);
router.get("/withdrawal-requests", adminProtect, getWithdrawalRequests);
router.get(
  "/withdrawal-requests-driver-details/:id",
  getWithdrawalRequestDriverDetails
);
router.post(
  "/reject-withdrawal-request",
  adminProtect,
  rejectWithdrawalRequest
);
router.post("/approve-withdraw-request", adminProtect, approveWithdrawaRequest);

router.get(
  "/current-driver-location/:id",
  adminProtect,
  driverCurrentLocationBooking
);

router.get("/list-subadmins", adminProtect, subAdminsList);
router.put("/update-version", adminProtect, updateVersion);
router.put("/reset-password", resetPassword);
router.post("/create-subadmin", adminProtect, createSubAdmin);
router.post("/edit-subadmin", adminProtect, editSubAdmin);
router.delete("/delete-sub-admin/:id", adminProtect, deleteSubAdmin);
router.get("/manage-customers-notification", getUserListNotification);
router.get("/driver-reviews/:driverid", getDriverReviews);
router.post("/create-claim-offers", createClaimOffers);
router.get("/get-claim-offers", getClaimOffers);
router.put("/update-claim-offers", updateClaimOffers);
router.delete("/delete-claim-offer/:id", deleteClaimOffers);
router.post("/create-coin-pricing", createCoinPricing);
router.put("/update-coin-pricing", updateCoinPricing);
router.delete("/delete-coin-pricing/:id", deleteCoinPricing);
router.get("/get-coin-pricing", getCoinPricing);
router.get("/offer-claim-requests", getOfferClaimRequests);
router.put("/offer-claim-request-approve", approveOrRejectOfferClaim);
router.get("/get-customer-coinlogs/:id", getCustomerCoinLogs);
router.post("/driver-rejection", adminProtect, driverRejection);
router.get("/driver-transactions", adminProtect, driverTransactions);
router.get("/customer-transactions", adminProtect, customerTransactions);
router.post("/test", testCoinPricing);
router.get("/download-all-drivers", downloadAllDrivers);
router.get('/download-all-users',downloadAllCustomers)
router.get('/download-all-bookings',downloadAllBookings)


module.exports = router;
