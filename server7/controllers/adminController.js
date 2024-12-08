const asyncHandler = require("express-async-handler");
const generateToken = require("../utility/generateToken");
const Admin = require("../models/admin_model");
const Customers = require("../models/customer_model");
const HelperCollection = require("../models/helper_model");
const Pricing = require("../models/pricing_model");
const v2 = require("cloudinary");
const cloudinary = v2;
const bcrypt = require("bcryptjs");
const BannerDriver = require("../models/driverBanner_model");
const BannerUser = require("../models/customerBanner_model");
const Booking = require("../models/booking_model");
const Driver = require("../models/driver_model");
const SubAdmin = require("../models/sub-admin_model");
const { v4 } = require("uuid");
const moment = require("moment");
const PromoCode = require("../models/promocode_model");
const Commision = require("../models/commision_model");
const {
  approvalNotification,
  allDriverNotification,
  blockDriverNotification,
  unBlockDriverNotification,
  allUserNotification,
  blockUserNotification,
  unBlockUserNotification,
  allUnRegisteredDriverNotification,
  driverRejectionNotification,
} = require("../fcm/notification");

const Withdrawal = require("../models/withdrawalRequest_model");
const Version = require("../models/version_model");
const S3 = require("aws-sdk/clients/s3");
const {
  uploadImages,
  deleteImages,
} = require("../awsConfig/manage_aws_images");
const ClaimOffers = require("../models/claim_offers_model");
const CoinPricing = require("../models/coin_pricing_model");
const ClaimWithdrawal = require("../models/claim_request_model");
const TransactionHistory = require("../models/paytm_transaction_history_model");

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const region = process.env.AWS_REGION;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const uuidv4 = v4;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// get time in 01:30 PM
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
  // get Current Date
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  today = dd + "/" + mm + "/" + yyyy;
  return today;
}

//decode date
function decodeDate(d) {
  var date = new Date(d);
  var day = String(date.getDate()).padStart(2, "0");
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var year = date.getFullYear();
  date = day + "/" + month + "/" + year;
  var date_array = d.split("T");
  let time_array = date_array[1].split(":");
  var hoursIST = parseInt(time_array[0]);
  var hoursIST2 = parseInt(time_array[0]);
  var minutesIST = parseInt(time_array[1]);
  var secondsIST = parseInt(time_array[2].split(".")[0]);
  hoursIST = hoursIST % 12;
  hoursIST = hoursIST ? hoursIST : 12; // the hour '0' should be '12'
  var ampm = hoursIST2 >= 12 ? "PM" : "AM";
  minutesIST = minutesIST < 10 ? "0" + minutesIST : minutesIST;
  secondsIST = secondsIST < 10 ? "0" + secondsIST : secondsIST;
  date = date.split("/").join("-");
  var str = date + " " + hoursIST + ":" + minutesIST + ":" + secondsIST;

  const myDate = "2022-06-11 11:20:54";

  var newDate = myDate.add(3, "h").add(30, "m").format("YYYY-MM-DD hh:mm:ss");

  return;
}

module.exports = {
  // @desc : Admin Login
  // @router :  POST /api/admin/login
  // @access : PUBLIC

  adminLogin: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    const admin = await Admin.findOne({
      email,
    }).exec();
    if (!admin) {
      res.status(400);
      throw new Error("Email or Place worng. Please Try again!...");
    }
    if (admin && (await admin.matchPassword(password))) {
      if (admin) {
        console.log(admin);
        res.json({
          _id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          token: generateToken(admin._id),
        });
      } else {
        res.status(400);
        throw new Error("Unauthorized");
      }
    } else {
      res.status(400);
      throw new Error("Wrong Password!..");
    }
  }),

  // @desc : Admin Register
  // @router :  POST /api/admin/register
  // @access : PUBLIC

  adminRegister: asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, place } = req.body;
    const admin = await Admin.create({
      firstName,
      lastName,
      email,
      password,
    });
    if (admin) {
      res.status(200);
      res.json({
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        place: admin.place,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400);
      throw new Error("Create Admin failed!..");
    }
  }),
  // @desc get all customers
  // @router GET /api/admin/manage-customers-notification
  // @access PRIVATE

  getUserListNotification: asyncHandler(async (req, res) => {
    Customers.aggregate(
      [{ $sort: { createdAt: -1 } }],
      function (err, customers) {
        if (err) console.log(err);

        if (customers) {
          res.status(200);
          res.json(customers);
        } else {
          res.status(401);
          throw new Error("Not found customers");
        }
      }
    );
  }),

  // @desc get all customers
  // @router GET /api/admin/manage-customers
  // @access PRIVATE

  manageCutomers: asyncHandler(async (req, res) => {
    let { rowCount, skip = 0, status_filter, content } = req.query;
    if (content === "null") content = "";
    let search = {
      $match: {
        $or: [
          { cutomerID: { $regex: content, $options: "i" } },
          {
            firstName: {
              $regex: content,
              $options: "i",
            },
          },
          {
            lastName: {
              $regex: content,
              $options: "i",
            },
          },
          {
            email: {
              $regex: content,
              $options: "i",
            },
          },
          {
            phoneNumber: {
              $regex: content,
              $options: "i",
            },
          },
          {
            place: {
              $regex: content,
              $options: "i",
            },
          },
          {
            dateAndTime: {
              $regex: content,
              $options: "i",
            },
          },
        ],
      },
    };

    var statusFilter;
    var status;
    if (
      !status_filter ||
      status_filter == "undefined" ||
      status_filter === "" ||
      status_filter === "Blocked,Active"
    ) {
      statusFilter = undefined;
    } else if (status_filter === "Blocked") {
      status = true;
      statusFilter = true;
    } else if (status_filter === "Active") {
      status = false;
      statusFilter = true;
    }

    if (!statusFilter) {
      Customers.aggregate(
        [
          { $sort: { createdAt: -1 } },
          search,
          //  dateFilter,
          { $skip: +skip },
          { $limit: +rowCount },
        ],
        function (err, customers) {
          if (err) console.log(err);

          if (customers) {
            res.status(200);
            res.json(customers);
          } else {
            res.status(401);
            throw new Error("Not found customers");
          }
        }
      );
    } else {
      Customers.aggregate(
        [
          { $sort: { createdAt: -1 } },
          search,
          //  dateFilter,
          {
            $match: {
              isBlock: status,
            },
          },
          { $skip: +skip },
          { $limit: +rowCount },
        ],
        function (err, customers) {
          if (err) console.log(err);

          if (customers) {
            res.status(200);
            res.json(customers);
          } else {
            res.status(401);
            throw new Error("Not found drivers");
          }
        }
      );
    }
  }),

  // @desc create customers
  // @router GET /api/admin/create-customer
  // @access PRIVATE

  createCustomer: asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      gst,
      wallet,
      orders,
      reviews,
      csnote,
      isBlock,
    } = req.body;
    // get Current Date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;

    const customer = await Customers.create({
      firstName,
      lastName,
      email,
      gst,
      wallet,
      orders,
      reviews,
      csnote,
      isBlock,
      dateAndTime: today + " " + formatAMPM(new Date()),
    });
    if (customer) {
      res.status(200);
      res.json({
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        gst: customer.gst,
        wallet: customer.wallet,
        orders: customer.orders,
        reviews: customer.reviews,
        csnote: customer.csnote,
        isBlock: customer.isBlock,
        dateAndTime: customer.dateAndTime,
      });
    } else {
      res.status(401);
      throw new Error("create user failed!...");
    }
  }),
  // @desc edit admin details
  // @router GET /api/admin/update-admin-details
  // @access PRIVATE
  adminEditDetails: asyncHandler(async (req, res) => {
    try {
      const { firstName, lastName, email, confirmed_pwd, oldPwd, id } =
        req.body;

      if (confirmed_pwd) {
        const salt = await bcrypt.genSalt(10);
        let password = await bcrypt.hash(confirmed_pwd, salt);

        const admin = await Admin.findByIdAndUpdate(id, {
          firstName,
          lastName,
          email,
          password,
        }).exec();

        if (admin) {
          res.status(200);
          res.json({
            _id: admin._id,
            firstName: firstName,
            lastName: lastName,
            email: admin.email,
            token: generateToken(admin._id),
            ok: true,
          });
        }
      } else {
        const admin = await Admin.findByIdAndUpdate(id, {
          firstName,
          lastName,
          email,
        }).exec();
        if (admin) {
          res.status(200);
          res.json({
            _id: admin._id,
            firstName: firstName,
            lastName: lastName,
            email: admin.email,
            token: generateToken(admin._id),
            ok: true,
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }),
  // @desc check admin passwod
  // @router GET /api/admin/check-password
  // @access PRIVATE

  adminCheckPassword: asyncHandler(async (req, res) => {
    const { password, id } = req.body;
    const admin = await Admin.findById(id).exec();
    if (!admin) {
      res.json({
        status: false,
      });
      res.status(200);
    }
    let ok = await admin.matchPassword(password);
    if (admin && ok) {
      res.status(200);
      res.json({
        status: true,
      });
    } else {
      res.json({
        status: false,
      });
      res.status(200);
    }
  }),

  // @desc edit sub-admin
  // @router GET /api/admin/edit-subadmin
  // @access PRIVATE

  editSubAdmin: asyncHandler(async (req, res) => {
    const { fistName, lastName, email, password, subAdminId } = req.body;
    let subAdmin = await SubAdmin.findByIdAndUpdate(subAdminId, {
      fistName,
      lastName,
      email: email,
      password: password,
    }).exec();
    if (subAdmin) {
      res.status(200);
      res.json({ ok: true });
    } else {
      res.status(401);
      throw new Error("create user failed!...");
    }
  }),

  // @desc create sub-admin
  // @router GET /api/admin/create-subadmin
  // @access PRIVATE

  createSubAdmin: asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    let exist = await SubAdmin.findOne({ email: email }).exec();
    if (exist) {
      let newObj = { ...exist };
      newObj.exist = true;
      res.json(newObj);
    } else {
      const subadmin = await SubAdmin.create({
        firstName,
        lastName,
        email,
        password,
      });
      if (subadmin) {
        res.status(200);
        let newObj = { ...subadmin };
        newObj.exist = false;
        res.json(newObj);
      } else {
        res.status(401);
        throw new Error("create user failed!...");
      }
    }
  }),

  // @desc block driver
  // @router PUT /api/admin/block-driver
  // @access PRIVATE

  blockDriver: asyncHandler(async (req, res) => {
    const { driverId, comment } = req.body;

    var currentTime = formatAMPM(new Date());
    // get Current Date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
    // find Admin
    const getAdmin = await Admin.findById(req.admin._id).exec();
    if (getAdmin) {
      // update customer document
      const update = await Driver.findByIdAndUpdate(driverId, {
        isBlock: true,
        status: "Blocked",
        $push: {
          csnotes: {
            admin: getAdmin.firstName + " " + getAdmin.lastName,
            comment: "Block ): " + comment,
            dateAndTime: today + " " + currentTime,
          },
        },
      }).exec();
      if (update) {
        let token = generateToken(update._id);
        blockDriverNotification(update.fcmToken);
        res.status(200);
        res.json({ token, driverId: update._id });
      } else {
        res.status(400);
        throw new Error("driver Block Failed!..");
      }
    }
  }),

  // @desc unblock driver
  // @router PUT /api/admin/unblock-driver
  // @access PRIVATE

  unblockDriver: asyncHandler(async (req, res) => {
    const { driverId, comment } = req.body;
    var currentTime = formatAMPM(new Date());
    // get Current Date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
    // find admin
    const getAdmin = await Admin.findById(req.admin._id).exec();
    if (getAdmin) {
      // update customer document
      const update = await Driver.findByIdAndUpdate(driverId, {
        isBlock: false,
        status: "Active",
        $push: {
          csnotes: {
            admin: getAdmin.firstName + " " + getAdmin.lastName,
            comment: "Unblock ): " + comment,
            dateAndTime: today + " " + currentTime,
          },
        },
      }).exec();
      if (update) {
        let token = generateToken(update._id);
        unBlockDriverNotification(update.fcmToken);
        res.status(200);
        res.json({ token, driverId: update._id });
      } else {
        res.status(400);
        throw new Error("Unblock driver Failed!...");
      }
    }
  }),
  // @desc block customer
  // @router PUT /api/admin/block-customer
  // @access PRIVATE

  blockCustomer: asyncHandler(async (req, res) => {
    const { customerId, comment } = req.body;
    var currentTime = formatAMPM(new Date());
    // get Current Date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
    // find Admin
    const getAdmin = await Admin.findById(req.admin._id).exec();
    if (getAdmin) {
      // update customer document
      const update = await Customers.findByIdAndUpdate(customerId, {
        isBlock: true,
        $push: {
          csnote: {
            admin: getAdmin.firstName + " " + getAdmin.lastName,
            comment: "Block ): " + comment,
            dateAndTime: today + " " + currentTime,
          },
        },
      }).exec();
      if (update) {
        blockUserNotification(update.fcmToken);
        let token = generateToken(update._id);
        res.status(200);
        res.json({ token, ok: true, customerId });
      } else {
        res.status(400);
        throw new Error("Customer Block Failed!..");
      }
    }
  }),

  // @desc unblock customer
  // @router PUT /api/admin/unblock-customer
  // @access PRIVATE

  unblockCustomer: asyncHandler(async (req, res) => {
    const { customerId, comment } = req.body;
    var currentTime = formatAMPM(new Date());
    // get Current Date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
    // find admin
    const getAdmin = await Admin.findById(req.admin._id).exec();
    if (getAdmin) {
      // update customer document
      const update = await Customers.findByIdAndUpdate(customerId, {
        isBlock: false,
        $push: {
          csnote: {
            admin: getAdmin.firstName + " " + getAdmin.lastName,
            comment: "Unblock ): " + comment,
            dateAndTime: today + " " + currentTime,
          },
        },
      }).exec();
      if (update) {
        unBlockUserNotification(update.fcmToken);
        let token = generateToken(update._id);
        res.status(200);
        res.json({ token, ok: true, customerId });
      } else {
        res.status(400);
        throw new Error("Unblock Customer Failed!...");
      }
    }
  }),

  // @desc add Comment to customer
  // @router PUT /api/admin/add-comment
  // @access PRIVATE

  addComment: asyncHandler(async (req, res) => {
    const { customerId, comment, adminName } = req.body;
    var currentTime = formatAMPM(new Date());
    // get Current Date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
    // find admin
    // const getAdmin = await Admin.findById(req.admin._id).exec();
    // if (getAdmin) {
    // update customer document
    const update = await Customers.findByIdAndUpdate(customerId, {
      isBlock: false,
      $push: {
        csnote: {
          admin: adminName,
          comment: comment,
          dateAndTime: today + " " + currentTime,
        },
      },
    }).exec();
    if (update) {
      res.status(200);
      res.json({ ok: true });
    } else {
      res.status(400);
      throw new Error("Unblock Customer Failed!...");
    }
    // }
  }),

  // @desc add wallet to customer
  // @router PUT /api/admin/add-wallet
  // @access PRIVATE

  addWallet: asyncHandler(async (req, res) => {
    const { customerId, wallet, comment } = req.body;
    let type = wallet < 0 ? "Debited" : "Credited";
    var currentTime = formatAMPM(new Date());
    var today = todayDate();
    const getCustomer = await Customers.findOne({
      _id: customerId,
    }).exec();

    // check wallet
    if (parseInt(wallet) < 0) {
      if (getCustomer.wallet <= 0) {
        res.status(400);
        throw new Error("Reached Minimum. Not allow to dedect!..");
      } else {
        var checkWallet = getCustomer.wallet + parseInt(wallet);
        if (checkWallet < 0) {
          res.status(400);
          throw new Error(
            "This Amount not allow to dedect. Try Another Amount!..."
          );
        } else {
          const update = await Customers.findOneAndUpdate(
            { _id: customerId },
            {
              $inc: {
                wallet: wallet,
              },
            },
            { new: true }
          ).exec();
          if (update) {
            const customer = await Customers.findById(customerId).exec();
            // setup walletlogs id with database HelperCollection

            // is exist customer
            const isExist = await HelperCollection.findOne({
              walletlogsid: customer._id,
            }).exec();
            if (isExist) {
              var walletlogID = isExist.count + 1;
              const updateHelperCollection =
                await HelperCollection.findOneAndUpdate(
                  { walletlogsid: isExist.walletlogsid },
                  {
                    $inc: {
                      count: 1,
                    },
                  }
                ).exec();
            } else {
              const createCount = await HelperCollection.create({
                walletlogsid: customer._id,
                count: 1,
              });
              var walletlogID = 1;
            }

            // res.json({ isExist: isExist, id: customer._id });
            const addComment = await Customers.findByIdAndUpdate(customerId, {
              $push: {
                walletlogs: {
                  walletlogid: walletlogID,
                  transactionBy: req.admin.firstName + " " + req.admin.lastName,
                  holder: customer.firstName + " " + customer.lastName,
                  amount: wallet,
                  comment: comment,
                  transactionType: type,
                  dateAndTime: today + " " + currentTime,
                },
              },
            });

            if (addComment) {
              res.status(200);
              res.json({ ok: true });
            } else {
              res.status(400);
              throw new Error("Add Wallet Failed. Try again later!..");
            }
          }
        }
      }
    } else {
      const update = await Customers.findOneAndUpdate(
        { _id: customerId },
        {
          $inc: {
            wallet: wallet,
          },
        },
        { new: true }
      ).exec();
      if (update) {
        const customer = await Customers.findById(customerId).exec();
        // setup walletlogs id with database HelperCollection

        // is exist customer
        const isExist = await HelperCollection.findOne({
          walletlogsid: customer._id,
        }).exec();
        if (isExist) {
          var walletlogID = isExist.count + 1;
          const updateHelperCollection =
            await HelperCollection.findOneAndUpdate(
              { walletlogsid: isExist.walletlogsid },
              {
                $inc: {
                  count: 1,
                },
              }
            ).exec();
        } else {
          const createCount = await HelperCollection.create({
            walletlogsid: customer._id,
            count: 1,
          });
          var walletlogID = 1;
        }

        // res.json({ isExist: isExist, id: customer._id });
        const addComment = await Customers.findByIdAndUpdate(customerId, {
          $push: {
            walletlogs: {
              walletlogid: walletlogID,
              transactionBy: req.admin.firstName + " " + req.admin.lastName,
              holder: customer.firstName + " " + customer.lastName,
              amount: wallet,
              comment: comment,
              transactionType: type,
              dateAndTime: today + " " + currentTime,
            },
          },
        });
        if (addComment) {
          res.status(200);
          res.json({ ok: true });
        } else {
          res.status(400);
          throw new Error("Add Wallet Failed. Try again later!..");
        }
      }
    }
  }),

  // @desc get Single Customer
  // @router GET /api/admin/single-customer
  // @access PRIVATE

  getSingleCustomer: asyncHandler(async (req, res) => {
    const { customerid } = req.params;
    const customer = await Customers.findById(customerid).exec();
    if (customer) {
      res.status(200);
      res.json(customer);
    } else {
      res.status(400);
      throw new Error("Not Found Customer!...");
    }
  }),

  // @desc get Single Driver
  // @router GET /api/admin/single-driver-wallet
  // @access PRIVATE

  getSingleDriver: asyncHandler(async (req, res) => {
    const { driverId } = req.params;
    const driver = await Driver.findById(driverId).exec();

    if (driver) {
      res.status(200);
      res.json(driver);
    } else {
      res.status(400);
      throw new Error("Not Found Customer!...");
    }
  }),

  // @desc creating pricing table
  // @router Post /api/admin/create-pricing
  // @access PRIVATE

  createPricingTableData: asyncHandler(async (req, res) => {
    const {
      vehicleType,
      subType,
      baseKM,
      baseFare,
      minKM1,
      maxKM1,
      fareBetweenRange1,
      minKM2,
      maxKM2,
      fareBetweenRange2,
      greaterThanKm,
      fareAfterRange2,
      extraCharge,
      extraChargeReason,
      nightSurgeCharge,
      timeFrom,
      timeTo,
      image_url,
      capacity,
      rental,
      rentalAmount,
      size,
    } = req.body;
    const pricingData = await Pricing.create({
      vehicleType,
      subType,
      baseKM,
      baseFare,
      range1: minKM1 + " " + "-" + " " + maxKM1,
      minKM1,
      maxKM1,
      fareBetweenRange1,
      range2: minKM2 + " " + "-" + " " + maxKM2,
      minKM2,
      maxKM2,
      fareBetweenRange2,
      greaterThanKm,
      fareAfterRange2,
      extraCharge,
      extraChargeReason,
      nightSurgeCharge,
      nightSurgeTime: timeFrom + " " + "-" + " " + timeTo,
      nightSurgeTimeFrom: timeFrom,
      nightSurgeTimeTo: timeTo,
      image_url: image_url,
      capacity,
      rental,
      rentalAmount,
      size,
    });

    if (pricingData) {
      res.status(200);
      res.json(pricingData);
    } else {
      res.status(400);
      throw new Error("create pricing failed!..");
    }
  }),

  // @desc get all pricing details
  // @router GET /api/admin/pricing-data
  // @access PRIVATE

  pricingData: asyncHandler(async (req, res) => {
    const data = await Pricing.find().exec();
    if (data) {
      res.status(200);
      res.json(data);
    } else {
      res.status(400);
      throw new Error("not found");
    }
  }),

  // @desc get Single pricing detail
  // @router GET /api/admin/single-pricing-data
  // @access PRIVATE

  getSinglePricingType: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await Pricing.findById(id).exec();

    if (data) {
      res.status(200);
      res.json(data);
    } else {
      res.status(400);
      throw new Error("not found");
    }
  }),
  // @desc update pricing details
  // @router POST /api/admin/update-rental-pricingtype
  // @access PRIVATE
  updateRentalPricing: asyncHandler(async (req, res) => {
    const { vehicleType, subType, description, id, rentalAmount } = req.body;

    if (!description) description = "";
    const update = await Pricing.findByIdAndUpdate(id, {
      $set: {
        vehicleType: vehicleType,
        subType: subType,
        description: description,
        rentalAmount: rentalAmount,
      },
    }).exec();
    if (update) {
      res.status(200);
      res.json({ ok: true });
    } else {
      res.status(400);
      throw new Error("Update Failed!...");
    }
  }),
  // @desc update pricing details
  // @router POST /api/admin/update-pricingtype
  // @access PRIVATE

  updatePricing: asyncHandler(async (req, res) => {
    try {
      const {
        vehicleType,
        subType,
        baseKM,
        baseFare,
        minKM1,
        maxKM1,
        fareBetweenRange1,
        minKM2,
        maxKM2,
        fareBetweenRange2,
        fareAfterRange2,
        extraCharge,
        extraChargeReason,
        nightSurgeCharge,
        nightSurgeTimeFrom,
        nightSurgeTimeTo,
        greaterThanKm,
        id,
        rentalAmount,
        perminute,
      } = req.body;

      const update = await Pricing.findByIdAndUpdate(id, {
        $set: {
          vehicleType: vehicleType,
          subType: subType,
          baseKM: baseKM,
          baseFare: baseFare,
          range1: minKM1 + " " + "-" + " " + maxKM1,
          minKM1: minKM1,
          maxKM1: maxKM1,

          // description: description,

          fareBetweenRange1: fareBetweenRange1,
          range2: minKM2 + " " + "-" + " " + maxKM2,
          minKM2: minKM2,
          maxKM2: maxKM2,
          fareBetweenRange2: fareBetweenRange2,
          fareAfterRange2: fareAfterRange2,
          extraCharge: extraCharge,
          extraChargeReason: extraChargeReason,
          nightSurgeCharge: nightSurgeCharge,
          nightSurgeTime:
            nightSurgeTimeFrom + " " + "-" + " " + nightSurgeTimeTo,
          nightSurgeTimeFrom: nightSurgeTimeFrom,
          nightSurgeTimeTo: nightSurgeTimeTo,
          greaterThanKm: greaterThanKm,
          rentalAmount: rentalAmount,
          farePerMin: parseFloat(perminute),
        },
      }).exec();
      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Update Failed!...");
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc get all bookings
  // @router GET /api/admin/bookings
  // @access PRIVATE

  getBookings: asyncHandler(async (req, res) => {
    try {
      let {
        rowCount,
        skip = 0,
        content,
        status_filter,
        vehicleType,
        subType,
        places,
        from,
        to,
      } = req.query;

      if (from == "undefined" || to == "undefined") {
        from = "06/15/2022";
        var t = new Date();
        t.setDate(t.getDate() + 1);
        let to2 = moment(t).format("L");
        to = to2;

        from = new Date(from);
        to = new Date(to);
      } else {
        from = new Date(from);
        to = new Date(to);
      }

      let dateFilter = {
        $match: { createdAt: { $gte: new Date(from), $lte: new Date(to) } },
      };

      var statusFilter;
      var vehTypeFilter;
      var vehSubTypeFilter;
      var placeFilter;
      if (
        !status_filter ||
        status_filter == "undefined" ||
        status_filter === ""
      ) {
        statusFilter = undefined;
      } else {
        statusFilter = status_filter.split(",");
      }

      if (!vehicleType || vehicleType == "undefined" || vehicleType === "") {
        vehTypeFilter = undefined;
      } else {
        // vehTypeFilter = vehicleType.split(",");
        let pattern = /Three Wheeler/i;
        let result = vehicleType.match(pattern);

        vehTypeFilter = vehicleType.split(",");
        if (result) vehTypeFilter.push("Three Wheeler & APE");
      }

      if (!subType || subType == "undefined" || subType === "") {
        vehSubTypeFilter = undefined;
      } else {
        vehSubTypeFilter = subType.split(",");
      }

      if (!places || places == "undefined" || places === "") {
        placeFilter = undefined;
      } else {
        placeFilter = places.split(",");
      }

      if (content === "null") content = "";
      let search = {
        $match: {
          $or: [
            { status: { $regex: content, $options: "i" } },
            { vehicleType: { $regex: content, $options: "i" } },
            {
              subType: {
                $regex: content,
                $options: "i",
              },
            },
            {
              place: {
                $regex: content,
                $options: "i",
              },
            },
            {
              "mainAddress.pickupPoint.location": {
                $regex: content,
                $options: "i",
              },
            },
            {
              bookingId: {
                $regex: content,
                $options: "i",
              },
            },
            {
              "customer.name": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "customer.mobNo": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "mainAddress.dropPoint.location": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "driverDetails.name": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "driverDetails.mobNo": {
                $regex: content,
                $options: "i",
              },
            },
            {
              bookingDate: {
                $regex: content,
                $options: "i",
              },
            },
          ],
        },
      };

      if (
        !statusFilter &&
        !vehTypeFilter &&
        !vehSubTypeFilter &&
        !placeFilter
      ) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            search,
            dateFilter,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (
        statusFilter &&
        vehTypeFilter &&
        vehSubTypeFilter &&
        placeFilter
      ) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { place: { $in: placeFilter } },
                  { status: { $in: statusFilter } },
                  { vehicleType: { $in: vehTypeFilter } },
                  { subType: { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (statusFilter && vehTypeFilter && vehSubTypeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { status: { $in: statusFilter } },
                  { vehicleType: { $in: vehTypeFilter } },
                  { subType: { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (placeFilter && vehTypeFilter && vehSubTypeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { place: { $in: placeFilter } },
                  { vehicleType: { $in: vehTypeFilter } },
                  { subType: { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (placeFilter && statusFilter && vehSubTypeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { place: { $in: placeFilter } },
                  { status: { $in: statusFilter } },

                  { subType: { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (placeFilter && statusFilter && vehTypeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { place: { $in: placeFilter } },
                  { status: { $in: statusFilter } },
                  { vehicleType: { $in: vehTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (statusFilter && vehTypeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { status: { $in: statusFilter } },
                  { vehicleType: { $in: vehTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (vehTypeFilter && vehSubTypeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { vehicleType: { $in: vehTypeFilter } },
                  { subType: { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (vehTypeFilter && placeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { place: { $in: placeFilter } },

                  { vehicleType: { $in: vehTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (vehSubTypeFilter && statusFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { status: { $in: statusFilter } },

                  { subType: { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (placeFilter && statusFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { place: { $in: placeFilter } },
                  { status: { $in: statusFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (vehSubTypeFilter && placeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { place: { $in: placeFilter } },

                  { subType: { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (statusFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                status: { $in: statusFilter },
              },
            },
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (vehTypeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                vehicleType: { $in: vehTypeFilter },
              },
            },
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (vehSubTypeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                subType: { $in: vehSubTypeFilter },
              },
            },
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      } else if (placeFilter) {
        Booking.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                place: { $in: placeFilter },
              },
            },
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, bookings) {
            if (err) console.log(err);

            if (bookings) {
              res.status(200);
              res.json(bookings);
            } else {
              res.status(401);
              throw new Error("Not found bookings");
            }
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc get customer orders
  // @router GET /api/admin/getorders/:customerid
  // @access PRIVATE

  getUserOrders: asyncHandler(async (req, res) => {
    const { id, user } = req.params;
    if (user === "customer") {
      var orders = await Booking.find({ customerId: id })
        .sort({ createdAt: -1 })
        .exec();
    } else if (user === "driver") {
      var orders = await Booking.find({ driverId: id })
        .sort({ createdAt: -1 })
        .exec();
    }
    if (orders) {
      res.status(200);
      res.json(orders);
    } else {
      res.status(400);
      throw new Error("no orders");
    }
  }),

  // @desc get driver reviews
  // @router GET /api/admin/driver-reviews/:driverid
  // @access PRIVATE

  getDriverReviews: asyncHandler(async (req, res) => {
    try {
      const { driverid } = req.params;
      const details = await Driver.findById(driverid).exec();
      if (details) {
        res.status(200);
        res.json(details);
      } else {
        res.status(400);
        throw new Error("not found driver");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  // @desc get all banners
  // @router GET /api/admin/getBanner
  // @access PRIVATE

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

  // @desc add banner for driver
  // @router GET /api/admin/add-banner
  // @access PRIVATE

  addDriverBanner: asyncHandler(async (req, res) => {
    try {
      const data = await uploadImages(
        req.body.bannerImage,
        "driverBanners",
        req.body.ext
      );

      // let { secure_url } = await cloudinary.uploader.upload(bannerImage.image, {
      //   folder: "DRIVER_BANNER",
      // });

      const banner = await BannerDriver.create({
        driverBanner: data.img_url,
        bannerKey: data.img_key,
      });

      if (banner) {
        res.status(200);
        res.json(banner);
      } else {
        res.status(400);
        throw new Error("create banner failed!..");
      }
    } catch (err) {
      console.log(err);
    }
  }),

  updateDriverBanner: asyncHandler(async (req, res) => {
    const { id, bannerImage } = req.body;

    if (bannerImage.length > 120) {
      const newImage = {
        image: bannerImage,
      };

      // let { secure_url } = await cloudinary.uploader.upload(newImage.image, {
      //   folder: "DRIVER_BANNER",
      // });a
      const details = await BannerDriver.findById(id).exec();
      if (details) {
        const deleteImg = await deleteImages(details.bannerKey);
        if (deleteImg) {
          console.log(deleteImg);
        } else {
          const data = await uploadImages(bannerImage, "driverBanners");
          const update = await BannerDriver.findByIdAndUpdate(id, {
            $set: {
              driverBanner: data.img_url,
              bannerKey: data.img_key,
            },
          }).exec();

          if (update) {
            res.status(200);
            res.json({ ok: true });
          }
        }
      }
    } else {
      res.status(200);
    }
  }),

  deleteSubAdmin: asyncHandler(async (req, res) => {
    try {
      await SubAdmin.findByIdAndDelete(req.params.id, function (err, docs) {
        if (err) {
          console.log(err);
        } else {
        }
      });
      res.status(200);
      res.json({ ok: true });
    } catch (err) {
      res.status(400);
      throw new Error(err);
    }
  }),

  deleteDriverBanner: asyncHandler(async (req, res) => {
    try {
      const details = await BannerDriver.findById(req.params.id).exec();
      if (details) {
        const data = await deleteImages(details.bannerKey);
        if (data) {
          console.log(data);
        } else {
          BannerDriver.findByIdAndDelete(req.params.id, function (err, docs) {
            if (err) {
              console.log(err);
            } else {
            }
          });
          res.status(200);
          res.json({ ok: true });
        }
      }
    } catch (err) {
      res.status(400);
      throw new Error(err);
    }
  }),

  // user banner
  getUserBanner: asyncHandler(async (req, res) => {
    const banners = await BannerUser.find().exec();

    if (banners) {
      res.status(200);
      res.json(banners);
    } else {
      res.status(401);
      throw new Error("Not found BANNERS");
    }
  }),

  addUserBanner: asyncHandler(async (req, res) => {
    const data = await uploadImages(
      req.body.bannerImage,
      "userBanners",
      req.body.ext
    );

    // let { secure_url } = await cloudinary.uploader.upload(bannerImage.image, {
    //   folder: "USER_BANNER",
    // });

    const banner = await BannerUser.create({
      userBanner: data.img_url,
      bannerKey: data.img_key,
    });

    if (banner) {
      res.status(200);
      res.json(banner);
    } else {
      res.status(400);
      throw new Error("create banner failed!..");
    }
  }),

  updateUserBanner: asyncHandler(async (req, res) => {
    try {
      const { id, bannerImage } = req.body;

      if (bannerImage.length > 120) {
        const details = await BannerUser.findById(id).exec();
        if (details) {
          const deleteImg = await deleteImages(details.bannerKey);
          if (deleteImg) {
            console.log(deleteImg);
          } else {
            const data = await uploadImages(
              bannerImage,
              "userBanners",
              req.body.ext
            );
            const update = await BannerUser.findByIdAndUpdate(id, {
              $set: {
                userBanner: data.img_url,
                bannerKey: data.img_key,
              },
            }).exec();

            if (update) {
              res.status(200);
              res.json({ ok: true });
            }
          }
        }
      } else {
        res.status(200);
      }
    } catch (err) {
      console.log(err);
    }
  }),

  deleteUserBanner: asyncHandler(async (req, res) => {
    try {
      const details = await BannerUser.findById(req.params.id).exec();
      if (details) {
        const data = await deleteImages(details.bannerKey);
        if (data) {
          console.log(data);
        } else {
          BannerUser.findByIdAndDelete(req.params.id, function (err, docs) {
            if (err) {
              console.log(err);
            } else {
              res.status(200);
              res.json({ ok: true });
            }
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc add booking comment
  // @router PUT /api/admin/booking-add-comment
  // @access PRIVATE

  bookingAddComment: asyncHandler(async (req, res) => {
    const { id, comment } = req.body;

    var currentTime = formatAMPM(new Date());
    var today = todayDate();
    const addComment = Booking.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          csNotes: {
            admin: req.admin.firstName + " " + req.admin.lastName,
            comment: comment,
            dateAndTime: today + " " + currentTime,
          },
        },
      }
    ).exec();
    if (addComment) {
      res.status(200);
      res.json({ ok: true });
    } else {
      res.status(400);
      throw new Error("update failed!..");
    }
  }),

  // @desc add booking unAssign comment
  // @router PUT /api/admin/booking-unassign-comment
  // @access PRIVATE

  bookingUnAssignComment: asyncHandler(async (req, res) => {
    try {
      const { id, comment } = req.body;

      const bookingDetails = await Booking.findOne({ Id: id }).exec();
      if (bookingDetails) {
        // customs bookingId
        const split_Id = bookingDetails.bookingId.split("-");
        let createStatus = false;

        let Id;
        if (split_Id[1] === "1") {
          Id = split_Id[0] + "-2";
          createStatus = true;
        } else if (split_Id[1] === "2") {
          createStatus = false;
        } else {
          Id = split_Id[0] + "-1";
          createStatus = true;
        }
        if (Id !== bookingDetails.bookingId) {
          if (createStatus) {
            // create new orders
            var newOrderDetails = await Booking.create({
              Id: id,
              customerId: bookingDetails.customerId,
              driverId: bookingDetails.driverId,
              bookingId: Id,
              fcmToken: "",
              place: bookingDetails.place,
              userFcmToken: bookingDetails.userFcmToken,
              otp: bookingDetails.otp,
              reassinging: true,
              stops: bookingDetails.stops,
              customer: {
                name: bookingDetails.customer.name,
                mobNo: bookingDetails.customer.mobNo,
              },
              mainAddress: {
                pickupPoint: {
                  location: bookingDetails.mainAddress.pickupPoint.location,
                  lan: bookingDetails.mainAddress.pickupPoint.lan,
                  lat: bookingDetails.mainAddress.pickupPoint.lat,
                  name: bookingDetails.mainAddress.pickupPoint.name,
                  phoneNumber:
                    bookingDetails.mainAddress.pickupPoint.phoneNumber,
                },
                dropPoint: {
                  location: bookingDetails.mainAddress.dropPoint.location,
                  lan: bookingDetails.mainAddress.dropPoint.lan,
                  lat: bookingDetails.mainAddress.dropPoint.lat,
                  name: bookingDetails.mainAddress.dropPoint.name,
                  phoneNumber: bookingDetails.mainAddress.dropPoint.phoneNumber,
                },
              },
              address2: {
                location: bookingDetails.address2.location,
                lan: bookingDetails.address2.lan,
                lat: bookingDetails.address2.lat,
                name: bookingDetails.address2.name,
                phoneNumber: bookingDetails.address2.phoneNumber,
              },
              address3: {
                location: bookingDetails.address3.location,
                lan: bookingDetails.address3.lan,
                lat: bookingDetails.address3.lan,
                name: bookingDetails.address3.name,
                phoneNumber: bookingDetails.address3.phoneNumber,
              },
              paymentDetails: {
                amount: bookingDetails.paymentDetails.amount,
                paymentType: bookingDetails.paymentDetails.paymentType,
                extraCharge: bookingDetails.paymentDetails.extraCharge,
                nightSurge: bookingDetails.paymentDetails.nightSurge,
                oldAmount: bookingDetails.paymentDetails.oldAmount,
              },
              promoCodeDetails: bookingDetails.promoCodeDetailsSchema,
              vehicleType: bookingDetails.vehicleType,
              subType: bookingDetails.subType,
              driverDetails: {
                name: "--not accepted--",
                mobNo: "",
              },
              comment: bookingDetails.comment,
              amountAfterCommision: bookingDetails.amountAfterCommision,
              commisionAmount: bookingDetails.commisionAmount,
              bookingDate: bookingDetails.bookingDate,
              unAssignCancel: bookingDetails.unAssignCancel,
              appliedCoupon: bookingDetails.appliedCoupon,
              rent: bookingDetails.rent,
              rated: bookingDetails.rated,
            });

            bookingDetails.status = "Cancel";
            bookingDetails.Id = bookingDetails.Id + "1";
            bookingDetails.actualOrder = false;
            bookingDetails.csNotes.push({
              admin: req.admin.firstName + " " + req.admin.lastName,
              dateAndTime: todayDate() + " " + formatAMPM(new Date()),
              comment: "unAssign :)" + comment,
            });

            await Driver.findByIdAndUpdate(bookingDetails.driverId, {
              onOrder: false,
            }).exec();
            if (bookingDetails.oldDrivers.length === 0) {
              newOrderDetails.oldDrivers.push(bookingDetails.driverId);
            } else {
              newOrderDetails.oldDrivers.push(
                bookingDetails.driverId,
                bookingDetails.oldDrivers[0]
              );
            }

            if (bookingDetails.fcmToken) {
              newOrderDetails.oldDriversFcm.push(bookingDetails.fcmToken);
            }

            if (bookingDetails.oldDriversFcm.length === 1) {
              newOrderDetails.oldDriversFcm.push(
                bookingDetails.oldDriversFcm[0]
              );
            }
            if (bookingDetails.oldDriversFcm.length === 2) {
              newOrderDetails.oldDriversFcm.push(
                bookingDetails.oldDriversFcm[1]
              );
            }

            await newOrderDetails.save();
          } else {
            bookingDetails.status = "Cancel";

            bookingDetails.csNotes.push({
              admin: req.admin.firstName + " " + req.admin.lastName,
              dateAndTime: todayDate() + " " + formatAMPM(new Date()),
              comment: "unAssign :)" + comment,
            });
          }

          await bookingDetails.save();
          if (newOrderDetails) {
            res.status(200);
            res.json(newOrderDetails);
          } else {
            res.status(200);

            res.json({ status: "Cancel", Id: bookingDetails.Id });
          }
        } else {
          console.log("ID not changed uniqe requered");
          res.status(400);
        }
      } else {
        res.status(400);
        throw new Error("Not found bookings");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  // @desc add booking cancel comment
  // @router PUT /api/admin/booking-cancel-comment
  // @access PRIVATE

  bookingCancelComment: asyncHandler(async (req, res) => {
    const { id, comment } = req.body;
    var currentTime = formatAMPM(new Date());
    var today = todayDate();
    const update = await Booking.findByIdAndUpdate(id, {
      status: "Cancel",
      $push: {
        csNotes: {
          admin: req.admin.firstName + " " + req.admin.lastName,
          dateAndTime: today + " " + currentTime,
          comment: "cancel ): " + comment,
        },
      },
    }).exec();
    if (update) {
      res.status(200);
      res.json({ ok: true });
    } else {
      res.status(400);
      throw new Error(" Failed...");
    }
  }),

  // @desc Admin get all sub-admin list
  // @router GET /api/admin/list-subadmins
  // @access PRIVATE

  subAdminsList: asyncHandler(async (req, res) => {
    const subadmins = await SubAdmin.find().exec();
    if (subadmins) {
      res.status(200);
      res.json(subadmins);
    } else {
      res.status(401);
      throw new Error("Not found driver banner ");
    }
  }),
  // @desc Admin get all driver list for download
  // @router GET /api/admin//download-all-drivers
  // @access public
  downloadAllDrivers: asyncHandler(async (req, res) => {
    Driver.aggregate([{ $sort: { createdAt: -1 } }], function (err, drivers) {
      if (err) console.log(err);
      if (drivers) {
        res.status(200);

        res.json(drivers);
      } else {
        res.status(401);
        throw new Error("Not found drivers");
      }
    });
  }),
  // @desc Admin get all users list for download
  // @router GET /api/admin//download-all-users
  // @access public
  downloadAllCustomers: asyncHandler(async (req, res) => {
    Customers.aggregate([{ $sort: { createdAt: -1 } }], function (err, users) {
      if (err) console.log(err);
      if (users) {
        res.status(200);

        res.json(users);
      } else {
        res.status(401);
        throw new Error("Not found users");
      }
    });
  }),
  // @desc Admin get all bookings list for download
  // @router GET /api/admin//download-all-bookings
  // @access public
  downloadAllBookings: asyncHandler(async (req, res) => {
    Booking.aggregate(
      [{ $sort: { createdAt: -1 } }],
      function (err, bookings) {
        if (err) console.log(err);
        if (bookings) {
          res.status(200);

          res.json(bookings);
        } else {
          res.status(401);
          throw new Error("Not found bookings");
        }
      }
    );
  }),
  // @desc Admin get all driver list for notification
  // @router GET /api/admin/list-drivers-for-notification
  // @access public
  getDriversForNotification: asyncHandler(async (req, res) => {
    try {
      Driver.aggregate([{ $sort: { createdAt: -1 } }], function (err, drivers) {
        if (err) console.log(err);
        if (drivers) {
          res.status(200);

          res.json(drivers);
        } else {
          res.status(401);
          throw new Error("Not found drivers");
        }
      });
    } catch (err) {
      console.log(err);
    }
  }),
  // @desc Admin get all driver list
  // @router GET /api/admin/list-drivers
  // @access public

  getDriverList: asyncHandler(async (req, res) => {
    try {
      console.log(req.query);
      let {
        rowCount,
        skip = 0,
        content,
        status_filter,
        vehicleType,
        subType,
        places,
        from,
        to,
      } = req.query;

      var t = new Date(to);
      t.setDate(t.getDate() + 1);
      let to2 = moment(t).format("L");
      to = to2;
      from = new Date(from);
      to = new Date(to);

      var statusFilter;
      var vehTypeFilter;
      var vehSubTypeFilter;
      var placeFilter;
      if (
        !status_filter ||
        status_filter == "undefined" ||
        status_filter === ""
      ) {
        statusFilter = undefined;
      } else {
        statusFilter = status_filter.split(",");
      }

      if (!vehicleType || vehicleType == "undefined" || vehicleType === "") {
        vehTypeFilter = undefined;
      } else {
        let pattern = /Three Wheeler/i;
        let result = vehicleType.match(pattern);

        vehTypeFilter = vehicleType.split(",");
        if (result) vehTypeFilter.push("Three Wheeler & APE");
      }

      if (!subType || subType == "undefined" || subType === "") {
        vehSubTypeFilter = undefined;
      } else {
        vehSubTypeFilter = subType.split(",");
      }

      if (!places || places == "undefined" || places === "") {
        placeFilter = undefined;
      } else {
        placeFilter = places.split(",");
      }

      if (content === "null") content = "";

      let dateFilter = {
        $match: { createdAt: { $gte: new Date(from), $lte: new Date(to) } },
      };

      let search = {
        $match: {
          $or: [
            { status: { $regex: content, $options: "i" } },
            { driverId: { $regex: content, $options: "i" } },
            {
              "personalDetails.firstName": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "personalDetails.lastName": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "personalDetails.defaultPhoneNumber": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "personalDetails.alternativeNumber": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "personalDetails.emergencyNumber": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "personalDetails.addCity": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "personalDetails.addLocality": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "personalDetails.adharNumber": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "vehicleDetails.vehicleType": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "vehicleDetails.subType": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "vehicleDetails.vehicleNumber": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "vehicleDetails.insuranceNumber": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "vehicleDetails.insuranceExpiryDate": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "vehicleDetails.drivingLicenseNo": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "bankDetails.accountNumber": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "bankDetails.bankName": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "bankDetails.ifscCode": {
                $regex: content,
                $options: "i",
              },
            },
            {
              "bankDetails.panCardNumber": {
                $regex: content,
                $options: "i",
              },
            },
          ],
        },
      };

      if (
        !statusFilter &&
        !vehTypeFilter &&
        !vehSubTypeFilter &&
        !placeFilter
      ) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            search,
            dateFilter,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (
        statusFilter &&
        vehTypeFilter &&
        vehSubTypeFilter &&
        placeFilter
      ) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { "personalDetails.addCity": { $in: placeFilter } },
                  { status: { $in: statusFilter } },
                  { "vehicleDetails.vehicleType": { $in: vehTypeFilter } },
                  { "vehicleDetails.subType": { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (statusFilter && vehTypeFilter && vehSubTypeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { status: { $in: statusFilter } },
                  { "vehicleDetails.vehicleType": { $in: vehTypeFilter } },
                  { "vehicleDetails.subType": { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (placeFilter && vehTypeFilter && vehSubTypeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { "personalDetails.addCity": { $in: placeFilter } },
                  { "vehicleDetails.vehicleType": { $in: vehTypeFilter } },
                  { "vehicleDetails.subType": { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (placeFilter && statusFilter && vehSubTypeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { "personalDetails.addCity": { $in: placeFilter } },
                  { status: { $in: statusFilter } },
                  { "vehicleDetails.subType": { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (placeFilter && statusFilter && vehTypeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { "personalDetails.addCity": { $in: placeFilter } },
                  { status: { $in: statusFilter } },
                  { "vehicleDetails.vehicleType": { $in: vehTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (statusFilter && vehTypeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { status: { $in: statusFilter } },
                  { "vehicleDetails.vehicleType": { $in: vehTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (vehTypeFilter && vehSubTypeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { "vehicleDetails.vehicleType": { $in: vehTypeFilter } },
                  { "vehicleDetails.subType": { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (vehTypeFilter && placeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { "vehicleDetails.vehicleType": { $in: vehTypeFilter } },
                  { "personalDetails.addCity": { $in: placeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (vehSubTypeFilter && statusFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { status: { $in: statusFilter } },
                  { "vehicleDetails.subType": { $in: vehSubTypeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (placeFilter && statusFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { status: { $in: statusFilter } },
                  { "personalDetails.addCity": { $in: placeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (vehSubTypeFilter && placeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                $and: [
                  { "vehicleDetails.subType": { $in: vehSubTypeFilter } },
                  { "personalDetails.addCity": { $in: placeFilter } },
                ],
              },
            },
            search,
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (statusFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                status: { $in: statusFilter },
              },
            },
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (vehTypeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                "vehicleDetails.vehicleType": { $in: vehTypeFilter },
              },
            },
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (vehSubTypeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                "vehicleDetails.subType": { $in: vehSubTypeFilter },
              },
            },
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      } else if (placeFilter) {
        Driver.aggregate(
          [
            { $sort: { createdAt: -1 } },
            dateFilter,
            {
              $match: {
                "personalDetails.addCity": { $in: placeFilter },
              },
            },
            { $skip: +skip },
            { $limit: +rowCount },
          ],
          function (err, drivers) {
            if (err) console.log(err);

            if (drivers) {
              res.status(200);
              res.json(drivers);
            } else {
              res.status(401);
              throw new Error("Not found drivers");
            }
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc Admin approve driver
  // @router PUT /api/admin/approve-driver
  // @access PRIVATE

  approveDriver: asyncHandler(async (req, res) => {
    try {
      const { id } = req.body;
      const driverDetails = await Driver.findById(id).exec();
      if (driverDetails) {
        driverDetails.isApproved = true;
        driverDetails.status = "Active";
        driverDetails.isRejectBasicDetails = false;
        driverDetails.isRejectAadharDetails = false;
        driverDetails.isRejectBankDetails = false;
        driverDetails.isRejectPancardDetails = false;
        driverDetails.isRejectVehicleDetails = false;
        driverDetails.isRejectInsuranceDetails = false;
        driverDetails.isRejectLicenceDetails = false;
        driverDetails.isRejectRcDetails = false;
        await driverDetails.save();
        approvalNotification(driverDetails.fcmToken);
        let token = generateToken(driverDetails._id);
        res.json({ ok: true, driverId: driverDetails._id, token });
      } else {
        res.status(400);
        throw new Error("not found driver in approveDriver");
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc Admin driver details
  // @router GET /api/admin/driver-details/:id
  // @access PRIVATE

  getDriverDetails: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const driver = await Driver.findById(id).exec();
    if (driver) {
      if (driver.vehicleDetails && driver.vehicleDetails.insuranceExpiryDate) {
        driver.vehicleDetails.insuranceExpiryDate = moment(
          driver.vehicleDetails.insuranceExpiryDate
        ).format("L");
      }

      res.status(200);
      res.json(driver);
    } else {
      res.status(401);
    }
  }),

  // @desc add wallet to driver
  // @router PUT /api/admin/add-driver-wallet
  // @access PRIVATE

  addDriverWallet: asyncHandler(async (req, res) => {
    const { driverId, wallet, comment } = req.body;

    let type = wallet < 0 ? "Debited" : "Recharged";
    var currentTime = formatAMPM(new Date());
    var today = todayDate();
    // const getDriver = await Driver.findOne({
    //   _id: driverId,
    // }).exec();

    // check wallet
    // if (parseInt(wallet) < 0) {
    //   if (getDriver.wallet <= 0) {
    //     res.status(400);
    //     throw new Error('Reached Minimum. Not allow to dedect!..');
    //   } else {
    //     var checkWallet = getDriver.wallet + parseInt(wallet);
    //     if (checkWallet < 0) {
    //       res.status(400);
    //       throw new Error(
    //         'This Amount not allow to dedect. Try Another Amount!...'
    //       );
    //     } else {
    //       const update = await Driver.findOneAndUpdate(
    //         { _id: driverId },
    //         {
    //           $inc: {
    //             wallet: wallet,
    //           },
    //         },
    //         { new: true }
    //       ).exec();
    //       if (update) {
    //         const driver = await Driver.findById(driverId).exec();
    //         // setup walletlogs id with database HelperCollection

    //         // is exist customer
    //         const isExist = await HelperCollection.findOne({
    //           walletlogsid: driver._id,
    //         }).exec();
    //         if (isExist) {
    //           var walletlogID = isExist.count + 1;
    //           const updateHelperCollection =
    //             await HelperCollection.findOneAndUpdate(
    //               { walletlogsid: isExist.walletlogsid },
    //               {
    //                 $inc: {
    //                   count: 1,
    //                 },
    //               }
    //             ).exec();
    //         } else {
    //           const createCount = await HelperCollection.create({
    //             walletlogsid: driver._id,
    //             count: 1,
    //           });
    //           var walletlogID = 1;
    //         }

    //         // res.json({ isExist: isExist, id: customer._id });
    //         const addComment = await Driver.findByIdAndUpdate(driverId, {
    //           $push: {
    //             walletlogs: {
    //               walletlogid: walletlogID,
    //               transactionBy: req.admin.firstName + ' ' + req.admin.lastName,
    //               holder: driver.firstName + ' ' + driver.lastName,
    //               amount: wallet,
    //               comment: comment,
    //               transactionType: type,
    //               dateAndTime: today + ' ' + currentTime,
    //             },
    //           },
    //         });

    //         if (addComment) {
    //           res.status(200);
    //           res.json({
    //             ok: true,
    //             driverWallet: true,
    //             wallet: addComment.wallet,
    //             id: addComment._id,
    //           });
    //         } else {
    //           res.status(400);
    //           throw new Error('Add Wallet Failed. Try again later!..');
    //         }
    //       }
    //     }
    //   }
    // } else {
    const update = await Driver.findOneAndUpdate(
      { _id: driverId },
      {
        $inc: {
          wallet: wallet,
        },
      },
      { new: true }
    ).exec();
    if (update) {
      const driver = await Driver.findById(driverId).exec();
      // setup walletlogs id with database HelperCollection

      // is exist customer
      const isExist = await HelperCollection.findOne({
        walletlogsid: driver._id,
      }).exec();
      if (isExist) {
        var walletlogID = isExist.count + 1;
        const updateHelperCollection = await HelperCollection.findOneAndUpdate(
          { walletlogsid: isExist.walletlogsid },
          {
            $inc: {
              count: 1,
            },
          }
        ).exec();
      } else {
        const createCount = await HelperCollection.create({
          walletlogsid: driver._id,
          count: 1,
        });
        var walletlogID = 1;
      }

      // res.json({ isExist: isExist, id: customer._id });
      const addComment = await Driver.findByIdAndUpdate(driverId, {
        $push: {
          walletlogs: {
            walletlogid: walletlogID,
            transactionBy: req.admin.firstName + " " + req.admin.lastName,
            holder: driver.firstName + " " + driver.lastName,
            amount: wallet,
            comment: comment,
            transactionType: type,
            dateAndTime: today + " " + currentTime,
          },
        },
      });
      if (addComment) {
        res.status(200);
        res.json({
          driverWallet: true,
          ok: true,
          wallet: parseInt(addComment.wallet),
          id: addComment._id,
        });
      } else {
        res.status(400);
        throw new Error("Add Wallet Failed. Try again later!..");
      }
    }
    //}
  }),

  // @desc add comment to driver
  // @router PUT /api/admin/add-driver-comment
  // @access PRIVATE

  addDriverComment: asyncHandler(async (req, res) => {
    const { driverId, comment, creater } = req.body;

    var currentTime = formatAMPM(new Date());
    // get Current Date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
    // find admin
    const getAdmin = await Admin.findById(req.admin._id).exec();
    if (getAdmin) {
      // update customer document
      const update = await Driver.findByIdAndUpdate(driverId, {
        $push: {
          csnotes: {
            admin: creater, // getAdmin.firstName + " " + getAdmin.lastName,
            comment: comment,
            dateAndTime: today + " " + currentTime,
          },
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("admin Comment Failed!...");
      }
    }
  }),

  // @desc edit driver pan details
  // @router PUT /api/admin/edit-driver-pan-details
  // @access PRIVATE

  updateDriverPanDetails: asyncHandler(async (req, res) => {
    let { driverId, panimg, panImg_id, panNo } = req.body;

    if (panimg) {
      cloudinary.uploader.destroy(panImg_id, function (result) {});
      let PanImg = await cloudinary.uploader.upload(panimg, {
        folder: "LDR_DRIVER_PROFILE_IMG",
      });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "bankDetails.panCardImg": PanImg.secure_url,
          "bankDetails.panCardImg_id": PanImg.public_id,
          "bankDetails.panCardNumber": panNo,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver Pan Details Update Failed!...");
      }
    } else {
      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "bankDetails.panCardNumber": panNo,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver Pan Details Update Failed!...");
      }
    }
  }),
  // @desc edit driver License details
  // @router PUT /api/admin/edit-driver-license-details
  // @access PRIVATE

  updateInsuranceDetails: asyncHandler(async (req, res) => {
    let {
      driverId,
      insuranceImg,
      insuranceImg_id,
      InsuranceExpiryDate,
      insuranceNo,
    } = req.body;

    expirydate = moment(new Date(InsuranceExpiryDate)).format("L");

    if (insuranceImg) {
      cloudinary.uploader.destroy(insuranceImg_id, function (result) {});
      let insuraceImg = await cloudinary.uploader.upload(insuranceImg, {
        folder: "VEHICLE_INSURENCE_IMG",
      });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "vehicleDetails.insuranceImg": insuraceImg.secure_url,
          "vehicleDetails.insuranceImg_id": insuraceImg.public_id,
          "vehicleDetails.insuranceExpiryDate": expirydate,
          "vehicleDetails.insuranceNumber": insuranceNo,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver Insurance Details Update Failed!...");
      }
    } else {
      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "vehicleDetails.insuranceExpiryDate": expirydate,
          "vehicleDetails.insuranceNumber": insuranceNo,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver Insurance Details Update Failed!...");
      }
    }
  }),
  // @desc edit driver license details
  // @router PUT /api/admin/edit-driver-license-details
  // @access PRIVATE
  updateDriverLicenseDetails: asyncHandler(async (req, res) => {
    let { driverId, licenseImg, licenseImg_id, licenseNo } = req.body;

    if (licenseImg) {
      cloudinary.uploader.destroy(licenseImg_id, function (result) {});
      let lcImg = await cloudinary.uploader.upload(licenseImg, {
        folder: "DRIVING_LICENCE_IMG",
      });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "vehicleDetails.drivingLicenseImg": lcImg.secure_url,
          "vehicleDetails.drivingLicenseImg_id": lcImg.public_id,
          "vehicleDetails.drivingLicenseNo": licenseNo,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver License Details Update Failed!...");
      }
    } else {
      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "vehicleDetails.drivingLicenseNo": licenseNo,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver License Details Update Failed!...");
      }
    }
  }),
  // @desc edit driver personal details
  // @router PUT /api/admin/edit-driver-personal-details
  // @access PRIVATE

  updateDriverPersonalDetails: asyncHandler(async (req, res) => {
    let {
      driverId,
      firstName,
      lastName,
      ProImg,
      profileImg_id,
      defaultPhoneNumber,
      alternativeNumber,
      emargenceynumber,
      city,
      locality,
      vehicleNo,
      vehicleType,
      vehicleSubType,
    } = req.body;

    if (ProImg) {
      const deleteImg = await deleteImages(profileImg_id);
      if (deleteImg) {
        console.log(deleteImg);
      } else {
        const data = await uploadImages(
          ProImg,
          "drivers/profile_imgs",
          req.body.ext
        );
        const update = await Driver.findByIdAndUpdate(driverId, {
          $set: {
            "personalDetails.profileImg": data.img_url,
            "personalDetails.profileImg_id": data.img_key,
            "personalDetails.firstName": firstName,
            "personalDetails.lastName": lastName,
            "personalDetails.defaultPhoneNumber": defaultPhoneNumber,
            "personalDetails.alternativeNumber": alternativeNumber,
            "personalDetails.emergencyNumber": emargenceynumber,
            "personalDetails.addCity": city,
            "personalDetails.addLocality": locality,
            "vehicleDetails.vehicleNumber": vehicleNo,
            "vehicleDetails.vehicleType": vehicleType,
            "vehicleDetails.subType": vehicleSubType,
          },
        }).exec();

        if (update) {
          res.status(200);
          res.json({ ok: true });
        } else {
          res.status(400);
          throw new Error("Driver Personal Details Update Failed!...");
        }
      }
      // cloudinary.uploader.destroy(profileImg_id, function (result) {

      // });
      // let driverImg = await cloudinary.uploader.upload(ProImg, {
      //   folder: "LDR_DRIVER_PROFILE_IMG",
      // });
    } else {
      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "personalDetails.firstName": firstName,
          "personalDetails.lastName": lastName,
          "personalDetails.defaultPhoneNumber": defaultPhoneNumber,
          "personalDetails.alternativeNumber": alternativeNumber,
          "personalDetails.emergencyNumber": emargenceynumber,
          "personalDetails.addCity": city,
          "personalDetails.addLocality": locality,
          "vehicleDetails.vehicleNumber": vehicleNo,
          "vehicleDetails.vehicleType": vehicleType,
          "vehicleDetails.subType": vehicleSubType,
        },
      }).exec();
      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver Personal Details Update Failed!...");
      }
    }
  }),

  // @desc edit driver vehicle details
  // @router PUT /api/admin/edit-driver-vehicle-details
  // @access PRIVATE

  updateDriverVehicleDetails: asyncHandler(async (req, res) => {
    let {
      driverId,
      vehicleF,
      vehicleB,
      vehicleBackImg_id,
      vehicleFrontImg_id,
      vehicleNo,
    } = req.body;

    if (vehicleF && vehicleB) {
      const deleteImg1 = await deleteImages(vehicleFrontImg_id);
      if (deleteImg1) {
        console.log(deleteImg1);
      } else {
        var data1 = await uploadImages(
          vehicleF,
          "drivers/vehicle_imgs",
          req.body.ext
        );
      }
      // cloudinary.uploader.destroy(vehicleFrontImg_id, function (result) {

      // });
      // let VFront = await cloudinary.uploader.upload(vehicleF, {
      //   folder: "VEHICLE_IMAGES_IMG",
      // });

      const deleteImg2 = await deleteImages(vehicleBackImg_id);
      if (deleteImg2) {
        console.log(deleteImg2);
      } else {
        var data2 = await uploadImages(
          vehicleB,
          "drivers/vehicle_imgs",
          req.body.ext1
        );
      }
      // cloudinary.uploader.destroy(vehicleBackImg_id, function (result) {

      // });
      // let VBack = await cloudinary.uploader.upload(vehicleB, {
      //   folder: "VEHICLE_IMAGES_IMG",
      // });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "vehicleDetails.vehicleNumber": vehicleNo,
          "vehicleDetails.vehicleFrontImg": data1.img_url,
          "vehicleDetails.vehicleFrontImg_id": data1.img_key,
          "vehicleDetails.vehicleBackImg": data2.img_url,
          "vehicleDetails.vehicleBackImg_id": data2.img_key,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver vehicle Details Update Failed!...");
      }
    } else if (vehicleF) {
      const deleteImg = await deleteImages(vehicleFrontImg_id);
      if (deleteImg) {
        console.log(deleteImg);
      } else {
        var data = await uploadImages(
          vehicleF,
          "drivers/vehicle_imgs",
          req.body.ext
        );
      }
      // cloudinary.uploader.destroy(vehicleFrontImg_id, function (result) {

      // });
      // let VFront = await cloudinary.uploader.upload(vehicleF, {
      //   folder: "VEHICLE_IMAGES_IMG",
      // });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "vehicleDetails.vehicleNumber": vehicleNo,
          "vehicleDetails.vehicleFrontImg": data.img_url,
          "vehicleDetails.vehicleFrontImg_id": data.img_key,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver vehicle Details Update Failed!...");
      }
    } else if (vehicleB) {
      const deleteimg = await deleteImages(vehicleBackImg_id);
      if (deleteimg) {
        console.log(deleteimg);
      } else {
        var data = await uploadImages(
          vehicleB,
          "drivers/vehicle_imgs",
          req.body.ext
        );
      }
      // cloudinary.uploader.destroy(vehicleBackImg_id, function (result) {

      // });
      // let VBack = await cloudinary.uploader.upload(vehicleB, {
      //   folder: "DRIVER_ADHAR_IMG",
      // });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "vehicleDetails.vehicleNumber": vehicleNo,
          "vehicleDetails.vehicleBackImg": data.img_url,
          "vehicleDetails.vehicleBackImg_id": data.img_key,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver vehicle Details Update Failed!...");
      }
    } else {
      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "vehicleDetails.vehicleNumber": vehicleNo,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver vehicle Details Update Failed!...");
      }
    }
  }),
  // @desc edit driver aadhaar details
  // @router PUT /api/admin/edit-driver-aadhaar-details
  // @access PRIVATE

  updateDriverAadhaarDetails: asyncHandler(async (req, res) => {
    let {
      driverId,
      aadhaarF,
      aadhaarB,
      aadhaarFrontImg_id,
      aadhaarBackImg_id,
      aadhaarNo,
    } = req.body;

    if (aadhaarF && aadhaarB) {
      const deleteImg1 = await deleteImages(aadhaarFrontImg_id);
      if (deleteImg1) {
        console.log(deleteImg1);
      } else {
        var data1 = await uploadImages(
          aadhaarF,
          "drivers/adhar_imgs",
          req.body.ext
        );
      }
      // cloudinary.uploader.destroy(aadhaarFrontImg_id, function (result) {

      // });
      // let aadhaarFront = await cloudinary.uploader.upload(aadhaarF, {
      //   folder: "DRIVER_ADHAR_IMG",
      // });
      const deleteImg2 = await deleteImages(aadhaarBackImg_id);
      if (deleteImg2) {
        console.log(deleteImg2);
      } else {
        var data2 = await uploadImages(
          aadhaarB,
          "drivers/adhar_imgs",
          req.body.ext1
        );
      }
      // cloudinary.uploader.destroy(aadhaarBackImg_id, function (result) {

      // });
      // let aadhaarBack = await cloudinary.uploader.upload(aadhaarB, {
      //   folder: "DRIVER_ADHAR_IMG",
      // });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "personalDetails.adharNumber": aadhaarNo,
          "personalDetails.adharFrontImg": data1.img_url,
          "personalDetails.adharFrontImg_id": data1.img_key,
          "personalDetails.adharBackImg": data2.img_url,
          "personalDetails.adharBackImg_id": data2.img_key,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver aadhaar Details Update Failed!...");
      }
    } else if (aadhaarF) {
      const deleteImg = await deleteImages(aadhaarFrontImg_id);
      if (deleteImg) {
        console.log(deleteImg);
      } else {
        var data = await uploadImages(
          aadhaarF,
          "drivers/adhar_imgs",
          req.body.ext
        );
      }
      // cloudinary.uploader.destroy(aadhaarFrontImg_id, function (result) {

      // });
      // let aadhaarFront = await cloudinary.uploader.upload(aadhaarF, {
      //   folder: "DRIVER_ADHAR_IMG",
      // });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "personalDetails.adharNumber": aadhaarNo,
          "personalDetails.adharFrontImg": data.img_url,
          "personalDetails.adharFrontImg_id": data.img_key,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver aadhaar Details Update Failed!...");
      }
    } else if (aadhaarB) {
      const deleteImage = await deleteImages(aadhaarBackImg_id);
      if (deleteImage) {
        console.log(deleteImage);
      } else {
        var data = await uploadImages(
          aadhaarB,
          "drivers/adhar_imgs",
          req.body.ext
        );
      }
      // cloudinary.uploader.destroy(aadhaarBackImg_id, function (result) {

      // });
      // let aadhaarBack = await cloudinary.uploader.upload(aadhaarB, {
      //   folder: "DRIVER_ADHAR_IMG",
      // });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "personalDetails.adharNumber": aadhaarNo,
          "personalDetails.adharBackImg": data.img_url,
          "personalDetails.adharBackImg_id": data.img_key,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver aadhaar Details Update Failed!...");
      }
    } else {
      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "personalDetails.adharNumber": aadhaarNo,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver aadhaar Details Update Failed!...");
      }
    }
  }),

  // @desc edit driver Rc details (only image)
  // @router PUT /api/admin/edit-driver-rc-details
  // @access PRIVATE

  updateDriverRcDetails: asyncHandler(async (req, res) => {
    let { driverId, rc, rcImg_id } = req.body;

    const deleteImg = await deleteImages(rcImg_id);
    if (deleteImg) {
      console.log(deleteImg);
    } else {
      var data = await uploadImages(
        rc,
        "drivers/vehicle_rcbook_imgs",
        req.body.ext
      );
    }
    // cloudinary.uploader.destroy(rcImg_id, function (result) {

    // });

    // let rcImg = await cloudinary.uploader.upload(rc, {
    //   folder: "VEHICLE_RCBOOK_IMAGE_IMG",
    // });

    const update = await Driver.findByIdAndUpdate(driverId, {
      $set: {
        "vehicleDetails.rcBookImg_id": data.img_key,
        "vehicleDetails.rcBookImg": data.img_url,
      },
    }).exec();

    if (update) {
      res.status(200);
      res.json({ ok: true });
    } else {
      res.status(400);
      throw new Error("Driver Vaccine img Update Failed!...");
    }
  }),
  // @desc edit driver vaccine details (only image)
  // @router PUT /api/admin/edit-driver-Vaccine-details
  // @access PRIVATE

  updateDriverVaccineDetails: asyncHandler(async (req, res) => {
    let { driverId, vaccinenew, vaccineImg_id } = req.body;

    cloudinary.uploader.destroy(vaccineImg_id, function (result) {});

    let vaccineImg = await cloudinary.uploader.upload(vaccinenew, {
      folder: "VACCINE_CERTIFICATE_IMG",
    });

    const update = await Driver.findByIdAndUpdate(driverId, {
      $set: {
        "personalDetails.vaccineImg_id": vaccineImg.public_id,
        "personalDetails.vaccineImg": vaccineImg.secure_url,
      },
    }).exec();

    if (update) {
      res.status(200);
      res.json({ ok: true });
    } else {
      res.status(400);
      throw new Error("Driver Vaccine img Update Failed!...");
    }
  }),

  // @desc edit driver vaccine details (only image)
  // @router PUT /api/admin/edit-driver-Vaccine-details
  // @access PRIVATE

  updateDriverBankDetails: asyncHandler(async (req, res) => {
    let {
      driverId,
      newPassBkImg,
      passbookImg_id,
      bankAcNo,
      bankName,
      bankIfsc,
    } = req.body;

    if (newPassBkImg) {
      const deleteImg = await deleteImages(passbookImg_id);
      if (deleteImg) {
        console.log(deleteImg);
      } else {
        var data = await uploadImages(
          newPassBkImg,
          "drivers/bank_statement_imgs",
          req.body.ext
        );
      }
      // cloudinary.uploader.destroy(passbookImg_id, function (result) {

      // });
      // let passbookImg = await cloudinary.uploader.upload(newPassBkImg, {
      //   folder: "BANK_STATE_MENTS_IMG",
      // });

      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "bankDetails.accountNumber": bankAcNo,
          "bankDetails.bankName": bankName,
          "bankDetails.ifscCode": bankIfsc,
          "bankDetails.passbookStatementImg_id": data.img_key,
          "bankDetails.passbookStatementImg": data.img_url,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("Driver Vaccine img Update Failed!...");
      }
    } else {
      const update = await Driver.findByIdAndUpdate(driverId, {
        $set: {
          "bankDetails.accountNumber": bankAcNo,
          "bankDetails.bankName": bankName,
          "bankDetails.ifscCode": bankIfsc,
        },
      }).exec();

      if (update) {
        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);

        throw new Error("Driver Vaccine img Update Failed!...");
      }
    }
  }),
  // @desc generate Promo Code
  // @router GET /api/admin/generate-promocode
  // @access PRIVATE

  generatePromocode: asyncHandler(async (req, res) => {
    const uniquieCode = uuidv4();
    const shorternCode = uniquieCode.split("-");
    const code = shorternCode[shorternCode.length - 1];
    const promocode = code.toUpperCase();
    res.status(200);
    res.json(promocode);
  }),

  // @desc create promocode
  // @router POST /api/admin/create-promocode
  // @access PRIVATE

  createPromocode: asyncHandler(async (req, res) => {
    try {
      const {
        category,
        code,
        couponValue,
        couponType,
        expireDate,
        minPrice,
        maxDiscount,
        maxRides,
        users,
      } = req.body;

      const expireDate1 = moment(expireDate).format("DD-MM-YYYY hh:mm:ss A");

      const offer = await PromoCode.findOne({ promocode: code }).exec();
      const createdDate = todayDate() + " " + formatAMPM(new Date());
      if (!offer) {
        let isID;
        let isPhoneNumer;
        if (users) {
          let user = await Customers.findOne({ cutomerID: users }).exec();
          if (user) {
            isID = users;
          } else {
            let user = await Customers.findOne({ phoneNumber: users }).exec();
            if (user) {
              isPhoneNumer = users;
            } else {
              res.status(400);
              throw new Error("not found user");
            }
          }
        }

        const proCode = await PromoCode.create({
          promocode: code,
          createdDate: createdDate,
          couponValue: couponValue,
          couponType: couponType,
          minPrice: minPrice,
          maxDiscount: maxDiscount,
          category: category,
          maxRides: maxRides,
          users: {
            id: isID,
            phoneNumber: isPhoneNumer,
          },
          expireDate: expireDate1,
          date: expireDate,
        });
        if (proCode) {
          res.status(200);
          res.json({
            ok: true,
          });
        } else {
          res.status(400);
          throw new Error("Create Promocode failed!..");
        }
      } else {
        res.status(400);
        throw new Error("Wrong Promocode!..");
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc get all promocode details
  // @router GET /api/admin/get-all-promocodes
  // @access PRIVATE

  getAllPromocodes: asyncHandler(async (req, res) => {
    const promocodes = await PromoCode.find().sort({ createdAt: -1 }).exec();
    if (promocodes) {
      res.status(200);
      res.json(promocodes);
    } else {
      res.status(400);
      throw new Error("no promocodes");
    }
  }),

  // @desc delete coupon
  // @router DELETE /api/admin/delete-promocode/:id
  // @access PRIVATE

  deletePromocode: asyncHandler(async (req, res) => {
    const { id } = req.params;
    PromoCode.findByIdAndDelete(id).exec((err, done) => {
      if (!err) {
        res.status(200);
        res.json({ message: "successfully deleted" });
      } else {
        res.status(400);
        res.json({ message: "promocode delete failed!" });
      }
    });
  }),

  //@desc update active or inactive promocode
  //@router PUT /api/admin/promocode-active-inactive/:id
  //@access PRIVATE

  activeInactivePromocode: asyncHandler(async (req, res) => {
    const { status, id } = req.body;
    PromoCode.findByIdAndUpdate(id, {
      status: status,
    }).exec((err, done) => {
      if (!err) {
        res.status(200);
        res.json({ update: "success" });
      } else {
        res.status(400);
        res.json({ update: "failed" });
      }
    });
  }),

  // @desc update promocode
  // @router POST /api/admin/update-promocode
  // @access PRIVATE

  updatePromocode: asyncHandler(async (req, res) => {
    const {
      id,
      code,
      category,
      expireDate,
      couponValue,
      couponType,
      minPrice,
      maxDiscount,
      maxRides,
      users,
    } = req.body;

    PromoCode.findByIdAndUpdate(id, {
      promocode: code,
      category: category,
      expireDate: expireDate,
      date: expireDate,
      couponValue: couponValue,
      couponType: couponType,
      minPrice: minPrice,
      maxDiscount: maxDiscount,
      maxRides: maxRides,
      users: users,
    }).exec((err, done) => {
      if (!err) {
        res.status(200);
        res.json({ update: "success" });
      } else {
        res.status(400);
        res.json({ update: "failed" });
      }
    });
  }),

  // @desc get single promocode details
  // @router GET /api/admin/single-promocode/:id
  // @access PRIVATE

  getSinglePromocode: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const details = await PromoCode.findById(id).exec();
    if (details) {
      res.status(200);
      res.json(details);
    } else {
      res.status(400);
      throw new Error("not found promocode");
    }
  }),

  // @desc get driver comments
  // @router GET /api/admin/get-driver-comment/:id
  // @access PRIVATE
  getDriverCommets: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const driver = await Driver.findById(id).exec();
    if (driver) {
      res.status(200);
      res.json({ csNotes: driver.csnotes });
    } else {
      res.status(401);
    }
  }),

  // @desc get customer comments
  // @router GET /api/admin/get-customer-comment/:id
  // @access PRIVATE
  getCustomerComment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const customer = await Customers.findById(id).exec();
    if (customer) {
      // console.log(customer, "kkkkkkkkkkkkkkkk");
      res.status(200);
      res.json({ csNotes: customer.csnote });
    } else {
      res.status(401);
    }
  }),

  // @desc get new orders
  // @socket io event 'placeOrder'

  newBookings: async (orderId) => {
    try {
      const newBooking = await Booking.findOne({ Id: orderId }).exec();
      if (newBooking) {
        return newBooking;
      } else {
        return "not found new booking";
      }
    } catch (e) {
      console.log(e);
    }
  },

  //@desc admin add commision rate
  //@router POST /api/admin/add-commision
  //@access PRIVATE

  addCommision: asyncHandler(async (req, res) => {
    const { rate } = req.body;
    const commisionRate = await Commision.findOneAndUpdate(
      { _id: "62d13db74ac2561522fd5218" },
      {
        rate: rate,
      }
    ).exec();
    if (commisionRate) {
      const comm = await Commision.findOne({
        _id: "62d13db74ac2561522fd5218",
      }).exec();
      if (comm) {
        res.status(200);
        res.json(comm);
      } else {
        res.status(400);
        throw new Error("Something went wrong");
      }
    } else {
      res.status(400);
      throw new Error("Something went wrong");
    }
  }),

  //@desc admin get withdrawal requests
  //@router GET /api/admin/withdrawal-requests
  //@access PRIVATE

  getWithdrawalRequests: asyncHandler(async (req, res) => {
    const withdrawalRequests = await Withdrawal.find()
      .sort({ createdAt: -1 })
      .exec();
    if (withdrawalRequests) {
      res.status(200);
      res.json(withdrawalRequests);
    } else {
      res.status(400);
      throw new Error("not found Withdrawal Requests");
    }
  }),

  //@desc admin get driver push notification requests
  //@router GET /api/admin/add-push-notification
  //@access PRIVATE

  promotionNotification: asyncHandler(async (req, res) => {
    const { body, title, notificationFor, tokens, type } = req.body;

    if (notificationFor === "Driver" && type === "registered") {
      allDriverNotification({ body, title, tokens });
      res.status(200);
      res.json({ status: true });
    } else if (notificationFor === "Driver" && type === "unregistered") {
      allUnRegisteredDriverNotification({ body, title });
      res.status(200);
      res.json({ status: true });
    } else if (notificationFor === "User") {
      allUserNotification({ body, title, tokens });
      res.status(200);
      res.json({ status: true });
    }
  }),

  getWithdrawalRequestDriverDetails: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const withdrawalRequest = await Withdrawal.findById(id).exec();
    if (withdrawalRequest) {
      const driver = await Driver.findById(withdrawalRequest.id).exec();
      if (driver) {
        res.status(200);
        res.json({
          driverDetails: driver,
          withdrawRequest: withdrawalRequest,
        });
      }
    } else {
      res.status(400);
      throw new Error("not found withdrawal request");
    }
  }),

  rejectWithdrawalRequest: asyncHandler(async (req, res) => {
    try {
      const { id, comment } = req.body;
      const update = await Withdrawal.findByIdAndUpdate(id, {
        status: "Rejected",
        comment: comment,
      }).exec();
      const walletlog = await Driver.findOneAndUpdate(
        { _id: update.id, "walletlogs._id": update.walletlogId },
        {
          $inc: {
            wallet: update.amount,
          },
          $set: {
            "walletlogs.$.transactionType": "Credited",
            "walletlogs.$.comment":
              "Your withdrawal request has been rejected!",
            "walletlogs.$.dateAndTime":
              todayDate() + " " + formatAMPM(new Date()),
          },
        }
      ).exec();

      const data = await Withdrawal.findById(id).exec();
      if (data) {
        res.status(200);
        res.json(data);
      } else {
        res.status(400);
        throw new Error("Something went wrong!..");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  approveWithdrawaRequest: asyncHandler(async (req, res) => {
    try {
      const { id } = req.body;
      const update = await Withdrawal.findByIdAndUpdate(id, {
        status: "Approved",
        comment: "Successfully Withdraw From Wallet",
      }).exec();
      const walletlog = await Driver.findOneAndUpdate(
        { _id: update.id, "walletlogs._id": update.walletlogId },
        {
          $set: {
            "walletlogs.$.transactionType": "Debited",
            "walletlogs.$.comment": "Successfully Withdraw From Wallet.",
            "walletlogs.$.dateAndTime":
              todayDate() + " " + formatAMPM(new Date()),
          },
        }
      ).exec();

      const data = await Withdrawal.findById(id).exec();
      if (data) {
        res.status(200);
        res.json(data);
      } else {
        res.status(400);
        throw new Error("Something ");
      }
    } catch (error) {
      console.log(error, "approve withdraw request");
    }
  }),

  getCommisonRate: asyncHandler(async (req, res) => {
    try {
      const data = await Commision.findOne({
        _id: "62d13db74ac2561522fd5218",
      }).exec();
      if (data) {
        res.status(200);
        res.json(data);
      } else {
        res.status(400);
        throw new Error("not found commision");
      }
    } catch (err) {
      console.log(err);
    }
  }),

  driverCurrentLocationBooking: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bookingDetails = await Booking.findOne({ _id: id }).exec();
    if (bookingDetails) {
      if (
        bookingDetails.status === "Cancel" ||
        bookingDetails.status === "Assigning" ||
        bookingDetails.status === "Completed"
      ) {
        res.json({ status: false });
      } else {
        if (bookingDetails.driverId) {
          const driverDetails = await Driver.findOne({
            _id: bookingDetails.driverId,
          }).exec();
          if (driverDetails) {
            res.status(200);
            res.json({
              status: true,
              currentLocation: {
                lat: driverDetails.currentLocation.lat,
                lng: driverDetails.currentLocation.lng,
              },
            });
          } else {
            res.status(400);
            throw new Error("not found driver");
          }
        } else {
          res.json({ status: false });
        }
      }
    } else {
      res.status(400);
      throw new Error("not found booking info");
    }
  }),

  updateVersion: asyncHandler(async (req, res) => {
    const { versionFor, versionNo } = req.body;
    // console.log(versionFor, versionNo);
    if (versionFor === "Driver") {
      Version.findByIdAndUpdate("62f0a855ac5e9723815c4f74", {
        version: versionNo,
      }).exec((err, done) => {
        if (!err) {
          res.status(200);
          // console.log(done);
          res.json(done);
        }
      });
    } else {
      Version.findByIdAndUpdate("62f1f7c70bacdcb19dcfd985", {
        version: versionNo,
      }).exec((err, done) => {
        if (!err) {
          res.status(200);
          // console.log(done);
          res.json(done);
        }
      });
    }
  }),

  getVersion: asyncHandler(async (req, res) => {
    var versions;
    const version = await Version.find().exec();
    if (version) {
      versions = version;
    }

    res.status(200);
    res.json({
      versions: versions,
    });
  }),

  getDashboardGraph: asyncHandler(async (req, res) => {
    try {
      let { date, place } = req.params;
      if (place == "both") {
        date = moment(date, "YYYY-MM-DD").format("DD-MM-YYYY");
        let endDate = moment(date, "DD-MM-YYYY").format("YYYY-MM-DD");
        let startDate = moment(date, "DD-MM-YYYY")
          .subtract(6, "days")
          .format("YYYY-MM-DD");

        let graphData = [];

        var getDaysBetweenDates = function (startDate, endDate) {
          var now = startDate.clone(),
            dates = [];

          while (now.isSameOrBefore(endDate)) {
            dates.push(now.format("YYYY-MM-DD"));
            now.add(1, "days");
          }
          return dates;
        };

        var startDate1 = moment(startDate);
        var endDate1 = moment(endDate);

        var dateList = getDaysBetweenDates(startDate1, endDate1);

        let enddt = moment(new Date(endDate))
          .add(1, "days")
          .format("YYYY-MM-DD");
        const graphArr = await Booking.aggregate([
          {
            $match: {
              status: "Completed",
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(enddt),
              },
            },
          },
          {
            $sort: {
              createdAt: 1,
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              date: {
                $first: "$createdAt",
              },
              count: {
                $sum: 1,
              },
            },
          },
        ]);

        if (graphArr) {
          for (let i = 0; i < graphArr.length; i++) {
            for (let j = 0; j < dateList.length; j++) {
              if (graphArr[i]._id === dateList[j]) {
                var dt = moment(graphArr[i].date, "YYYY-MM-DD hh:mm:ss");
                dateList[j] = {
                  date: graphArr[i]._id,
                  Orders: graphArr[i].count,
                  day: `${dt.format("ddd")} ${dt.format("DD")}`,
                };
              }
            }
          }

          for (let i = 0; i < dateList.length; i++) {
            if (typeof dateList[i] === "string") {
              var dt = moment(new Date(dateList[i]));
              dateList[i] = {
                date: dateList[i],
                Orders: 0,
                day: `${dt.format("ddd")} ${dt.format("DD")}`,
              };
            }
          }
          for (let i = 0; i < dateList.length; i++) {
            graphData.push(dateList[i]);
          }
        }

        res.status(200);
        res.json({
          graphData: graphData,
        });
      } else {
        date = moment(date, "YYYY-MM-DD").format("DD-MM-YYYY");
        let endDate = moment(date, "DD-MM-YYYY").format("YYYY-MM-DD");
        let startDate = moment(date, "DD-MM-YYYY")
          .subtract(6, "days")
          .format("YYYY-MM-DD");

        let graphData = [];

        var getDaysBetweenDates = function (startDate, endDate) {
          var now = startDate.clone(),
            dates = [];

          while (now.isSameOrBefore(endDate)) {
            dates.push(now.format("YYYY-MM-DD"));
            now.add(1, "days");
          }
          return dates;
        };

        var startDate1 = moment(startDate);
        var endDate1 = moment(endDate);

        var dateList = getDaysBetweenDates(startDate1, endDate1);

        let enddt = moment(new Date(endDate))
          .add(1, "days")
          .format("YYYY-MM-DD");
        const graphArr = await Booking.aggregate([
          {
            $match: {
              place: place,
              status: "Completed",
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(enddt),
              },
            },
          },
          {
            $sort: {
              createdAt: 1,
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              date: {
                $first: "$createdAt",
              },
              count: {
                $sum: 1,
              },
            },
          },
        ]);

        if (graphArr) {
          for (let i = 0; i < graphArr.length; i++) {
            for (let j = 0; j < dateList.length; j++) {
              if (graphArr[i]._id === dateList[j]) {
                var dt = moment(graphArr[i].date, "YYYY-MM-DD hh:mm:ss");
                dateList[j] = {
                  date: graphArr[i]._id,
                  Orders: graphArr[i].count,
                  day: `${dt.format("ddd")} ${dt.format("DD")}`,
                };
              }
            }
          }

          for (let i = 0; i < dateList.length; i++) {
            if (typeof dateList[i] === "string") {
              var dt = moment(new Date(dateList[i]));
              dateList[i] = {
                date: dateList[i],
                Orders: 0,
                day: `${dt.format("ddd")} ${dt.format("DD")}`,
              };
            }
          }
          for (let i = 0; i < dateList.length; i++) {
            graphData.push(dateList[i]);
          }
        }

        res.status(200);
        res.json({
          graphData: graphData,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }),
  getDashboardDetails: asyncHandler(async (req, res) => {
    try {
      let { to, from, place } = req.params;
      var ongoingOrdersCount = 0;
      if (place === "both") {
        let totalAl = [];
        if (from === "null" && to === "null") {
          var pendingDriver = await Driver.find({ status: "Pending" }).exec();
          if (pendingDriver) {
            var pendingDriverCount = pendingDriver.length;
          }
          var activeDriver = await Driver.find({ status: "Active" }).exec();
          if (activeDriver) {
            var activeDriverCount = activeDriver.length;
          }
          var totalCustomers = await Customers.find().exec();
          if (totalCustomers) {
            var totalCustomerCount = totalCustomers.length;
          }
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
          }).exec();
          if (ongoingOrder) {
            ongoingOrdersCount = ongoingOrder.length;
          }
          var completeOrder = await Booking.find({
            status: "Completed",
          }).exec();
          if (completeOrder) {
            completedOrdersCount = completeOrder.length;
          }
          var cancelOrders = await Booking.find({ status: "Cancel" }).exec();
          if (cancelOrders) {
            var cancelOrdersCount = cancelOrders.length;
          }

          var expiredOrders = await Booking.find({ status: "Expired" }).exec();
          if (expiredOrders) {
            var expireOrderCount = expiredOrders.length;
          }
          totalAl = await Booking.aggregate([
            {
              $match: {
                status: "Completed",
              },
            },
            {
              $group: {
                _id: null,
                amount: {
                  $sum: "$paymentDetails.amount",
                },
              },
            },
          ]).exec();
        } else if (from !== "null" && to !== "null") {
          var pendingDriver = await Driver.find({ status: "Pending" }).exec();
          if (pendingDriver) {
            var pendingDriverCount = pendingDriver.length;
          }
          var activeDriver = await Driver.find({ status: "Active" }).exec();
          if (activeDriver) {
            var activeDriverCount = activeDriver.length;
          }
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (ongoingOrder) {
            ongoingOrdersCount = ongoingOrder.length;
          }
          var completeOrder = await Booking.find({
            status: "Completed",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (completeOrder) {
            var completedOrdersCount = completeOrder.length;
          }
          var cancelOrders = await Booking.find({
            status: "Cancel",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (cancelOrders) {
            var cancelOrdersCount = cancelOrders.length;
          }

          var expiredOrders = await Booking.find({
            status: "Expired",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (expiredOrders) {
            var expireOrderCount = expiredOrders.length;
          }

          totalAl = await Booking.aggregate([
            {
              $match: {
                status: "Completed",
                createdAt: {
                  $gte: new Date(from),
                  $lte: new Date(to),
                },
              },
            },
            {
              $group: {
                _id: null,
                amount: {
                  $sum: "$paymentDetails.amount",
                },
              },
            },
          ]).exec();
        } else if (from !== "null" && to == "null") {
          var from1 = moment(from).add(1, "d").format("YYYY-MM-DD");
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(from1),
            },
          }).exec();
          if (ongoingOrder) {
            console.log(ongoingOrder);
            ongoingOrdersCount = ongoingOrder.length;
            console.log(ongoingOrdersCount, "ongoingOrdersCount");
          }
          var completeOrder = await Booking.find({
            status: "Completed",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(from1),
            },
          }).exec();
          if (completeOrder) {
            var completedOrdersCount = completeOrder.length;
          }
          var cancelOrders = await Booking.find({
            status: "Cancel",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(from1),
            },
          }).exec();
          if (cancelOrders) {
            var cancelOrdersCount = cancelOrders.length;
          }

          var expiredOrders = await Booking.find({
            status: "Expired",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(from1),
            },
          }).exec();
          if (expiredOrders) {
            var expireOrderCount = expiredOrders.length;
          }

          totalAl = await Booking.aggregate([
            {
              $match: {
                status: "Completed",
                createdAt: {
                  $gte: new Date(from),
                  $lte: new Date(from1),
                },
              },
            },
            {
              $group: {
                _id: null,
                amount: {
                  $sum: "$paymentDetails.amount",
                },
              },
            },
          ]).exec();
          var pendingDriver = await Driver.find({ status: "Pending" }).exec();
          if (pendingDriver) {
            var pendingDriverCount = pendingDriver.length;
          }
          var activeDriver = await Driver.find({ status: "Active" }).exec();
          if (activeDriver) {
            var activeDriverCount = activeDriver.length;
          }
        }
        const driverVersion = await Version.findOne({
          customerApp: false,
        }).exec();
        const customerVersion = await Version.findOne({
          customerApp: true,
        }).exec();
        let totalEran;
        if (totalAl[0]) {
          if (totalAl[0].amount) {
            totalEran = totalAl[0].amount;
          } else {
            totalEran = 0;
          }
        } else {
          totalEran = 0;
        }

        res.status(200);
        res.json({
          activeDrivers: activeDriverCount,
          pendingDrivers: pendingDriverCount,
          completedOrders: completedOrdersCount,
          cancelledOrders: cancelOrdersCount,
          ongoingOrders: ongoingOrdersCount,
          expireOrderCount: expireOrderCount,
          totalCustomers: totalCustomerCount,
          totalOrderValue: totalEran,
          driverVersion: driverVersion,
          customerVersion: customerVersion,
        });
      } else {
        let totalAl = [];
        var d_city = "";
        let c_city = "";
        if (place === "Bangalore") {
          d_city = "Bengaluru";
          c_city = "Bangalore";
        } else {
          d_city = "Mysore";
          c_city = "Mysore";
        }
        // place  ==="Bangalore"? city = ""
        var pendingDriver = await Driver.find({
          status: "Pending",
          "personalDetails.addCity": d_city,
        }).exec();
        if (pendingDriver) {
          var pendingDriverCount = pendingDriver.length;
        }
        var activeDriver = await Driver.find({
          status: "Active",
          "personalDetails.addCity": d_city,
        }).exec();
        if (activeDriver) {
          var activeDriverCount = activeDriver.length;
        }
        var totalCustomers = await Customers.find({ place: c_city }).exec(); //{place:place}
        if (totalCustomers) {
          var totalCustomerCount = totalCustomers.length;
        }
        if (from === "null" && to === "null") {
          var completeOrder = await Booking.find({
            status: "Completed",
            place: place,
          }).exec();
          if (completeOrder) {
            var completedOrdersCount = completeOrder.length;
          }
          var cancelOrders = await Booking.find({
            status: "Cancel",
            place: place,
          }).exec();
          if (cancelOrders) {
            var cancelOrdersCount = cancelOrders.length;
          }

          var expiredOrders = await Booking.find({
            status: "Expired",
            place: place,
          }).exec();
          if (expiredOrders) {
            var expireOrderCount = expiredOrders.length;
          }
          totalAl = await Booking.aggregate([
            {
              $match: {
                place: place,
                status: "Completed",
              },
            },
            {
              $group: {
                _id: null,
                amount: {
                  $sum: "$paymentDetails.amount",
                },
              },
            },
          ]).exec();
        } else if (from !== "null" && to !== "null") {
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (ongoingOrder) {
            ongoingOrdersCount = ongoingOrder.length;
          }
          var completeOrder = await Booking.find({
            status: "Completed",
            place: place,
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (completeOrder) {
            var completedOrdersCount = completeOrder.length;
          }
          var cancelOrders = await Booking.find({
            status: "Cancel",
            place: place,
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (cancelOrders) {
            var cancelOrdersCount = cancelOrders.length;
          }

          var expiredOrders = await Booking.find({
            status: "Expired",
            place: place,
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (expiredOrders) {
            var expireOrderCount = expiredOrders.length;
          }

          totalAl = await Booking.aggregate([
            {
              $match: {
                status: "Completed",
                place: place,
                createdAt: {
                  $gte: new Date(from),
                  $lte: new Date(to),
                },
              },
            },
            {
              $group: {
                _id: null,
                amount: {
                  $sum: "$paymentDetails.amount",
                },
              },
            },
          ]).exec();
        } else if (from !== "null" && to == "null") {
          var from1 = moment(from).add(1, "d").format("YYYY-MM-DD");
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(from1),
            },
          }).exec();
          if (ongoingOrder) {
            ongoingOrdersCount = ongoingOrder.length;
          }
          var completeOrder = await Booking.find({
            status: "Completed",
            place: place,
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(from1),
            },
          }).exec();
          if (completeOrder) {
            var completedOrdersCount = completeOrder.length;
          }
          var cancelOrders = await Booking.find({
            status: "Cancel",
            place: place,
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(from1),
            },
          }).exec();
          if (cancelOrders) {
            var cancelOrdersCount = cancelOrders.length;
          }

          var expiredOrders = await Booking.find({
            status: "Expired",
            place: place,
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(from1),
            },
          }).exec();
          if (expiredOrders) {
            var expireOrderCount = expiredOrders.length;
          }

          totalAl = await Booking.aggregate([
            {
              $match: {
                status: "Completed",
                place: place,
                createdAt: {
                  $gte: new Date(from),
                  $lte: new Date(from1),
                },
              },
            },
            {
              $group: {
                _id: null,
                amount: {
                  $sum: "$paymentDetails.amount",
                },
              },
            },
          ]).exec();
        }
        const driverVersion = await Version.findOne({
          customerApp: false,
        }).exec();
        const customerVersion = await Version.findOne({
          customerApp: true,
        }).exec();
        let totalEran;
        if (totalAl[0]) {
          if (totalAl[0].amount) {
            totalEran = totalAl[0].amount;
          } else {
            totalEran = 0;
          }
        } else {
          totalEran = 0;
        }

        res.status(200);
        res.json({
          activeDrivers: activeDriverCount,
          pendingDrivers: pendingDriverCount,
          completedOrders: completedOrdersCount,
          cancelledOrders: cancelOrdersCount,
          ongoingOrders: ongoingOrdersCount,
          expireOrderCount: expireOrderCount,
          totalCustomers: totalCustomerCount,
          totalOrderValue: totalEran,
          driverVersion: driverVersion,
          customerVersion: customerVersion,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }),

  resetPassword: asyncHandler(async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const admin = await Admin.findById(req.admin._id).exec();
      if (admin && (await admin.matchPassword(currentPassword))) {
        await Admin.findByIdAndUpdate(admin._id, {
          password: newPassword,
        }).exec();
      }
    } catch (error) {
      console.log(error);
    }
  }),

  createClaimOffers: asyncHandler(async (req, res) => {
    try {
      const { title, coins, img, ext } = req.body;
      const image_data = await uploadImages(img, "claim-offers", ext);
      const details = await ClaimOffers.create({
        title,
        coins,
        img_url: image_data.img_url,
        img_id: image_data.img_key,
      });
      if (details) {
        res.status(200);
        res.json(details);
      } else {
        res.status(400);
        throw new Error("create claim offer failed!...");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  getClaimOffers: asyncHandler(async (req, res) => {
    try {
      const details = await ClaimOffers.find().exec();
      if (details) {
        res.status(200);
        res.json(details);
      } else {
        res.status(400);
        throw new Error("something went wrong");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  updateClaimOffers: asyncHandler(async (req, res) => {
    try {
      const { claimId, title, coins, img, ext } = req.body;
      const claimDetails = await ClaimOffers.findById(claimId).exec();
      if (ext) {
        await deleteImages(claimDetails.img_id);
        var image_data = await uploadImages(img, "claim-offers", ext);
        claimDetails.img_url = image_data.img_url;
        claimDetails.img_id = image_data.img_key;
      } else {
        claimDetails.img_url = img;
        claimDetails.img_id = claimDetails.img_id;
      }
      claimDetails.title = title;
      claimDetails.coins = coins;
      await claimDetails.save();
      res.status(200);
      res.json({ message: "Successfully Updated" });
    } catch (error) {
      console.log(error);
    }
  }),

  createCoinPricing: asyncHandler(async (req, res) => {
    try {
      // console.log(req.body);
      const { orderNumber, coins, range, range1, coins1, type } = req.body;
      const details = await CoinPricing.create({
        orderNumber,
        coins,
        coins1,
        range,
        type,
        range1,
      });
      if (details) {
        res.status(200);
        res.json(details);
      } else {
        res.status(400);
        throw new Error("Create Coin Failed!...");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  getCoinPricing: asyncHandler(async (req, res) => {
    const data = await CoinPricing.find().exec();
    if (data) {
      res.status(200);
      res.json(data);
    } else {
      res.status(400);
      throw new Error("Something Went Wrong!...");
    }
  }),
  driverTransactions: asyncHandler(async (req, res) => {
    let datas = [];
    const transactions = await TransactionHistory.find({
      userType: "Driver",
    }).exec();
    if (transactions) {
      transactions.map((txns) => {
        datas.unshift(txns);
      });

      res.status(200);
      res.json(datas);
    } else {
      res.json({ status: "no transactions" });
    }
  }),
  updateCoinPricing: asyncHandler(async (req, res) => {
    try {
      const { pricingId, orderNumber, coins, range, range1, coins1, type } =
        req.body;
      await CoinPricing.findByIdAndUpdate(pricingId, {
        orderNumber,
        coins,
        range,
        range1,
        coins1,
        type,
      }).exec();
      res.status(200);
      res.json({ message: "Successfully Updated." });
    } catch (error) {
      console.log(error);
    }
  }),

  // testCoinPricing: asyncHandler(async (req, res) => {
  //   let a = [
  //     {
  //       orderNumber: 1,
  //       coins: 200,
  //       coins1: 100,
  //       type: "Fixed",
  //       range: 200,
  //       range1: 100,
  //     },
  //     {
  //       orderNumber: 2,
  //       coins: 150,
  //       coins1: 100,
  //       type: "Fixed",
  //       range: 200,
  //       range1: 100,
  //     },
  //     {
  //       orderNumber: 3,
  //       coins: 100,
  //       coins1: 100,
  //       type: "Fixed",
  //       range: 200,
  //       range1: 100,
  //     },
  //     {
  //       orderNumber: 4,
  //       coins: 40,
  //       coins1: 100,
  //       type: "Per",
  //       range: 100,
  //       range1: 10,
  //     },
  //   ];

  //   let customerOrders = req.body.order;
  //   let amount = req.body.amount;

  //   let coins;

  //   for (let i = 0; i < a.length; i++) {
  //     let pricing = a[i];
  //     console.log(pricing);
  //     if (pricing.orderNumber >= customerOrders && pricing.type === "Fixed") {
  //       if (customerOrders === pricing.orderNumber) {
  //         if (amount >= pricing.range) {
  //           coins = pricing.coins;
  //         console.log("step1", coins);

  //         } else if (amount >= pricing.range1 && amount <= pricing.range) {
  //           coins = pricing.coins1;
  //         console.log("step2", coins);
  //         }
  //       } else if (
  //         customerOrders > 1 &&
  //         customerOrders === pricing.orderNumber &&
  //         amount >= pricing.range
  //       ) {
  //         coins = pricing.coins;
  //         console.log("step3", coins);
  //       }
  //     } else if (
  //       customerOrders >= pricing.orderNumber &&
  //       pricing.type === "Per"
  //     ) {
  //       var div_time = amount / pricing.range;
  //       var temp_time = div_time.toFixed(2);
  //       var adding_times = temp_time.split(".")[0];
  //       coins = pricing.coins * parseInt(adding_times);
  //       console.log("step4", coins);
  //     }
  //   }
  //   res.json({
  //     coins: coins,
  //   });
  // }),

  customerTransactions: asyncHandler(async (req, res) => {
    let datas = [];
    const transactions = await TransactionHistory.find({
      userType: "Customer",
    }).exec();
    if (transactions) {
      transactions.map((txns) => {
        datas.unshift(txns);
      });
      console.log(datas);
      res.status(200);
      res.json(datas);
    } else {
      res.json({ status: "no transactions" });
    }
  }),

  testCoinPricing: asyncHandler(async (req, res) => {
    let a = [
      {
        orderNumber: 1,
        coins: 200,
        coins1: 100,
        type: "Fixed",
        range: 200,
        range1: 100,
      },
      {
        orderNumber: 2,
        coins: 150,
        coins1: "",
        type: "Fixed",
        range: 200,
        range1: "",
      },
      {
        orderNumber: 3,
        coins: 100,
        coins1: 100,
        type: "Fixed",
        range: 200,
        range1: "",
      },
      {
        orderNumber: 4,
        coins: 40,
        coins1: 100,
        type: "Per",
        range: 100,
        range1: "",
      },
    ];

    let order = req.body.order;
    let amount = req.body.amount;
    let coins;
    for (let i = 0; i < a.length; i++) {
      let pricing = a[i];
      if (order === pricing.orderNumber && pricing.type === "Fixed") {
        if (pricing.orderNumber === 1 && order === 1) {
          // write first order calculation
          if (amount >= pricing.range1 && amount < pricing.range) {
            coins = pricing.coins1;
            // console.log(pricing);
            // console.log("Step1", coins);
          } else if (amount >= pricing.range) {
            coins = pricing.coins;
            // console.log(pricing);
            // console.log("Step2", coins);
          }
        } else {
          // write after first order calculation
          if (pricing.orderNumber >= 2 && order >= 2) {
            if (amount >= pricing.range) {
              coins = pricing.coins;
              // console.log(pricing);
              // console.log("Step3", coins);
            }
          }
        }
      } else if (order >= pricing.orderNumber && pricing.type === "Per") {
        // condition pricing type per
        let div_amount = amount / pricing.range;
        let str_times = div_amount.toFixed(1).split(".")[0];
        let fixed_times = parseInt(str_times);
        coins = pricing.coins * fixed_times;

        // console.log({ div_amount, amount, range: pricing.range, fixed_times });
        // console.log("Step4");
      }
    }

    res.json({ coins });
  }),

  getOfferClaimRequests: asyncHandler(async (req, res) => {
    const offerClaimRequest = await ClaimWithdrawal.find().exec();
    if (offerClaimRequest) {
      res.status(200);
      res.json(offerClaimRequest);
    } else {
      res.status(400);
      throw new Error("Not found");
    }
  }),

  deleteCoinPricing: asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      CoinPricing.findByIdAndDelete(id).exec((err) => {
        if (err) {
          res.status(400);
          throw new Error("Something went wrong");
        } else {
          res.status(200);
          res.json({ message: "Successfully Deleted" });
        }
      });
    } catch (error) {
      console.log(error);
    }
  }),

  deleteClaimOffers: asyncHandler(async (req, res) => {
    const { id } = req.params;
    ClaimOffers.findByIdAndDelete(id).exec((err) => {
      if (err) {
        res.status(400);
        throw new Error("Something Went Wrong");
      } else {
        res.status(200);
        res.json({ message: "Successfully Deleted" });
      }
    });
  }),

  approveOrRejectOfferClaim: asyncHandler(async (req, res) => {
    try {
      const { requestId, status, comment } = req.body;
      const claimOfferRequestDetails = await ClaimWithdrawal.findById(
        requestId
      ).exec();

      console.log(claimOfferRequestDetails);
      if (claimOfferRequestDetails) {
        if (status === "approved") {
          claimOfferRequestDetails.status = "Approved";
          claimOfferRequestDetails.comment = "Approved ):" + comment;
        } else if (status === "rejected") {
          claimOfferRequestDetails.status = "Rejected";
          claimOfferRequestDetails.comment = "Rejected ):" + comment;
          // console.log(claimOfferRequestDetails.customerDetails.customerId);
          await Customers.findByIdAndUpdate(
            claimOfferRequestDetails.customerDetails.customerId,
            {
              $inc: {
                coins: claimOfferRequestDetails.offerDetails.needCoins,
              },
            }
          ).exec();
        }
        await claimOfferRequestDetails.save();
        res.status(200);
        res.json({ message: "Success" });
      } else {
        res.status(400);
        throw new Error("not found offer claim request");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  getCustomerCoinLogs: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const details = await Customers.findById(id).exec();
    if (details) {
      res.status(200);
      res.json(details.coinHistory);
    } else {
      res.status(400);
      throw new Error("not found customer for geting coinHistory");
    }
  }),

  driverRejection: asyncHandler(async (req, res) => {
    try {
      const { type, rejectedDocs, driverId } = req.body;
      console.log(req.body);

      console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      const driverDetails = await Driver.findById(driverId).exec();
      console.log(
        "____________________________________________________________________"
      );
      console.log(driverDetails);
      if (driverDetails) {
        let comment1;
        let comment;
        driverDetails.isReject = true;
        driverDetails.status = "Rejected";

        for (let i = 0; i < rejectedDocs.length; i++) {
          comment1 = rejectedDocs[i].remark;
          if (comment) {
            comment = comment + ", " + comment1;
          } else {
            comment = comment1;
          }
        }

        driverDetails.rejectedDocuments.push({
          docmentType: type,
          rejectedFields: rejectedDocs,
        });

        driverDetails.csnotes.push({
          admin: req.admin.firstName + " " + req.admin.lastName,
          comment: "Rejected :)" + type + ": " + comment,
          dateAndTime: todayDate() + " " + formatAMPM(new Date()),
        });

        if (type === "basic-details") {
          driverDetails.isRejectBasicDetails = true;
        } else if (type === "aadhar-details") {
          driverDetails.isRejectAadharDetails = true;
        } else if (type === "bank-details") {
          driverDetails.isRejectBankDetails = true;
        } else if (type === "pancard-details") {
          driverDetails.isRejectPancardDetails = true;
        } else if (type === "vehicle-details") {
          driverDetails.isRejectVehicleDetails = true;
        } else if (type === "insurance-details") {
          driverDetails.isRejectInsuranceDetails = true;
        } else if (type === "licence-details") {
          driverDetails.isRejectLicenceDetails = true;
        } else if (type === "rc-details") {
          driverDetails.isRejectRcDetails = true;
        }
        await driverDetails.save();
        driverRejectionNotification(driverDetails.fcmToken, 1);
        driverRejectionNotification(driverDetails.fcmToken, 2);

        res.status(200);
        res.json({ ok: true });
      } else {
        res.status(400);
        throw new Error("not found driver in driverRejection");
      }
    } catch (error) {
      console.log(error);
    }
  }),
};
