const asyncHandler = require("express-async-handler");
const { v2 } = require("cloudinary");
const cloudinary = v2;
const Driver = require("../models/driver_model");
const BannerDriver = require("../models/driverBanner_model");
const generateToken = require("../utility/generateToken");
const Booking = require("../models/booking_model");
const Version = require("../models/version_model");
const moment = require("moment");
const {
  uploadImages,
  deleteImages,
} = require("../awsConfig/manage_aws_images");
const mongoose = require("mongoose");
const Ids = require("../models/ids_model");
const Fcm = require("../models/driver_app_fcm");
const PendingCount = require("../models/pending_count_model");
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// get time like  1:30:00 PM
function formatAMPM(date) {
  var currentOffset = date.getTimezoneOffset();
  var ISTOffset = 330; // IST offset UTC +5:30
  var ISTTime = new Date(date.getTime() + (ISTOffset + currentOffset) * 60000);
  // ISTTime now represents the time in IST coordinates
  var hoursIST = ISTTime.getHours();
  var hoursIST2 = ISTTime.getHours();
  var minutesIST = ISTTime.getMinutes();
  var secondsIST = ISTTime.getSeconds();
  hoursIST = hoursIST % 12;
  hoursIST = hoursIST ? hoursIST : 12; // the hour '0' should be '12'
  var ampm = hoursIST2 >= 12 ? "PM" : "AM";
  minutesIST = minutesIST < 10 ? "0" + minutesIST : minutesIST;
  secondsIST = secondsIST < 10 ? "0" + secondsIST : secondsIST;
  var str = hoursIST + ":" + minutesIST + ":" + secondsIST + " " + ampm;
  return str;
}

// get today date
function todayDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  today = dd + "/" + mm + "/" + yyyy;
  return today;
}

// generating customer custom id
// function padLeadingZeros(num, size) {
//   var s = num + "";
//   while (s.length < size) s = "0" + s;
//   return s;
// }

async function generateId() {
  const len = await Driver.count();
  const id = "LR" + len;
  return id;
}

// async function generateId() {
//   var len = await Driver.count().exec();
//   var count = parseInt(len) + 1;

//   var code = padLeadingZeros(count, 3);
//   const id = "LRD" + code;
//   return id;
// }

module.exports = {
  // @desc check phoneNumber is exist or not
  // POST /api/driver/check
  // @access PUBLIC

  checkDriver: asyncHandler(async (req, res) => {
    try {
      const versionCheck = await Version.findById(
        "62f0a855ac5e9723815c4f74"
      ).exec();
      var updateAvailable;
      if (versionCheck.version === req.body.appVersion) {
        updateAvailable = false;
      } else {
        updateAvailable = true;
      }
      const { phoneNumber, fcmToken } = req.body;
      const checkPhoneNumber = await Driver.findOne({
        "personalDetails.defaultPhoneNumber": phoneNumber,
      }).exec();
      console.log(checkPhoneNumber);
      if (checkPhoneNumber) {
        const orderCheking = await Booking.find({
          driverId: checkPhoneNumber._id,
          $or: [
            { status: "Assigned" },
            { status: "Confirming" },
            { status: "Ongoing" },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(1)
          .exec();

        if (fcmToken) {
          let driver = await Driver.findByIdAndUpdate(checkPhoneNumber._id, {
            fcmToken: fcmToken,
          }).exec();
        }

        if (checkPhoneNumber.status === "Active") {
          if (orderCheking[0]) {
            // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
            // console.log({
            //   jj : orderCheking[0].status,
            //   updateAvailable: updateAvailable,
            //   exist: true,
            //   page: "orderPending",
            //   bookingId: orderCheking[0].Id,
            //   orderId: orderCheking[0].bookingId,
            //   id: checkPhoneNumber._id,
            //   token: generateToken(checkPhoneNumber._id),
            // });
            res.json({
              updateAvailable: updateAvailable,
              exist: true,
              page: "orderPending",
              bookingId: orderCheking[0].Id,
              orderId: orderCheking[0].bookingId,
              id: checkPhoneNumber._id,
              token: generateToken(checkPhoneNumber._id),
            });
          } else {
            res.json({
              updateAvailable: updateAvailable,
              exist: true,
              page: "home",
              bookingId: "",
              orderId: "",
              id: checkPhoneNumber._id,
              token: generateToken(checkPhoneNumber._id),
            });
          }
        } else if (checkPhoneNumber.status === "PendingVehicleDetails") {
          res.json({
            updateAvailable: updateAvailable,
            exist: false,
            page: "vehicleDetails",
            id: checkPhoneNumber._id,
            token: generateToken(checkPhoneNumber._id),
          });
        } else if (checkPhoneNumber.status === "PendingBankDetails") {
          res.json({
            updateAvailable: updateAvailable,
            exist: false,
            page: "bankDetails",
            id: checkPhoneNumber._id,
            token: generateToken(checkPhoneNumber._id),
          });
        } else if (checkPhoneNumber.status.split("-")[0] === "Pending") {
          res.json({
            updateAvailable: updateAvailable,
            exist: false,
            page: "registerPending",
            id: checkPhoneNumber._id,
            token: generateToken(checkPhoneNumber._id),
          });
        } else if (checkPhoneNumber.status === "Blocked") {
          res.json({
            updateAvailable: updateAvailable,
            exist: true,
            page: "driverBlocked",
            id: checkPhoneNumber._id,
            token: generateToken(checkPhoneNumber._id),
          });
        } else if (checkPhoneNumber.status === "Rejected") {
          res.json({
            updateAvailable: updateAvailable,
            exist: true,
            page: "rejectionPage",
            id: checkPhoneNumber._id,
            token: generateToken(checkPhoneNumber._id),
          });
        }
      } else {
        res.json({
          updateAvailable: updateAvailable,
          exist: false,
          page: "personalDetails",
          message: "newDriver",
          id: null,
          token: null,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }),

  // @desc create personal details
  // @router POST /api/driver/personal-details
  // @access PUBLIC

  // files to base64

  personalDetails: asyncHandler(async (req, res) => {
    try {
      const {
        profileImg,
        refferalNumber,
        firstName,
        lastName,
        defaultPhoneNumber,
        alternativeNumber,
        emergencyNumber,
        addCity,
        addLocality,
        adharNumber,
        adharFrontImg,
        adharBackImg,
        // vaccineImg,
        profileImgExt,
        adharFrontImgExt,
        adharBackImgExt,
        //vaccineImgExt,
        fcmToken,
      } = req.body;

      const checkAdharNumber = await Driver.findOne({
        "personalDetails.adharNumber": adharNumber,
      }).exec();
      if (checkAdharNumber) {
        res.status(400);
        throw new Error("Adhar Number Already Exist!..");
      } else {
        let driverImg = await uploadImages(
          `data:image/${profileImgExt};base64,` + profileImg,
          "drivers/profile_imgs",
          profileImgExt
        );
        // let driverImg = await cloudinary.uploader.upload(
        //   `data:image/${profileImgExt};base64,` + profileImg,
        //   { folder: "LDR_DRIVER_PROFILE_IMG" }
        // );

        let adharFront = await uploadImages(
          `data:image/${adharFrontImgExt};base64,` + adharFrontImg,
          "drivers/adhar_imgs",
          adharFrontImgExt
        );
        // let adharFront = await cloudinary.uploader.upload(
        //   `data:image/${adharFrontImgExt};base64,` + adharFrontImg,
        //   {
        //     folder: "DRIVER_ADHAR_IMG",
        //   }
        // );

        let adharback = await uploadImages(
          `data:image/${adharBackImgExt};base64,` + adharBackImg,
          "drivers/adhar_imgs",
          adharBackImgExt
        );
        // let adharback = await cloudinary.uploader.upload(
        //   `data:image/${adharBackImgExt};base64,` + adharBackImg,
        //   {
        //     folder: "DRIVER_ADHAR_IMG",
        //   }
        // );
        // let vaccine = await cloudinary.uploader.upload(
        //   `data:image/${vaccineImgExt};base64,` + vaccineImg,
        //   {
        //     folder: "VACCINE_CERTIFICATE_IMG",
        //   }
        // );

        const driverid = await generateId();
        const details = await Driver.create({
          personalDetails: {
            profileImg: driverImg.img_url,
            profileImg_id: driverImg.img_key,
            refferalNumber: refferalNumber,
            firstName: firstName,
            lastName: lastName,
            defaultPhoneNumber: defaultPhoneNumber,
            alternativeNumber: alternativeNumber,
            emergencyNumber: emergencyNumber,
            addCity: addCity,
            addLocality: addLocality,
            adharNumber: adharNumber,
            adharFrontImg: adharFront.img_url,
            adharFrontImg_id: adharFront.img_key,
            adharBackImg: adharback.img_url,
            adharBackImg_id: adharback.img_key,
            // vaccineImg: vaccine.secure_url,
            // vaccineImg_id: vaccine.public_id,
            personalDetails: true,
          },
          driverId: driverid,
          fcmToken: fcmToken,
          status: "PendingVehicleDetails",
          dateAndTime: todayDate() + " " + formatAMPM(new Date()),
        });
        if (details) {
          res.status(200);
          res.json({
            status: true,
            id: details._id,
            stage1: details.personalDetails.personalDetails,
            token: generateToken(details._id),
          });
        } else {
          res.status(400);
          res.json({ status: false });
        }
      }
    } catch (err) {
      res.status(400);
      console.log(err.message);
      throw new Error(err.message);
    }
  }),

  // @desc add vehicle details of driver
  // @router POST /api/driver/vehicle-details
  // @access PUBLIC

  vehicleDetails: asyncHandler(async (req, res) => {
    try {
      const {
        id,
        vehicleType,
        subType,
        rcBookImg,
        rcBookImgExt,
        vehicleNumber,
        vehicleFrontImg,
        vehicleFrontImgExt,
        vehicleBackImg,
        vehicleBackImgExt,
        insuranceNumber,
        insuranceImg,
        insuranceImgExt,
        insuranceExpiryDate,
        drivingLicenseNo,
        drivingLicenseImg,
        drivingLicenseImgExt,
      } = req.body;

      const checkVehicleNumber = await Driver.findOne({
        "vehicleDetails.vehicleNumber": vehicleNumber,
      }).exec();
      if (checkVehicleNumber) {
        // console.log(
        //   checkVehicleNumber.vehicleDetails.vehicleNumber,
        //   "jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj"
        // );
        res.status(400);
        res.json({
          errorStatus: true,
          message: "Vehicle Number Already Exist!..",
        });
      } else {
        let rcBook = await uploadImages(
          `data:image/${rcBookImgExt};base64,` + rcBookImg,
          "drivers/vehicle_rcbook_imgs",
          rcBookImgExt
        );
        // let rcBook = await cloudinary.uploader.upload(
        //   `data:image/${rcBookImgExt};base64,` + rcBookImg,
        //   {
        //     folder: "VEHICLE_RCBOOK_IMAGE_IMG",
        //   }
        // );

        let vFrontImg = await uploadImages(
          `data:image/${vehicleFrontImgExt};base64,` + vehicleFrontImg,
          "drivers/vehicle_imgs",
          vehicleFrontImgExt
        );
        // let vFrontImg = await cloudinary.uploader.upload(
        //   `data:image/${vehicleFrontImgExt};base64,` + vehicleFrontImg,
        //   {
        //     folder: "VEHICLE_IMAGES_IMG",
        //   }
        // );

        let vBackImg = await uploadImages(
          `data:image/${vehicleBackImgExt};base64,` + vehicleBackImg,
          "drivers/vehicle_imgs",
          vehicleBackImgExt
        );

        // let vBackImg = await cloudinary.uploader.upload(
        //   `data:image/${vehicleBackImgExt};base64,` + vehicleBackImg,
        //   {
        //     folder: "VEHICLE_IMAGES_IMG",
        //   }
        // );

        let insuranceImage = await uploadImages(
          `data:image/${insuranceImgExt};base64,` + insuranceImg,
          "drivers/vehicle_insurance_imgs",
          insuranceImgExt
        );

        // let insuranceImage = await cloudinary.uploader.upload(
        //   `data:image/${insuranceImgExt};base64,` + insuranceImg,
        //   {
        //     folder: "VEHICLE_INSURENCE_IMG",
        //   }
        // );

        let driverLc = await uploadImages(
          `data:image/${drivingLicenseImgExt};base64,` + drivingLicenseImg,
          "drivers/driving_licence_imgs",
          drivingLicenseImgExt
        );

        // let driverLc = await cloudinary.uploader.upload(
        //   `data:image/${drivingLicenseImgExt};base64,` + drivingLicenseImg,
        //   {
        //     folder: "DRIVING_LICENCE_IMG",
        //   }
        // );

        await Driver.findByIdAndUpdate(id, {
          vehicleDetails: {
            vehicleType: vehicleType,
            subType: subType,
            rcBookImg: rcBook.img_url,
            rcBookImg_id: rcBook.img_key,
            vehicleNumber: vehicleNumber,
            vehicleFrontImg: vFrontImg.img_url,
            vehicleFrontImg_id: vFrontImg.img_key,
            vehicleBackImg: vBackImg.img_url,
            vehicleBackImg_id: vBackImg.img_key,
            insuranceNumber: insuranceNumber,
            insuranceImg: insuranceImage.img_url,
            insuranceImg_id: insuranceImage.img_key,
            insuranceExpiryDate: insuranceExpiryDate,
            drivingLicenseNo: drivingLicenseNo,
            drivingLicenseImg: driverLc.img_url,
            drivingLicenseImg_id: driverLc.img_key,
            vehicleDetails: true,
          },
          status: "PendingBankDetails",
          dateAndTime: todayDate() + " " + formatAMPM(new Date()),
        }).exec();

        const details = await Driver.findOne({ _id: id }).exec();
        if (details) {
          res.status(200);
          res.json({
            id: details._id,
            status: true,
            details: details,
            stage1: details.personalDetails.personalDetails,
            stage2: details.vehicleDetails.vehicleDetails,
            token: generateToken(details._id),
          });
        } else {
          res.status(401);
          res.json({ status: false });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc add bank details of driver
  // @router POST /api/driver/bank-details
  // @access PUBLIC

  bankDetails: asyncHandler(async (req, res) => {
    try {
      let {
        id,
        accountNumber,
        bankName,
        ifscCode,
        passbookStatementImg,
        passbookStatementImgExt,
        panCardNumber,
        panCardImg,
        panCardImgExt,
      } = req.body;
      if (panCardImg) {
        let panCardImage = await uploadImages(
          `data:image/${panCardImgExt};base64,` + panCardImg,
          "drivers/pan_card_imgs",
          panCardImgExt
        );
        // let panCardImage = await cloudinary.uploader.upload(
        //   `data:image/${panCardImgExt};base64,` + panCardImg,
        //   {
        //     folder: "PAN_CARDS_IMG",
        //   }
        // );

        var panCardImg1 = panCardImage.img_url;
        var panPublicId = panCardImage.img_key;
      } else {
        var panCardImg1 = "--no updated--";
        var panPublicId = "";
      }

      let bankstateMentImg = await uploadImages(
        `data:image/${passbookStatementImgExt};base64,` + passbookStatementImg,
        "drivers/bank_statement_imgs",
        passbookStatementImgExt
      );
      // let bankstateMentImg = await cloudinary.uploader.upload(
      //   `data:image/${passbookStatementImgExt};base64,` + passbookStatementImg,
      //   {
      //     folder: "BANK_STATE_MENTS_IMG",
      //   }
      // );
     
      await Driver.findByIdAndUpdate(id, {
        bankDetails: {
          accountNumber: accountNumber,
          bankName: bankName,
          ifscCode: ifscCode,
          passbookStatementImg: bankstateMentImg.img_url,
          passbookStatementImg_id: bankstateMentImg.img_key,
          panCardNumber: panCardNumber,
          panCardImg: panCardImg1,
          panCardImg_id: panPublicId,
          bankDetails: true,
        },
        status: "Pending",
        dateAndTime: todayDate() + " " + formatAMPM(new Date()),
        regCompleted: true,
      });

      await PendingCount.create({
        count: 0,
        id: id,
      });

      const details = await Driver.findById(id).exec();

      if (details) {
        res.status(200);
        res.json({
          status: true,
          id: details._id,
          token: generateToken(details._id),
          stage1: details.personalDetails.personalDetails,
          stage2: details.vehicleDetails.vehicleDetails,
          stage3: details.bankDetails.bankDetails,
          message: "successfully done Singup",
        });
      } else {
        res.status(400);
        res.json({
          status: false,
          message: "signup failed",
        });
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc driver getBanner
  // POST /api/driver/getBanner
  // @access PUBLIC

  getDriverBanner: asyncHandler(async (req, res) => {
    const banners = await BannerDriver.find().exec();
    if (banners) {
      res.status(200);
      res.json(banners);
    } else {
      res.status(401);
      throw new Error("Not found driver banner ");
    }
  }),

  fcmGetting: asyncHandler(async (req, res) => {
    try {
      // console.log(req.body);
      if (req.body.fcmOnInstall) {
        const tokens = await Fcm.find().exec();
        if (tokens && tokens.length === 0) {
          const create = await Fcm.create({
            fcmFor: "driver",
            fcmTokens: [req.body.fcmOnInstall],
          });
          if (create) {
            res.json({ status: "created" });
          }
        } else {
          let update = await Fcm.findOneAndUpdate(
            { fcmFor: "driver" },
            { $addToSet: { fcmTokens: { $each: [req.body.fcmOnInstall] } } }
          );
          if (update) {
            res.json({ status: "pushed", update });
          }
        }
      } else {
        res.json({ status: null, token: req.body.fcmOnInstall });
      }
    } catch (err) {
      console.log(err);
    }
  }),
  // @desc driver online and offline
  // POST /api/driver/online
  // @access PRIVATE

  online: asyncHandler(async (req, res) => {
    try {
      const { isOnline, id } = req.body;

      const update = await Driver.findByIdAndUpdate(id, {
        isOnline: isOnline,
      }).exec();
      if (update) {
        res.status(200);
        res.json({ ok: true, driverId: id });
      } else {
        res.status(400);
        throw new Error("failed...");
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc get driver profile
  // @route GET /api/driver/profile
  // @PRIVATE

  getProfile: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const details = await Driver.findById(id).exec();
    const today = moment().startOf("day");

    const data = await Booking.find({
      driverId: details._id,
      status: "Completed",
      createdAt: {
        $gte: today.toDate(),
        $lte: moment(today).endOf("day").toDate(),
      },
    }).exec();
    let todayEarnings = 0;
    let earnings;
    let orderCount;
    if (data) {
      for (i = 0; i < data.length; i++) {
        const element = data[i];
        todayEarnings = todayEarnings + element.amountAfterCommision;
      }
      earnings = todayEarnings;
      orderCount = data.length;
    } else {
      todayEarnings = 0;
      (orderCount = 0), (earnings = 0);
    }

    if (details) {
      res.status(200);
      res.json({
        name:
          details.personalDetails.firstName +
          " " +
          details.personalDetails.lastName,
        driverId: details.driverId,
        vehicleType: details.vehicleDetails.vehicleType,
        subType: details.vehicleDetails.subType,
        vehicleNumber: details.vehicleDetails.vehicleNumber,
        phoneNumber: details.personalDetails.defaultPhoneNumber,
        profileImg: details.personalDetails.profileImg,
        rating: details.rating,
        earnings: earnings.toFixed(2),
        orderCount: orderCount,
      });
    } else {
      res.status(400);
      throw new Error("not found");
    }
  }),

  // @desc get transaction history
  // POST /api/driver/transaction-history
  // @access PRIVATE

  getTransactionHistory: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const details = await Driver.findById(id).exec();
    let walletlogs = [];
    if (details) {
      details.walletlogs.map((log) => {
        walletlogs.unshift(log);
      });
      res.status(200);
      res.json({
        wallet: details.wallet,
        walletlogs: walletlogs,
      });
    } else {
      res.status(400);
      res.json("not found history");
    }
  }),
  updateCurrentLocation: asyncHandler(async (req, res) => {
    try {
      const { driverId, lat, lng } = req.body;
      const update = await Driver.findByIdAndUpdate(driverId, {
        "currentLocation.lat": lat,
        "currentLocation.lng": lng,
      }).exec();
      if (update) {
        res.status(200);
        res.json({
          status: "ok",
          update,
        });
      } else {
        res.status(400);
        throw new Error("Current location updation failed!...");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  currentLocaionUpdating: asyncHandler(async (req, res) => {
    try {
      let { currentLocation, driverId } = req.body;
      let lat = currentLocation[0];
      let lng = currentLocation[1];
      if (driverId) {
        Driver.findById(driverId, function (err, quizes) {
          if (err) {
            console.log(err, "THIS IS LOCATION UPDATE ERRO", req.body);
          } else {
            Driver.updateOne(
              { _id: driverId },
              { "currentLocation.lat": lat, "currentLocation.lng": lng },
              function (err, docs) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(
                    driverId,
                    "Updated Docs success: ",
                    docs.modifiedCount
                  );
                  //  console.log("success",driverId);
                  res.json({ ok: true });
                }
              }
            );
          }
        });
      } else {
        console.log("No driver id to update location");
      }
    } catch (err) {
      console.log(err);
    }
  }),
  orderHistory: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const orderHistory = await Booking.find({
      driverId: id,
    })
      .sort({ createdAt: -1 })
      .exec();

    if (orderHistory) {
      res.status(200);
      res.json(orderHistory);
    } else {
      res.status(400);
      throw new Error("something went wrong");
    }
  }),

  //@desc Get Booking Details to Driver
  //@router GET /api/driver/booking-details/:id
  //@access PRIVATE

  getBookingDetails: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bookingDetails = await Booking.findOne({ Id: id }).exec();
    if (bookingDetails) {
      if (bookingDetails.trakingStatus === "Assigned") {
        let newObj = {
          message: "Reached Pickup",
          pickupPoint: true,
          stop1LocationShow: false,
          dropLocationShow: false,
          leading: false,
          stop1Point: false,
          dropPoint: false,
          ...bookingDetails._doc,
        };

        res.status(200);
        res.json(newObj);
      } else if (
        bookingDetails.trakingStatus === "Confirming" &&
        bookingDetails.status === "Ongoing" &&
        bookingDetails.stops.total === 3
      ) {
        let newObj = {
          message: "Reached pickup1", // 1
          pickupPoint: true, // 3
          stop1LocationShow: true, // 6
          dropLocationShow: false, // 7
          leading: false, // 2
          stop1Point: true, // 4
          dropPoint: true, // 5
          ...bookingDetails._doc,
        };
        res.status(200);
        res.json(newObj);
      } else if (
        bookingDetails.trakingStatus === "Confirming" &&
        bookingDetails.status === "Ongoing" &&
        bookingDetails.stops.total === 2
      ) {
        let newObj = {
          message: "Reached drop", // 1
          pickupPoint: true, // 3
          stop1LocationShow: false, // 6
          dropLocationShow: true, // 7
          leading: false, // 2
          stop1Point: false, // 4
          dropPoint: true, // 5
          ...bookingDetails._doc,
        };
        res.status(200);
        res.json(newObj);
      } else if (bookingDetails.trakingStatus === "Confirming") {
        let newObj = {
          message: "Picked", // 1
          pickupPoint: true, // 3
          stop1LocationShow: false, // 6
          dropLocationShow: false, // 7
          leading: false, // 2
          stop1Point: false, // 4
          dropPoint: true, // 5
          ...bookingDetails._doc,
        };
        res.status(200);
        res.json(newObj);
      } else if (bookingDetails.trakingStatus === "stopNotAvailable") {
        let newObj = {
          message: "Reached drop", // 1
          pickupPoint: true, // 3
          stop1LocationShow: false, // 6
          dropLocationShow: true, // 7
          leading: false, // 2
          stop1Point: false, // 4
          dropPoint: true, // 5
          ...bookingDetails._doc,
        };
        res.status(200);
        res.json(newObj);
      } else if (
        bookingDetails.trakingStatus === "stop1Available" &&
        bookingDetails.status === "Ongoing"
      ) {
        let newObj = {
          message: "Reached pickup1", //1
          pickupPoint: true, //3
          stop1LocationShow: true, //6
          dropLocationShow: false, // 7
          leading: false, //2
          stop1Point: true, //4
          dropPoint: false, //5
          ...bookingDetails._doc,
        };
        res.status(200);
        res.json(newObj);
      } else if (bookingDetails.trakingStatus === "stop1Available") {
        let newObj = {
          message: "Reached pickup1", //1
          pickupPoint: true, //3
          stop1LocationShow: true, //6
          dropLocationShow: false, // 7
          leading: false, //2
          stop1Point: true, //4
          dropPoint: false, //5
          ...bookingDetails._doc,
        };
        res.status(200);
        res.json(newObj);
      } else if (bookingDetails.trakingStatus === "Completed") {
        let newObj = {
          message: "Completed", //1
          pickupPoint: true, //3
          stop1LocationShow: true, //6
          dropLocationShow: true, // 7
          leading: false, //2
          stop1Point: true, //4
          dropPoint: true, //5
          ...bookingDetails._doc,
        };
        res.status(200);
        res.json(newObj);
      } else if (bookingDetails.trakingStatus === "stop1Completed") {
        //trakingStatus:"",

        let newObj = {
          message: "Reached drop", //1
          pickupPoint: true, //3
          stop1LocationShow: true, //6
          dropLocationShow: true, // 7
          leading: false, //2
          stop1Point: true, //4
          dropPoint: true, //5
          ...bookingDetails._doc,
        };
        res.status(200);
        res.json(newObj);
      } else {
        res.status(200);
        console.log(
          bookingDetails,
          "////////////////////////////////////////////////////////////////"
        );
        res.json(bookingDetails);
      }
    } else {
      res.status(400);
      throw new Error("not found booking");
    }
  }),

  getDriverRejectedDocuments: asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      let driverDetails = await Driver.findById(id).exec();
      const docArr = [];
      let dataForUpdate = {
        _id: id,
        personalDetails: {
          profileImg: driverDetails.personalDetails.profileImg,
          adharFrontImg: driverDetails.personalDetails.adharFrontImg,
          adharBackImg: driverDetails.personalDetails.adharBackImg,
        },
        bankDetails: {
          passbookStatementImg: driverDetails.bankDetails.passbookStatementImg,
          panCardImg: driverDetails.bankDetails.panCardImg,
        },
        vehicleDetails: {
          vehicleFrontImg: driverDetails.vehicleDetails.vehicleFrontImg,
          vehicleBackImg: driverDetails.vehicleDetails.vehicleBackImg,
          insuranceImg: driverDetails.vehicleDetails.insuranceImg,
          drivingLicenseImg: driverDetails.vehicleDetails.drivingLicenseImg,
          rcBookImg: driverDetails.vehicleDetails.rcBookImg,
        },
        rejectedDoc: driverDetails.rejectedDocuments,
      };

      if (driverDetails) {
        console.log(driverDetails.rejectedDocuments);
        driverDetails.rejectedDocuments.map((data) => {
          if (data.docmentType === "basic-details") {
            data.rejectedFields.map((fields) => {
              if (fields.field === "profileImg") {
                dataForUpdate.personalDetails.profileImg = "";
                if (!docArr.includes("personalDetails")) {
                  docArr.push("personalDetails");
                }
              }
            });
          } else if (data.docmentType === "aadhar-details") {
            data.rejectedFields.map((fields) => {
              if (fields.field === "adharFrontImg") {
                dataForUpdate.personalDetails.adharFrontImg = "";
                if (!docArr.includes("personalDetails")) {
                  docArr.push("personalDetails");
                }
              } else if (fields.field === "adharBackImg") {
                dataForUpdate.personalDetails.adharBackImg = "";
                if (!docArr.includes("personalDetails")) {
                  docArr.push("personalDetails");
                }
              }
            });
          } else if (data.docmentType === "bank-details") {
            data.rejectedFields.map((fields) => {
              if (fields.field === "passbookStatementImg") {
                dataForUpdate.bankDetails.passbookStatementImg = "";
                if (!docArr.includes("bankDetails")) {
                  docArr.push("bankDetails");
                }
              }
            });
          } else if (data.docmentType === "pancard-details") {
            data.rejectedFields.map((fields) => {
              if (fields.field === "panCardImg") {
                dataForUpdate.bankDetails.panCardImg = "";
                if (!docArr.includes("bankDetails")) {
                  docArr.push("bankDetails");
                }
              }
            });
          } else if (data.docmentType === "vehicle-details") {
            data.rejectedFields.map((fields) => {
              if (fields.field === "vehicleFrontImg") {
                dataForUpdate.vehicleDetails.vehicleFrontImg = "";
                if (!docArr.includes("vehicleDetails")) {
                  docArr.push("vehicleDetails");
                }
              } else if (fields.field === "vehicleBackImg") {
                dataForUpdate.vehicleDetails.vehicleBackImg = "";
                if (!docArr.includes("vehicleDetails")) {
                  docArr.push("vehicleDetails");
                }
              }
            });
          } else if (data.docmentType === "insurance-details") {
            data.rejectedFields.map((fields) => {
              if (fields.field === "insuranceImg") {
                dataForUpdate.vehicleDetails.insuranceImg = "";
                if (!docArr.includes("vehicleDetails")) {
                  docArr.push("vehicleDetails");
                }
              }
            });
          } else if (data.docmentType === "licence-details") {
            data.rejectedFields.map((fields) => {
              if (fields.field === "drivingLicenseImg") {
                dataForUpdate.vehicleDetails.drivingLicenseImg = "";
                if (!docArr.includes("vehicleDetails")) {
                  docArr.push("vehicleDetails");
                }
              }
            });
          } else if (data.docmentType === "rc-details") {
            data.rejectedFields.map((fields) => {
              if (fields.field === "rcBookImg") {
                dataForUpdate.vehicleDetails.rcBookImg = "";
                if (!docArr.includes("vehicleDetails")) {
                  docArr.push("vehicleDetails");
                }
              }
            });
          }
        });

        console.log(
          ">>>>>>>>>>>>>>>>>>>>",
          dataForUpdate,
          ";;;;;;;;;;;;;;;;;;;;;",
          docArr[0],
          "]]]]]]]]]]]"
        );
        // console.log(docArr[0],);
        res.status(200);
        res.json({ driverDetails: dataForUpdate, rejectedDoc: docArr });
      } else {
        res.status(400);
        throw new Error("not found driver");
      }
    } catch (err) {
      console.log(err);
    }
  }),

  updateDriverDetails: asyncHandler(async (req, res) => {
    try {
      const {
        driverId,
        documentType,
        profileImg,
        profileImgExt,
        adharFrontImg,
        adharFrontImgExt,
        adharBackImg,
        adharBackImgExt,
        rcBookImg,
        rcBookImgExt,
        vehicleFrontImg,
        vehicleFrontImgExt,
        vehicleBackImg,
        vehicleBackImgExt,
        insuranceImg,
        insuranceImgExt,
        drivingLicenseImg,
        drivingLicenseImgExt,
        passbookImg,
        passbookImgExt,
        panCardImg,
        panCardImgExt,
      } = req.body;
      console.log({
        driverId,
        documentType,
        // profileImg,
        profileImgExt,
        adharFrontImg,
        adharFrontImgExt,
        adharBackImg,
        adharBackImgExt,
        rcBookImg,
        rcBookImgExt,
        vehicleFrontImg,
        vehicleFrontImgExt,
        vehicleBackImg,
        vehicleBackImgExt,
        insuranceImg,
        insuranceImgExt,
        drivingLicenseImg,
        drivingLicenseImgExt,
        passbookImg,
        passbookImgExt,
        panCardImg,
        panCardImgExt,
      });
      const driverDetails = await Driver.findById(driverId).exec();
      if (driverDetails) {
        if (documentType.includes("personalDetails")) {
          if (profileImg && profileImgExt) {
            let driverImg = await uploadImages(
              `data:image/${profileImgExt};base64,` + profileImg,
              "drivers/profile_imgs",
              profileImgExt
            );
            driverDetails.personalDetails.profileImg = driverImg.img_url;
            driverDetails.personalDetails.profileImg_id = driverImg.img_key;

            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "basic-details",
                },
              },
            }).exec();
            driverDetails.isRejectBasicDetails = false;
          } else {
            driverDetails.personalDetails.profileImg = profileImg;
            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "basic-details",
                },
              },
            }).exec();
            driverDetails.isRejectBasicDetails = false;
          }

          if (adharFrontImg && adharFrontImgExt) {
            var adharFront = await uploadImages(
              `data:image/${adharFrontImgExt};base64,` + adharFrontImg,
              "drivers/adhar_imgs",
              adharFrontImgExt
            );
            driverDetails.personalDetails.adharFrontImg = adharFront.img_url;
            driverDetails.personalDetails.adharFrontImg_id = adharFront.img_key;
            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "aadhar-details",
                },
              },
            }).exec();
            driverDetails.isRejectAadharDetails = false;
          } else {
            driverDetails.personalDetails.adharFrontImg = adharFrontImg;
            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "aadhar-details",
                },
              },
            }).exec();
            driverDetails.isRejectAadharDetails = false;
          }

          if (adharBackImg && adharBackImgExt) {
            var adharback = await uploadImages(
              `data:image/${adharBackImgExt};base64,` + adharBackImg,
              "drivers/adhar_imgs",
              adharBackImgExt
            );
            driverDetails.personalDetails.adharBackImg = adharback.img_url;
            driverDetails.personalDetails.adharBackImg_id = adharback.img_key;
            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "aadhar-details",
                },
              },
            }).exec();
            driverDetails.isRejectAadharDetails = false;
          } else {
            driverDetails.personalDetails.adharBackImg = adharBackImg;
            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "aadhar-details",
                },
              },
            }).exec();
            driverDetails.isRejectAadharDetails = false;
          }
        }

        // *************************************************************************************

        if (documentType.includes("vehicleDetails")) {
          if (rcBookImg && rcBookImgExt) {
            var rcBookImage = await uploadImages(
              `data:image/${rcBookImgExt};base64,` + rcBookImg,
              "drivers/vehicle_rcbook_imgs",
              rcBookImgExt
            );
          }

          if (vehicleFrontImg && vehicleFrontImgExt) {
            var vehicleFrontImage = await uploadImages(
              `data:image/${vehicleFrontImgExt};base64,` + vehicleFrontImg,
              "drivers/vehicle_imgs",
              vehicleFrontImgExt
            );
          }

          if (vehicleBackImg && vehicleBackImgExt) {
            var vehicleBackImage = await uploadImages(
              `data:image/${vehicleBackImgExt};base64,` + vehicleBackImg,
              "drivers/vehicle_imgs",
              vehicleBackImgExt
            );
          }

          if (insuranceImg && insuranceImgExt) {
            var insuranceImage = await uploadImages(
              `data:image/${insuranceImgExt};base64,` + insuranceImg,
              "drivers/vehicle_insurance_imgs",
              insuranceImgExt
            );
          }
          if (drivingLicenseImg && drivingLicenseImgExt) {
            var drivingLicenseImage = await uploadImages(
              `data:image/${drivingLicenseImgExt};base64,` + drivingLicenseImg,
              "drivers/driving_licence_imgs",
              drivingLicenseImgExt
            );
          }
          if (rcBookImage && rcBookImage.img_url) {
            driverDetails.vehicleDetails.rcBookImg = rcBookImage.img_url;
            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "rc-details",
                },
              },
            }).exec();
            driverDetails.isRejectRcDetails = false;
          }

          if (rcBookImage && rcBookImage.img_key) {
            driverDetails.vehicleDetails.rcBookImg_id = rcBookImage.img_key;
          }

          if (vehicleFrontImage && vehicleFrontImage.img_url) {
            driverDetails.vehicleDetails.vehicleFrontImg =
              vehicleFrontImage.img_url;

            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "vehicle-details",
                },
              },
            }).exec();
          }
          if (vehicleFrontImage && vehicleFrontImage.img_key) {
            driverDetails.vehicleDetails.vehicleFrontImg_id =
              vehicleFrontImage.img_key;
          }
          if (vehicleBackImage && vehicleBackImage.img_url) {
            driverDetails.vehicleDetails.vehicleBackImg =
              vehicleBackImage.img_url;
            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "vehicle-details",
                },
              },
            }).exec();
            driverDetails.isRejectVehicleDetails = false;
          }
          if (vehicleBackImage && vehicleBackImage.img_key) {
            driverDetails.vehicleDetails.vehicleBackImg_id =
              vehicleBackImage.img_key;
          }
          if (insuranceImage && insuranceImage.img_url) {
            driverDetails.vehicleDetails.insuranceImg = insuranceImage.img_url;
            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "insurance-details",
                },
              },
            }).exec();
            driverDetails.isRejectInsuranceDetails = false;
          }
          if (insuranceImage && insuranceImage.img_key) {
            driverDetails.vehicleDetails.insuranceImg_id =
              insuranceImage.img_key;
          }
          if (drivingLicenseImage && drivingLicenseImage.img_url) {
            driverDetails.vehicleDetails.drivingLicenseImg =
              drivingLicenseImage.img_url;

            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "licence-details",
                },
              },
            }).exec();
            driverDetails.isRejectLicenceDetails = false;
          }

          if (drivingLicenseImage && drivingLicenseImage.img_key) {
            driverDetails.vehicleDetails.drivingLicenseImg_id =
              drivingLicenseImage.img_key;
          }
        }
        if (documentType.includes("bankDetails")) {
          if (passbookImg) {
            var passbookImage = await uploadImages(
              `data:image/${passbookImgExt};base64,` + passbookImg,
              "drivers/bank_statement_imgs",
              passbookImgExt
            );
          }

          if (panCardImg) {
            var panCardImage = await uploadImages(
              `data:image/${panCardImgExt};base64,` + panCardImg,
              "drivers/pan_card_imgs",
              panCardImgExt
            );
          }
          if (passbookImage && passbookImage.img_url) {
            driverDetails.bankDetails.passbookStatementImg =
              passbookImage.img_url;

            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "bank-details",
                },
              },
            }).exec();
            driverDetails.isRejectBankDetails = false;
          }
          if (passbookImage && passbookImage.img_key) {
            driverDetails.bankDetails.passbookStatementImg_id =
              passbookImage.img_key;
          }
          if (panCardImage && panCardImage.img_url) {
            driverDetails.bankDetails.panCardImg = panCardImage.img_url;
            await Driver.findByIdAndUpdate(driverDetails._id, {
              $pull: {
                rejectedDocuments: {
                  docmentType: "pancard-details",
                },
              },
            }).exec();
            driverDetails.isRejectPancardDetails = false;
          }
          if (panCardImage && panCardImage.img_key) {
            driverDetails.bankDetails.panCardImg_id = panCardImage.img_key;
          }
        }

        // console.log(driverDetails.rejectedDocuments);
        const pendingCount = await PendingCount.findOne({
          id: driverId,
        }).exec();
        if (pendingCount) {
          driverDetails.status = `Pending-${pendingCount.count + 1}`;
          pendingCount.count = pendingCount.count + 1;

          await pendingCount.save();
        } else {
          await PendingCount.create({
            count: 1,
            id: driverId,
          });

          driverDetails.status = `Pending-${1}`;
        }
        driverDetails.isReject = false;
        await driverDetails.save();
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("not found driver in updateDriverDetails");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  getEarningsHistory: asyncHandler(async (req, res) => {
    try {
      var { driverid, date } = req.params;
      date = moment(date, "DD-MM-YYYY").add(1, "days").format("DD-MM-YYYY");
      const id = mongoose.Types.ObjectId(driverid);
      let to_date = moment(date, "DD-MM-YYYY").format("YYYY-MM-DD");
      let from_date = moment(date, "DD-MM-YYYY")
        .subtract(6, "days")
        .format("YYYY-MM-DD");
      const details = await Booking.aggregate([
        {
          $match: {
            driverId: driverid,
            status: "Completed",
            createdAt: {
              $gte: new Date(from_date),
              $lt: new Date(to_date),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            date: {
              $first: "$createdAt",
            },
            count: {
              $sum: 1,
            },
            totalAmount: {
              $sum: "$amountAfterCommision",
            },
          },
        },
        {
          $sort: { date: 1 },
        },
      ]);

      var getDaysBetweenDates = function (startDate, endDate) {
        var now = startDate.clone(),
          dates = [];

        while (now.isSameOrBefore(endDate)) {
          dates.push(now.format("YYYY-MM-DD"));
          now.add(1, "days");
        }
        return dates;
      };

      var startDate = moment(from_date).subtract(1, "days");
      var endDate = moment(to_date);

      var dateList = getDaysBetweenDates(startDate, endDate);
      let resArray = [];

      if (details) {
        for (let i = 0; i < details.length; i++) {
          for (let j = 0; j < dateList.length; j++) {
            if (details[i]._id === dateList[j]) {
              dateList[j] = {
                domain: `${moment(new Date(dateList[j])).format("ddd")}`,
                measure: details[i].totalAmount,
              };
            }
          }
        }
      }

      for (let i = 0; i < dateList.length - 1; i++) {
        if (typeof dateList[i] === "string") {
          dateList[i] = {
            domain: `${moment(new Date(dateList[i])).format("ddd")}`,
            measure: 0,
          };
        }
      }

      for (let i = 0; i < dateList.length; i++) {
        if (typeof dateList[i] != "string") {
          resArray.push(dateList[i]);
        }
      }

      const totalEarningsDetails = await Booking.aggregate([
        {
          $match: {
            driverId: driverid,
            status: "Completed",
            createdAt: {
              $gte: new Date(from_date),
              $lt: new Date(to_date),
            },
          },
        },
        {
          $group: {
            _id: null,
            amount: {
              $sum: "$amountAfterCommision",
            },
          },
        },
      ]);

      const totalRides = await Booking.find({
        status: "Completed",
        driverId: driverid,
        createdAt: {
          $gte: new Date(from_date),
          $lt: new Date(to_date),
        },
      }).exec();

      const cancels = await Booking.find({
        status: "Cancel",
        driverId: driverid,
        createdAt: {
          $gte: new Date(from_date),
          $lt: new Date(to_date),
        },
      })
        .count()
        .exec();

      if (totalEarningsDetails.length > 0) {
        res.status(200);
        res.json({
          graphData: resArray,
          totalEarning: totalEarningsDetails[0].amount.toFixed(2),
          totalRides: totalRides.length,
          cancels,
          bookingHistory: details,
        });
      } else {
        res.status(200);
        res.json({
          graphData: resArray,
          totalEarning: 0,
          totalRides: totalRides.length,
          cancels,
          bookingHistory: details,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }),
  // : asyncHandler(async (req, res) => {

  // })
};
