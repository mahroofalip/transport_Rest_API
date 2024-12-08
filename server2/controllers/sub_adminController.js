const asyncHandler = require("express-async-handler");
const Customers = require("../models/customer_model");
const Driver = require("../models/driver_model");
const SubAdmin = require("../models/sub-admin_model");
const Booking = require("../models/booking_model");
const generateToken = require("../utility/generateToken");
const moment = require("moment");

// get time here
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

module.exports = {
  // @desc Super Admin Register
  // @router POST /api/super-admin/register
  // @access PUBLIC

  subAdminRegister: asyncHandler(async (req, res) => {
    const { email, password, place } = req.body;
    const subAdmin = await SubAdmin.create({
      email,
      place,
      password,
    });
    if (subAdmin) {
      res.status(200);
      res.json({
        _id: subAdmin._id,
        email: subAdmin.email,
        place: subAdmin.place,
        token: generateToken(subAdmin._id),
      });
    } else {
      res.status(400);
      throw new Error("Create Super Admin Failed!...");
    }
  }),

  // @desc Super Admin Login
  // @router POST /api/sub-admin/login
  // @access PUBLIC

  subAdminLogin: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // console.log(email, password);
    const subAdmin = await SubAdmin.findOne({
      email,
    });
    if (!subAdmin) {
      res.status(400);
      throw new Error("Invalid Entry!...");
    }

    if (subAdmin && subAdmin.password === password) {
      res.json({
        _id: subAdmin._id,
        firstName: subAdmin.firstName,
        lastName: subAdmin.lastName,
        email: subAdmin.email,
        name: subAdmin.name,
        token: generateToken(subAdmin._id),
      });
    } else {
      res.status(400);
      throw new Error("Unauthoried!..");
    }
  }),
  // @desc add booking comment
  // @router PUT /api/sub-admin/booking-add-comment
  // @access PRIVATE

  bookingAddComment: asyncHandler(async (req, res) => {
    const { id, comment, subAdminName } = req.body;

    var currentTime = formatAMPM(new Date());
    var today = todayDate();
    const addComment = Booking.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          csNotes: {
            admin: subAdminName,
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
  // @desc SubAdmin get all customer list
  // @router GET /api/sub-admin/customer-list
  // @access PRIVATE

  customerListController: asyncHandler(async (req, res) => {

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

    // const customerList = await Customers.find().sort({ createdAt: -1 }).exec();
    // if (customerList) {
    //   res.status(200);
    //   res.json(customerList);
    // } else {
    //   res.status(400);
    //   throw new Error("not found!..");
    // }
  }),

  // @desc SubAdmin Add Comment
  // @router POST /api/sub-admin/add-comment
  // @access PRIVATE

  addCommentController: asyncHandler(async (req, res) => {
    const { customerId, comment } = req.body;
    var currentTime = formatAMPM(new Date());
    // get Current Date
    var today = todayDate();
    // update customer document
    const update = await Customers.findByIdAndUpdate(customerId, {
      isBlock: false,
      $push: {
        csnote: {
          admin: req.subAdmin.firstName + " " + req.subAdmin.lastName,
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
      throw new Error("Add Comment Failed!...");
    }
  }),
  // @desc SubAdmin dashboard
  // @router POST /api/sub-admin/dashboard

  getDashboardDetails: asyncHandler(async (req, res) => {
    try {
      let { to, from, place } = req.params;
      // common datas
      
      if (place === "both") {
        if (from === "null" && to === "null") {
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
          }).exec();
          if (ongoingOrder) {
            var ongoingOrdersCount = ongoingOrder.length;
          }
          var completeOrder = await Booking.find({
            status: "Completed",
          }).exec();
          if (completeOrder) {
            var completedOrdersCount = completeOrder.length;
          }
          var cancelOrders = await Booking.find({ status: "Cancel" }).exec();
          if (cancelOrders) {
            var cancelOrdersCount = cancelOrders.length;
          }

          var expiredOrders = await Booking.find({ status: "Expired" }).exec();
          if (expiredOrders) {
            var expireOrderCount = expiredOrders.length;
          }
        } else if (from !== "null" && to !== "null") {
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (ongoingOrder) {
            var ongoingOrdersCount = completeOrder.length;
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
            var ongoingOrdersCount = completeOrder.length;
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
        }

        res.status(200);
        res.json({
          ongoingOrders: ongoingOrdersCount,
          completedOrders: completedOrdersCount,
          cancelledOrders: cancelOrdersCount,
          expireOrderCount: expireOrderCount,
        });
      } else {
        if (from === "null" && to === "null") {
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
          }).exec();
          if (ongoingOrder) {
            var ongoingOrdersCount = ongoingOrder.length;
          }
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
        } else if (from !== "null" && to !== "null") {
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
            place: place,
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          }).exec();
          if (ongoingOrder) {
            var ongoingOrdersCount = ongoingOrder.length;
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
        } else if (from !== "null" && to == "null") {
          var ongoingOrder = await Booking.find({
            status: "Ongoing",
            place: place,
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(from1),
            },
          }).exec();
          if (ongoingOrder) {
            var ongoingOrdersCount = ongoingOrder.length;
          }
          var from1 = moment(from).add(1, "d").format("YYYY-MM-DD");
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
        }

        res.status(200);
        res.json({
          completedOrders: completedOrdersCount,
          ongoingOrders: ongoingOrdersCount,
          cancelledOrders: cancelOrdersCount,
          expireOrderCount: expireOrderCount,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }),

  driverListController: asyncHandler(async (req, res) => {
    const driverList = await Driver.find().sort({ createdAt: -1 }).exec();
    if (driverList) {
      res.status(200);
      res.json(driverList);
    }
  }),

  driverAddComment: asyncHandler(async (req, res) => {
    const { driverId, comment, subAdminName } = req.body;
    var currentTime = formatAMPM(new Date());
    // get Current Date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
    // find admin
    const getAdmin = await SubAdmin.findById(req.subAdmin._id).exec();
    if (getAdmin) {
      // update customer document
      const update = await Driver.findByIdAndUpdate(driverId, {
        $push: {
          csnotes: {
            admin: subAdminName, // getAdmin.firstName + " " + getAdmin.lastName,
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

  bookingList: asyncHandler(async (req, res) => {
    try {
      const bookings = await Booking.find().sort({ createdAt: -1 }).exec();
      if (bookings) {
        res.status(200);
        res.json(bookings);
      } else {
        res.status(400);
        throw new Error("not found bookings");
      }
    } catch (error) {
      console.log(error);
    }
  }),

  getGraphData: asyncHandler(async (req, res) => {
    try {
      let { date, place } = req.params;

      if (place === "both") {
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
              status: "Completed",
              place: place,
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
};
