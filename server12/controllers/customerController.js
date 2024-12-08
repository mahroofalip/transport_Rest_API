const asyncHandler = require("express-async-handler");
const Booking = require("../models/booking_model");
const Customers = require("../models/customer_model");
const BannerUser = require("../models/customerBanner_model");
const Pricing = require("../models/pricing_model");
const generateToken = require("../utility/generateToken");
const PromoCode = require("../models/promocode_model");
const { getAmountfun } = require("../calculating_engine/pricing");
const HelperCollection = require("../models/helper_model");
const Version = require("../models/version_model");
const Ids = require("../models/ids_model");
const Driver = require("../models/driver_model");
const ClaimOffers = require("../models/claim_offers_model");
const ClaimWithdrawal = require("../models/claim_request_model");
const { v4 } = require("uuid");
const uuidv4 = v4;
// get time like  1:30 PM
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
function padLeadingZeros(num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

async function generateId() {
  // var ids = await Ids.find().exec();

  // if (ids.length !== 0) {
  //   var count = parseInt(ids[0].count) + 1;
  //   var code = padLeadingZeros(count, 4);
  //   const id = "LRNR" + code;
  //   await Ids.findOneAndUpdate(
  //     { _id: "63060a58867c4c9e1550580f" },
  //     {
  //       $inc: {
  //         count: 1,
  //       },
  //     },
  //     { new: true }
  //   ).exec();
  //   return id;
  // } else {
  //   await Ids.create({
  //     count: 1,
  //   });
  //   Ids.create;
  //   return "LRNR0001";
  // }
  
    const len = await Customers.count()
    const id = 'LRNR' + len 
    return id
  
}

async function generateOrderId() {
  // var len = await Booking.count().exec();
  const len = await Booking.count()
  const id = 'LRNRBID' + len 
  return id
  // var ids = await Ids.find().exec();
  // if (ids.length !== 0) {
  //   var count = parseInt(ids[2].count) + 1;
  //   var code = padLeadingZeros(count, 4);
  //   const id = "LRNRBID" + code;
  //   await Ids.findOneAndUpdate(
  //     { _id: "634f8ebc22954f3f90e531d5" },
  //     {
  //       $inc: {
  //         count: 1,
  //       },
  //     },
  //     { new: true }
  //   ).exec();

  //   return id;
  // }
  // var count = parseInt(len) + 1;
  // var code = padLeadingZeros(count, 4);
  // const id = "LRNRBID" + code;
  // return id;
}

let o = 0;

module.exports = {
  // @desc check phone number
  // @router POST /api/customer/check
  // @access PUBLIC

  checkCustomer: asyncHandler(async (req, res) => {
    try {
      const versionCheck = await Version.findById(
        "62f1f7c70bacdcb19dcfd985"
      ).exec();

      var updateAvailable;
      if (versionCheck.version === req.body.appVersion) {
        updateAvailable = false;
      } else {
        updateAvailable = true;
      }

      const { phoneNumber, fcmToken } = req.body;

      // console.log(phoneNumber, fcmToken, "This is user");
      const checkPhoneNumber = await Customers.findOne({
        phoneNumber: phoneNumber,
      }).exec();
      if (checkPhoneNumber) {
        if (fcmToken) {
          let driver = await Customers.findByIdAndUpdate(checkPhoneNumber._id, {
            fcmToken: fcmToken,
          }).exec();
        }
        if (checkPhoneNumber.isBlock) {
          res.json({
            updateAvailable: updateAvailable,
            message: "old user",
            isExist: true,
            place: checkPhoneNumber.place,
            id: checkPhoneNumber._id,
            token: generateToken(checkPhoneNumber._id),
            page: "userBlocked",
          });
        } else {
          res.json({
            updateAvailable: updateAvailable,
            message: "old user",
            place: checkPhoneNumber.place,
            isExist: true,
            id: checkPhoneNumber._id,
            token: generateToken(checkPhoneNumber._id),
            page: "home",
          });
        }
      } else {
        res.json({ message: "new user", isExist: false, page: "login" });
      }
    } catch (err) {
      console.log("error in check user isexist or not", err);
    }
  }),

  // @desc customer Signup
  // @router POST /api/customer/singup
  // @access PUBLIC

  customerSignup: asyncHandler(async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        gstNo,
        phoneNumber,
        fcmToken,
        place,
      } = req.body;
      // console.log(req.body);
      const time = formatAMPM(new Date());
      const date = todayDate();
      const id = await generateId();
      // console.log(id);
      // console.log(time,date,id,"Thsi is time/date/id");
      const customer = await Customers.create({
        cutomerID: id,
        firstName: firstName,
        lastName: lastName,
        email: email,
        gstNo: gstNo,
        phoneNumber: phoneNumber,
        dateAndTime: date + " " + time,
        fcmToken: fcmToken,
        place: place,
      });

      if (customer) {
        res.status(200);
        res.json({
          _id: customer._id,
          cutomerID: customer.cutomerID,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          place: customer.place,
          phoneNumber: customer.phoneNumber,
          token: generateToken(customer._id),
        });
      } else {
        res.status(400);
        throw new Error("Sign up failed!");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  // @desc customer login
  // @router POST /api/customer/login
  // @access PUBLIC

  customerLogin: asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    // is customer exist
    const customer = await Customers.findOne({
      phoneNumber,
    }).exec();
    if (customer) {
      res.status(200);
      res.json({
        _id: customer._id,
        cutomerID: customer.cutomerID,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        gstNo: customer.gstNo,
        phoneNumber: customer.phoneNumber,
        token: generateToken(customer._id),
      });
    } else {
      res.status(400);
      throw new Error("Login Failed!..");
    }
  }),

  // @desc get customer details
  // @router POST /api/customer/me
  // @access PRIVATE

  getCustomer: asyncHandler(async (req, res) => {
    const customer = await Customers.findOne({
      _id: req.customer._id,
    }).exec();
    if (customer) {
      res.status(200);
      res.json({
        _id: customer._id,
        customerID: customer.cutomerID,
        firstName: customer.firstName,
        lastName: customer.lastName,
        gstNo: customer.gstNo,
        email: customer.email,
        gstNo: customer.gstNo,
        phoneNumber: customer.phoneNumber,
      });
    }
  }),

  // @desc update customer gstNo
  // @router PUT /api/customer/me
  // @access PRIVATE

  editCustomer: asyncHandler(async (req, res) => {
    const { gstNo } = req.body;
    const update = await Customers.findByIdAndUpdate(req.customer._id, {
      gstNo: gstNo,
    }).exec();

    if (update) {
      res.status(200);
      res.json({ ok: true });
    } else {
      res.status(400);
      throw new Error("Update GST Failed!...");
    }
  }),

  // @desc get total amount
  // @router POST /api/customer/get-amount
  // @access PRIVATE

  getAmount: asyncHandler(async (req, res) => {
    const { km , time} = req.body;
    console.log(req.body);
    let kiloMeter;
    if (km) {
      let km_split = km.split(".");
      if (km_split[1]) {
        let deci = parseInt(km_split[1]);
        if (deci > 0) {
          let klio = parseInt(km_split[0]);
          kiloMeter = klio + 1;
        } else {
          kiloMeter = km;
        }
      }
    }
    let pricingtype = [];
    const pricingType = await Pricing.find().sort({_id : -1}).exec();
    // const pricingType = await Pricing.find().exec();
    if (pricingType) {
      for (let i = 0; i < pricingType.length; i++) {
        console.log(kiloMeter);
        let amount = await getAmountfun(kiloMeter, pricingType[i]._id,  false,
          false,
          false,
          time);
        pricingtype.push(amount);
        if (pricingtype.length === pricingType.length) {

          pricingtype.sort((a,b) => a.vehicletype.sortId - b.vehicletype.sortId )
          // console.log(pricingtype);
          res.status(200);
          res.json(pricingtype);
        }
      }
    } else {
      res.status(400);
      throw new Error("not found");
    }
    // new
  }),

  // getAmount: asyncHandler(async (req, res) => {
  //   const { km } = req.body;
  //   console.log(km,"This is get amout km");
  //   let pricingtype = [];
  //   const pricingType = await Pricing.find().exec();
  //   if (pricingType) {
  //     for (let i = 0; i < pricingType.length; i++) {
  //       let amount = await getAmountfun(km, pricingType[i]._id);
  //       pricingtype.unshift(amount);
  //       if (pricingtype.length === pricingType.length) {
  //         res.status(200);
  //         res.json(pricingtype);
  //       }
  //     }
  //   } else {
  //     res.status(400);
  //     throw new Error("not found");
  //   }
  // }),

  // @desc get all pricing type
  // @router GET /api/customer/pricing-type
  // @access PRIVATE

  getPricingType: asyncHandler(async (req, res) => {
    let pricing = [];
    const allPricingType = await Pricing.find().exec();
    allPricingType && allPricingType.map((data) => pricing.unshift(data));
    if (allPricingType.length === pricing.length) {
      res.status(200);
      res.json(pricing);
    } else {
      res.status(400);
      throw new Error("not found");
    }
  }),

  // @desc get single pricing type
  // @router GET /api/customer/single-pricing-type
  // @access PRIVATE

  getSinglePricingType: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const pricingType = await Pricing.findById(id).exec();
    if (pricingType) {
      res.status(200);
      res.json(pricingType);
    } else {
      res.status(400);
      throw new Error("not found");
    }
  }),

  // @desc order booking
  // @router POST /api/customer/booking-order
  // @access PRIVATE

  bookingOrder: asyncHandler(async (req, res) => {
    try {
      const {
        promoCodeDetails,
        vehicleId,
        customerId,
        mainAddress,
        address2,
        address3,
        km,
        amount,
        paymentType,
        comment,
        oldAmount,
        extraCharge,
        nightSurge,
        place,
        timeTaken
      } = req.body;

   

      let stops = {
        total: 2,
        data: [],
      };

      if (address2.location) {
        stops.total = 3;
        stops.data[0] = {
          lng: mainAddress.pickupPoint.lan,
          lat: mainAddress.pickupPoint.lat,
          id: "stop1",
        };
        stops.data[1] = { lng: address2.lan, lat: address2.lat, id: "stop2" };
        stops.data[2] = {
          lng: mainAddress.dropPoint.lan,
          lat: mainAddress.dropPoint.lat,
          id: "stop3",
        };
      } else {
        stops.total = 2;
        stops.data[0] = {
          lng: mainAddress.pickupPoint.lan,
          lat: mainAddress.pickupPoint.lat,
          id: "stop1",
        };
        stops.data[1] = {
          lng: mainAddress.dropPoint.lan,
          lat: mainAddress.dropPoint.lat,
          id: "stop2",
        };
      }

      var today = todayDate();
      var currentTime = formatAMPM(new Date());
      const price = parseInt(amount.toFixed(2));
      const time = formatAMPM(new Date());
      const date = todayDate();
      const bookingId = await generateOrderId();
      const details = await getAmountfun(km, vehicleId, false,
        false,
        false,
        timeTaken);

      const customer = await Customers.findById(customerId).exec();

      let timeNow = new Date();
      // console.log(uuidv4());
      // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      const bookingDetails = await Booking.create({
        Id: uuidv4(),
        customerId: customer._id,
        bookingId: bookingId,
        timer: timeNow,
        userFcmToken: customer.fcmToken,
        stops: stops,
        customer: {
          name: customer.firstName + " " + customer.lastName,
          mobNo: customer.phoneNumber,
        },
        mainAddress: {
          pickupPoint: {
            location: mainAddress.pickupPoint.location,   
            lan: mainAddress.pickupPoint.lan,
            lat: mainAddress.pickupPoint.lat,
            name: mainAddress.pickupPoint.name,
            phoneNumber: mainAddress.pickupPoint.phoneNumber,
          },
          dropPoint: {
            location: mainAddress.dropPoint.location,
            lan: mainAddress.dropPoint.lan,
            lat: mainAddress.dropPoint.lat,
            name: mainAddress.dropPoint.name,
            phoneNumber: mainAddress.dropPoint.phoneNumber,
          },
        },
        address2: {
          location: address2.location,
          lan: address2.lan,
          lat: address2.lat,
          name: address2.name,
          phoneNumber: address2.phoneNumber,
        },
        address3: {
          location: address3.location,
          lan: address3.lan,
          lat: address3.lat,
          name: address3.name,
          phoneNumber: address3.phoneNumber,
        },
        vehicleType: details.vehicletype.vehicleType,
        subType: details.vehicletype.subType,
        place: place,
        paymentDetails: {
          amount: price,
          paymentType: paymentType,
          extraCharge: extraCharge,
          nightSurge: nightSurge,
          oldAmount: oldAmount,
        },
        oldDrivers: [],
        oldDriversFcm: [],
        comment: comment,
        place: place,
        bookingDate: date + " " + time,
      });

      if (promoCodeDetails.appliedCoupon && bookingDetails) {
        const couponDetails = await PromoCode.findOne({
          promocode: promoCodeDetails.code,
        }).exec();
        if (couponDetails) {
          Booking.findByIdAndUpdate(bookingDetails._id, {
            appliedCoupon: true,
            promoCodeDetails: {
              id: couponDetails._id,
              code: couponDetails.promocode,
              off: couponDetails.couponValue,
              discount: promoCodeDetails.discount,
            },
          }).exec(async (err, done) => {
            await PromoCode.findByIdAndUpdate(couponDetails._id, {
              $inc: {
                completedRides: 1,
              },
            }).exec();
          });
        } else {
          console.log("promocode not found");
        }
      }
      if (bookingDetails) {
        if (paymentType === "Wallet") {
         
          Customers.findOneAndUpdate(
            { _id: customerId },
            {
              $inc: {
                wallet: -price,
              },
            },
            { new: true }
          ).exec(async (err, done) => {
            if (!err) {
              const customer = await Customers.findById(customerId).exec();
              // setup walletlogs id with database HelperCollection

              // is exist customer
              if (customer) {
                const isExist = await HelperCollection.findOne({
                  walletlogsid: customer._id,
                }).exec();
                if (isExist) {
                  var walletlogID = isExist.count + 1;

                  await HelperCollection.findOneAndUpdate(
                    { walletlogsid: isExist.walletlogsid },
                    {
                      $inc: {
                        count: 1,
                      },
                    }
                  ).exec();

                   Customers.updateOne(
                    { _id: customerId },
                    {
                      $push: {
                        walletlogs: {
                          walletlogid: walletlogID,
                          transactionBy:
                            customer.firstName + " " + customer.lastName,
                          holder: customer.firstName + " " + customer.lastName,
                          amount: price,
                          comment: `For Order : ${bookingDetails.bookingId}`,
                          transactionType: "Debited",
                          dateAndTime: today + " " + currentTime,
                        },
                      },
                    }
                  ).exec((err) => {
                    if (err) {
                      console.log(err);
                    }
                  });
                } else {
                  await HelperCollection.create({
                    walletlogsid: customer._id,
                    count: 1,
                  });
                  var walletlogID = 1;

                   Customers.updateOne(
                    { _id: customerId },
                    {
                      $push: {
                        walletlogs: {
                          walletlogid: walletlogID,
                          transactionBy:
                            customer.firstName + " " + customer.lastName,
                          holder: customer.firstName + " " + customer.lastName,
                          amount: price,
                          comment: `For Order : ${bookingDetails.bookingId}`,
                          transactionType: "Debited",
                          dateAndTime: today + " " + currentTime,
                        },
                      },
                    }
                  ).exec((err) => {
                    if (err) {
                      console.log(err);
                    }
                  });
                }
              }
            } else {
              console.log(err);
            }

          });
        }
        // console.log(bookingDetails._id);
        Customers.findByIdAndUpdate(customerId, {
          $inc: {
            placedOrders: 1,
          },
        }).exec((err) => {
          if (err) {
            console.log(err);
          } else {
            // console.log(bookingDetails.Id);
            res.status(200);
            res.json({
              message: "order success",
              bookingId: bookingDetails.Id,
              pick_up_lan: bookingDetails.mainAddress.pickupPoint.lan,
              pick_up_lat: bookingDetails.mainAddress.pickupPoint.lat,
            });
          }
        });
      } else {
        res.status(400);
        res.json({
          message: "order Failed",
        });
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc get transaction history
  // POST /api/customer/transaction-history
  // @access PRIVATE

  getTransactionHistory: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const details = await Customers.findById(id).exec();
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

  // @desc get all coupons
  // @router GET /api/customer/coupons
  // @access PRIVATE

  getPromocode: asyncHandler(async (req, res) => {
    try {
      let { _id } = req.customer;
      let promocode = [];
      let customer = await Customers.findById(_id).exec();
      let promocodes = await PromoCode.find({ status: "Active" }).exec();
      if (promocodes) {
        promocodes.map((data) => {
          if (data.category === "specific") {
            if (data.maxRides >= data.completedRides) {
              if (
                data.users.phoneNumber === customer.phoneNumber ||
                data.users.id === customer.cutomerID
              ) {
                promocode.push(data);
              }
            }
          } else {
            if (data.maxRides >= data.completedRides) {
              // console.log(customer.appliedCoupons);

              promocode.push(data);
            }
          }
        });

        res.status(200);
        res.json(promocode);
      } else {
        res.status(400);
        throw new Error("not found promocodes");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  // @desc check coupon
  // @router POST /api/customer/check-promocode
  // @access PRIVATE

  checkPromocode: asyncHandler(async (req, res) => {
    try {
      var { promocode, km, time } = req.body;
      console.log(req.body, ")))))))))))))))))))))))))))))00000000000");
      km = parseFloat(km);
      const isAvailable = await PromoCode.findOne({
        promocode: promocode,
      }).exec();
      if (isAvailable) {
        const {
          couponValue,
          minPrice,
          maxDiscount,
          maxRides,
          users,
          couponType,
          completedRides,
        } = isAvailable;

        if (maxRides >= completedRides) {
          var pricingTypeDetails = await Pricing.find().exec();
          if (users.id || users.phoneNumber) {
            // specific users
            const customer = await Customers.findOne({
              $or: [
                { phoneNumber: users.phoneNumber },
                { cutomerID: users.id },
              ],
            }).exec();
            if (customer) {
              if (couponType === "percentage") {
                var pricingType = [];
                // do the method calculating with percentage
                for (i = 0; i < pricingTypeDetails.length; i++) {
                  let pricing = await getAmountfun(
                    km,
                    pricingTypeDetails[i]._id,
                    couponValue,
                    minPrice,
                    maxDiscount,
                    time
                  );
                  pricingType.push(pricing);
                  if (pricingTypeDetails.length === pricingType.length) {
                    pricingType.sort((a,b) => a.vehicletype.sortId - b.vehicletype.sortId )
                    res.status(200);
                    res.json({
                      promocode: isAvailable.promocode,
                      promocodeId: isAvailable._id,
                      result: pricingType,
                    });
                  }
                }
              } else {
                // do with another method
              }
            } else {
              res.status(400);
              throw new Error("not found customer");
            }
          } else {
            if (couponType === "percentage") {
              // do the method calculating percentage
              var pricingType = [];
              for (let i = 0; i < pricingTypeDetails.length; i++) {
                const element = pricingTypeDetails[i];

                let data = await getAmountfun(
                  km,
                  element._id,
                  couponValue,
                  minPrice,
                  maxDiscount,
                  time
                );
                pricingType.unshift(data);
                if (pricingType.length === pricingTypeDetails.length) {
                  pricingType.sort((a,b) => a.vehicletype.sortId - b.vehicletype.sortId )
                  console.log("result_________________");
                  console.log({
                    promocode: isAvailable.promocode,
                    promocodeId: isAvailable._id,
                    result: pricingType,
                  });

                  console.log("result end _______________________________________");
                  res.status(200);
                  res.json({
                    promocode: isAvailable.promocode,
                    promocodeId: isAvailable._id,
                    result: pricingType,
                  });
                }
              }
            } else {
              // do with another method
            }
          }
        } else {
          res.status(400);
          throw new Error("maximum rides reached");
        }
      } else {
        res.status(400);
        throw new Error("Invalid Promocode");
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc cancel order
  // @router POST /api/customer/cancel-order
  // @access PRIVATE

  cancelOrder: asyncHandler(async (req, res) => {
    const { id } = req.body;
    let order = await Booking.findById(id);
    if (order) {
      if (order.status != "Expired") {
        Booking.findByIdAndUpdate(id, {
          status: "cancel",
        }).exec((err, done) => {
          if (!err) {
            res.status(200);
            res.json({ message: "Successfully Order Cancelled" });
          } else {
            res.status(400);
            throw new Error({ message: "Order Cancel Failed" });
          }
        });
      } else {
        console.log("already expired");
      }
    }
  }),

  // @desc customer getBanner
  // POST /api/customer/getBanner
  // @access PUBLIC

  getCustomerBanner: asyncHandler(async (req, res) => {
    const banners = await BannerUser.find().exec();
    if (banners) {
      res.status(200);
      res.json(banners);
    } else {
      res.status(401);
      throw new Error("Not found customer banner ");
    }
  }),

  orderHistory: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orders = await Booking.find({ customerId: id, actualOrder: true })
      .sort({ createdAt: -1 })
      .exec();
    if (orders) {
      res.status(200);
      res.json(orders);
    } else {
      res.status(400);
      throw new Error("something went wrong");
    }
  }),

  checkEnteredPromocode: asyncHandler(async (req, res) => {
    const { promoCode } = req.body;
    const promoCodeDetails = await PromoCode.findOne({
      promocode: promoCode,
    }).exec();
    if (promoCodeDetails) {
      if (promoCodeDetails.category === "Specific") {
        if (
          promoCodeDetails.users.id === req.customer.cutomerID ||
          promoCodeDetails.users.phoneNumber === req.customer.phoneNumber
        ) {
          res.json({
            status: true,
            message: "Coupon Founded",
            couponId: promoCodeDetails._id,
          });
        } else {
          res.json({ status: false, message: "Invalid Coupon Applied!..." });
        }
      } else if (promoCodeDetails.category === "General") {
        res.json({
          status: true,
          message: "Coupon Founded",
          couponId: promoCodeDetails._id,
        });
      }
    } else {
      res.json({ status: false, message: "Invalid Coupon Applied!..." });
    }
  }),

  rentalController: asyncHandler(async (req, res) => {
    const data = await Pricing.find({
      $or: [
        { vehicleType: "Tata ACE 7ft" },
        { vehicleType: "Tata ACE 8ft / Bolero" },
      ],
    }).exec();
    let resArray = [];
    for (let i = 0; i < data.length; i++) {
      resArray.push({
        data: data[i],
      });
    }
    if (data) {
      console.log(resArray, " ============================= resArray");
      res.status(200);
      res.json(resArray);
    } else {
      res.status(400);
      throw new Error("not found vehicle");
    }
  }),

  rentalPlaceOrder: asyncHandler(async (req, res) => {
    try {
      const {
        customerId,
        amount,
        place,
        name,
        phoneNumber,
        location,
        subType,
        vehicle,
        paymentType,
        promoCodeId,
        promoCodeDetails,
        oldAmount,
      } = req.body;
      const customer = await Customers.findById(customerId).exec();
      const time = formatAMPM(new Date());
      const date = todayDate();
      if (customer) {
        const details = await Booking.create({
          Id: uuidv4(),

          customerId: customer._id,
          place: place,
          bookingId: await generateOrderId(),
          customer: {
            name: customer.firstName + " " + customer.lastName,
            mobNo: customer.phoneNumber,
          },
          mainAddress: {
            pickupPoint: {
              location: location.title,
              lat: location.lat,
              lan: location.lng,
              name: name,
              phoneNumber: phoneNumber,
            },
            dropPoint: {
              location: null,
              lan: null,
              lat: null,
              name: null,
              phoneNumber: null,
            },
          },
          address2: {
            location: null,
            lan: null,
            lat: null,
            name: null,
            phoneNumber: null,
          },
          address3: {
            location: null,
            lan: null,
            lat: null,
            name: null,
            phoneNumber: null,
          },
          paymentDetails: {
            amount: amount,
            paymentType: paymentType,
            oldAmount: oldAmount,
          },
          vehicleType: vehicle,
          subType: subType,
          bookingDate: date + " " + time,
          rent: true,
          oldDrivers: [],
          oldDriversFcm: [],
          userFcmToken: customer.fcmToken,
        });
        if (promoCodeDetails.appliedCoupon) {
          const couponDetails = await PromoCode.findById(promoCodeId).exec();
          if (couponDetails) {
            Booking.findByIdAndUpdate(details._id, {
              appliedCoupon: true,
              promoCodeDetails: {
                id: couponDetails._id,
                code: promoCodeDetails.code,
                off: promoCodeDetails.off,
                discount: promoCodeDetails.discount,
              },
            }).exec(async (err, done) => {
              await PromoCode.findByIdAndUpdate(couponDetails._id, {
                $inc: {
                  completedRides: 1,
                },
              }).exec();
            });
          }
        }

        if (details) {
          if (paymentType === "Wallet") {
            Customers.findOneAndUpdate(
              { _id: customerId },
              {
                $inc: {
                  wallet: -amount,
                },
              },
              { new: true }
            ).exec(async (err, done) => {
              if (!err) {
                const customer = await Customers.findById(customerId).exec();
                // setup walletlogs id with database HelperCollection

                // is exist customer
                const isExist = await HelperCollection.findOne({
                  walletlogsid: customer._id,
                }).exec();
                if (isExist) {
                  var walletlogID = isExist.count + 1;

                  await HelperCollection.findOneAndUpdate(
                    { walletlogsid: isExist.walletlogsid },
                    {
                      $inc: {
                        count: 1,
                      },
                    }
                  ).exec();
                } else {
                  await HelperCollection.create({
                    walletlogsid: customer._id,
                    count: 1,
                  });
                  var walletlogID = 1;
                }

                // res.json({ isExist: isExist, id: customer._id });

                Customers.findByIdAndUpdate(customerId, {
                  $push: {
                    walletlogs: {
                      walletlogid: walletlogID,
                      transactionBy:
                        customer.firstName + " " + customer.lastName,
                      holder: customer.firstName + " " + customer.lastName,
                      amount: amount,
                      comment: `For Order : ${details.bookingId}`,
                      transactionType: "Debited",
                      dateAndTime: date + " " + time,
                    },
                  },
                }).exec((err, done) => {
                  if (err) err;
                });
              } else {
                console.log(err);
              }
            });
          }
          res.status(200);
          res.json(details);
        } else {
          res.status(400);
          throw new Error("Something went wrong.");
        }
      }
    } catch (error) {
      console.log(error);
    }
  }),

  rentalApplyCoupon: asyncHandler(async (req, res) => {
    const { couponid } = req.params;
    const couponDetails = await PromoCode.findById(couponid).exec();
    if (
      couponDetails.status === "Active" &&
      couponDetails.completedRides <= couponDetails.maxRides
    ) {
      const details = await Pricing.find({
        $or: [
          { vehicleType: "Tata ACE 7ft" },
          { vehicleType: "Tata ACE 8ft / Bolero" },
        ],
      }).exec();
      if (details) {
        let pricingType = [];
        for (let i = 0; i < details.length; i++) {
          const data = await appliedCoupon(details[i], couponid);
          pricingType.push(data);
        }
        res.status(200);
        res.json(pricingType);
      } else {
        res.status(400);
        throw new Error("not found pricing");
      }
    } else {
      res.status(400);
      throw new Error("Coupon not applied!...");
    }
  }),

  createReview: asyncHandler(async (req, res) => {
    try {
      const { bookingId, rating, comment } = req.body;
      const bookingDetails = await Booking.findById(bookingId).exec();
      const driver = await Driver.findById(bookingDetails.driverId).exec();
      if (driver) {
        const review = {
          name: req.customer.firstName + " " + req.customer.lastName,
          phoneNumber: req.customer.phoneNumber,
          orderId: bookingDetails.bookingId,
          id: bookingDetails._id,
          rating: Number(rating),
          comment,
          user: req.customer._id,
        };
        driver.reviews.push(review);

        driver.numReviews = driver.reviews.length;

        let dRateing =
          driver.reviews.reduce((acc, item) => item.rating + acc, 0) /
          driver.reviews.length;
        driver.rating = Number(dRateing.toFixed(1));
        await driver.save();

        await Booking.findByIdAndUpdate(bookingId, {
          rated: true,
        }).exec();
        res.status(201).json({ message: "Review added" });
      } else {
        res.status(400);
        throw new Error("not found driver");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  getCoins: asyncHandler(async (req, res) => {
    try {
      const { customerid } = req.params;
      let coinHistory = [];
      const details = await Customers.findById(customerid).exec();
      const claimOffers = await ClaimOffers.find().exec();
      if (details) {
        details.coinHistory.map((history) => {
          coinHistory.unshift(history);
        });
        res.status(200);
        res.json({
          totalCoins: details.coins,
          claimOffers: claimOffers,
          coinHistory: coinHistory,
        });
      } else {
        res.status(400);
        throw new Error("Not found user");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  createClaimWithdrawalRequest: asyncHandler(async (req, res) => {
    try {
      const { customerId, claimOfferId } = req.body;
      const customerDetails = await Customers.findById(customerId).exec();
      const claimOfferDetails = await ClaimOffers.findById(claimOfferId).exec();
      const createClaimOfferRequest = await ClaimWithdrawal.create({
        claimOffersId: claimOfferDetails._id,
        offerDetails: {
          title: claimOfferDetails.title,
          img: claimOfferDetails.img_url,
          needCoins: claimOfferDetails.coins,
        },
        customerDetails: {
          customerId: customerDetails._id,
          name: customerDetails.firstName + " " + customerDetails.lastName,
          phoneNumber: customerDetails.phoneNumber,
          email: customerDetails.email,
          totalCoins: customerDetails.coins,
        },
      });

      customerDetails.coins = customerDetails.coins - claimOfferDetails.coins;
      customerDetails.coinHistory.push({
        date: todayDate(),
        status: "Debited",
        details: "Claim Offer : " + claimOfferDetails.title,
        coins: claimOfferDetails.coins,
      });
      await customerDetails.save();
      if (createClaimOfferRequest) {
        res.status(200);
        res.json(createClaimOfferRequest);
      } else {
        res.status(400);
        throw new Error("Request Claim Offer Failed!...");
      }
    } catch (error) {
      console.log(error);
    }
  }),
};

async function appliedCoupon(data, couponId) {
  const couponDetails = await PromoCode.findById(couponId).exec();
  const rentalAmount = data.rentalAmount;
  const couponValue = couponDetails.couponValue;
  const maxDiscount = couponDetails.maxDiscount;
  const couponType = couponDetails.couponType; //percentage
  if (couponType === "percentage") {
    let discountValue = (rentalAmount * couponValue) / 100;
    let amount = rentalAmount - discountValue;
    if (amount > maxDiscount) {
      var details = {
        data: data,
        totalAmount: data.rentalAmount,
        payableAmount: rentalAmount - maxDiscount,
        discount: discountValue,
        percentage: couponValue,
        maxDiscount: true,
        appliedCoupon: true,
      };
    } else {
      var details = {
        data: data,
        totalAmount: data.rentalAmount,
        payableAmount: amount,
        discount: discountValue,
        percentage: couponValue,
        appliedCoupon: true,
        maxDiscount: false,
      };
    }
    return details;
  }
}
