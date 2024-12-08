const { Server } = require("socket.io");
const { newBookings } = require("../controllers/adminController");
const { currentLocaionUpdating } = require("../controllers/driverController");
const mongoose = require("mongoose");

const {
  assingDrivers,
  acceptDriver,
  comfirmation,
  driverLocation,
  reachedPickupPoint,
  ongoing,
  completed,
  updateTrakingStatus,
  cancelOrder,
  expireOrder,
} = require("../controllers/orderManageController");
const {
  orderNotification,
  cancelNotification,
  completedNotification,
  cancelUserNotification,
  pickedNotification,
} = require("../fcm/notification");
// const {reachedLimitAndCancel} = require("../controllers/adminController")
const Booking = require("../models/booking_model");
const Driver = require("../models/driver_model");
const Withdrawal = require("../models/withdrawalRequest_model");
const HelperCollection = require("../models/helper_model");
const Customers = require("../models/customer_model");
const CoinPricing = require("../models/coin_pricing_model");

// generating customer custom id
function padLeadingZeros(num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}
let finishedIds = [];
async function generateWithdrawalRequestId() {
  var len = await Withdrawal.count().exec();
  var count = parseInt(len) + 1;
  var code = padLeadingZeros(count, 4);
  const id = "LRNRWID" + code;
  return id;
}

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

let i = 1;
const socketConfig = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: "*",
    },
  });

  let existOrderId = [];
  let c = 1;

  io.on("connection", (socket) => {
    // console.log("socket conencted");
    // socket.on("currentLocation", async (data) => {
    //   let lat1 = data.currentLocation[0];
    //   let lng1 = data.currentLocation[1];
    //   let driverId = data.driverId;
    //   if (driverId && lat1 && lng1) {
    //     currentLocaionUpdating(lat1, lng1, driverId);
    //   }
    // });

    socket.on("orderFinish", async (data) => {
      
      

      if (data) {
       
        const order = await Booking.findOne({ Id: data.bookingId }).exec();
        if (order) {
         
          const customerDetails = await Customers.findById(
            order.customerId
          ).exec();
          const coinPricing = await CoinPricing.find().exec();
          let customerOrder = customerDetails.orders;
          let coins = 0;
          let amount = order.paymentDetails.amount;
          let isCoinAvailable = false;
          for (let i = 0; i < coinPricing.length; i++) {
            let pricing = coinPricing[i];
            if (
              customerOrder === pricing.orderNumber &&
              pricing.type === "Fixed"
            ) {
              if (pricing.orderNumber === 1 && customerOrder === 1) {
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
                if (pricing.orderNumber >= 2 && customerOrder >= 2) {
                  if (amount >= pricing.range) {
                    coins = pricing.coins;
                    // console.log(pricing);
                    // console.log("Step3", coins);
                  }
                }
              }
            } else if (
              customerOrder >= pricing.orderNumber &&
              pricing.type === "Per"
            ) {
              // condition pricing type per
              let div_amount = amount / pricing.range;
              let str_times = div_amount.toFixed(1).split(".")[0];
              let fixed_times = parseInt(str_times);
              coins = pricing.coins * fixed_times;
              // console.log(pricing);
              // console.log({div_amount, amount, range : pricing.range, fixed_times, coins});
              // console.log("Step4");
            }
          }

          let repeat = finishedIds.includes(data.bookingId);

          if (coins > 0 && !repeat) {
            finishedIds.push(data.bookingId);
            customerDetails.coins = customerDetails.coins + coins;
            customerDetails.coinHistory.push({
              date: todayDate(),
              status: "Credited",
              details: "Order ID : " + order.bookingId,
              coins: coins,
            });

            await customerDetails.save();

            isCoinAvailable = true;
          }
          completedNotification(order.userFcmToken, order.bookingId);

          io.emit("orderFinished", {
           
            customerId: order.customerId,
            bookingId: order.bookingId,
            _id: order._id,
            isCoinAvailable,
            coins,
          });
        }
      }
    });

    socket.on("blockUser", async (data) => {
      
      io.emit("blockedUser", data);
    });
    socket.on("unblockUser", async (data) => {
     

      io.emit("unBlockedUser", data);
    });

    socket.on("blockDriver", async (data) => {
      io.emit("blocked", data);
    });

    socket.on("unBlockDriver", async (data) => {
      io.emit("unBlocked", data);
    });
    socket.on("message", async (data) => {
      io.emit("approval", data);
      
    });

    socket.on("online", (data) => {
      io.emit("online", true);
       
      
    });

    socket.on("placeOrder", async (data) => {
      
      const newOrder = await newBookings(data.bookingId);
      if (newOrder) {
        io.emit("newOrder", newOrder);
         console.log("placeOrder socket emit working .............2");
        existOrderId.push({ orderId: newOrder.Id });
        assigningDriver(
          existOrderId[existOrderId.length - 1],
          data.reassinging
        );
        existOrderId = [];
       
      }
    });

    const assigningDriver = async (data, reasigning) => {
      if (data) {
        const orders = await assingDrivers(data.orderId);
        
        if (orders && orders.driverFcm) {
          if (orders.driverFcm.length > 0) {
            
            orderNotification(orders, data.orderId);
          }
        }
        let currentOrderId;
        if (orders) {
          if (reasigning) {
            io.emit("anyOrder", orders);
           
            const details = await Booking.findOne({ Id: data.orderId }).exec();
           
            io.emit("reassigning", {
              bookingId: details.Id,
              driverId: details.driverId,
              orderId: details.bookingId,
            });
         
          } else {
            io.emit("anyOrder", orders);
          }
        
        }
        const assignDrivr = setInterval(
          async (orderId) => {
            
            const orderData = await Booking.findOne({ Id: orderId }).exec();
            
            if (
              orderData.acceptOrder === true ||
              orderData.status === "Cancel"
            ) {
            } else {
              const orders = await assingDrivers(orderId);
              if (orders) {
                currentOrderId = orderId;
               console.log("anyOrder socket working emit.............");
                io.emit("anyOrder", orders);
                // console.log("anyOrder socket working emit.............repeat");
              }
            }
          },
          10000,
          data.orderId
        );
        setTimeout(q, 300000);
        async function q() {
          clearInterval(assignDrivr);

          const expiredOrder = await expireOrder(currentOrderId);

          if (expiredOrder) {
            await Booking.findByIdAndUpdate(expiredOrder._id, {
              acceptOrder: true,
            }).exec();

            io.emit("removeOrder", { bookingId: expiredOrder._id });
            io.emit("orderExpired", {
              bookingId: expiredOrder._id,
              customerId: expiredOrder.customerId,
            });

            io.emit("updateBookingForAdmin", expiredOrder);
          }
        }
      }
    };

    socket.on("updateWallet", (data) => {
      io.emit("walletUpdate", data);
    });

    socket.on("acceptOrder", async (data) => {
      
      const order = await acceptDriver(data.driverId, data.bookingId);
      if (order) {
       
        io.emit("orderReady", order);

        io.emit("updateBookingForAdmin", order.forAdmin);
        // console.log("orderReady", order);
      }
    });

    socket.on("getOrderDetails", async (data) => {
      // console.log(data);
      const details = await Booking.findOne({ Id: data.bookingId }).exec();

      if (details && details.acceptOrder) {
        const driverDetails = await Driver.findById(details.driverId).exec();
        const forDriver = {
          message: "Reached Pickup",
          bookingId: details.Id,
          orderId: details.bookingId,
          customerName: details.customer.name,
          customerPhoneNumber: details.customer.mobNo,
          amount: details.paymentDetails.amount.toFixed(0),
          paymentType: details.paymentDetails.paymentType,
          pickupPoint: {
            location: details.mainAddress.pickupPoint.location,
            lat: details.mainAddress.pickupPoint.lat,
            lng: details.mainAddress.pickupPoint.lan,
          },
        };

        const forCustomer = {
          orderId: details.Id,
          otp: details.otp,
          bookingId: details.bookingId,
          profileImage: driverDetails.personalDetails.profileImg,
          amount: details.paymentDetails.amount.toFixed(0),
          paymentType: details.paymentDetails.paymentType,
          driverName:
            driverDetails.personalDetails.firstName +
            " " +
            driverDetails.personalDetails.lastName,
          driverPhoneNumber: driverDetails.personalDetails.defaultPhoneNumber,
          vehicleType: driverDetails.vehicleDetails.vehicleType,
          vehicleNumber: driverDetails.vehicleDetails.vehicleNumber,
          subType: driverDetails.vehicleDetails.subType,
        };

        let data = {
          alreadyAssign: true,
          bookingId: details.Id,
          fcmToken: details.fcmToken,
          driverId: details._id,
          driverLocation: driverDetails.currentLocation,
          customer: details.customerId,
          forDriver: forDriver,
          forCustomer: forCustomer,
        };
        io.emit("orderReady", data);
      }
    });
  ////////////////////////////////////// after nikhil
    socket.on("getOtp", async (data) => {
      const details = await comfirmation(data.driverId, data.bookingId);
      if (details) {
        io.emit("otp", details);
      }
    });

    socket.on("driverLocation", async (data) => {
      // console.log("driverLocations");
      // console.log(data);
      const location = await driverLocation(data.bookingId);
      // console.log(location);

      if (location) {
        io.emit("liveLocation", location);

        // console.log(location, "emit live Location");
      }
    });

    socket.on("updateCustomerWallet", (data) => {
      io.emit("updateCustomerWallet", data);
    });
    socket.on("reachPickupPoint", async (data) => {
    
      const order = await reachedPickupPoint(
        data.bookingId,
        data.isAdmin,
        data.comment,
        data.adminName
      );
      // console.log(order);
      if (order) {
        io.emit("pickupReached", order);
        io.emit("updateBookingForAdmin", order.order);
      }
    });

    socket.on("stopNotAvailable", (data) => {
      // console.log("stopNotAvailable on socket working .............", data);

      updateTrakingStatus(data.bookingId, "stopNotAvailable");
    });

    socket.on("stop1Available", (data) => {
      // console.log("stop1Available on socket working .............", data);

      updateTrakingStatus(data.bookingId, "stop1Available");
    });

    socket.on("stop1Completed", (data) => {
      // console.log(data);
      // console.log("stop1Completed on socket working .............");
      // data.bookingId,
      // data.isAdmin,
      // data.comment,
      // data.adminName
      console.log(data);
      updateTrakingStatus(
        data.bookingId,
        "stop1Completed",
        data.isAdmin,
        data.comment,
        data.adminName
      );
      io.emit("updateBookingForAdmin", true);
    });

    socket.on("onGoing", async (data) => {
      const order = await ongoing(
        data.bookingId,
        data.isAdmin,
        data.comment,
        data.adminName
      );
      if (order) {
        pickedNotification(order.userFcmToken, order.bookingId);
        io.emit("updateBooking", order);
        // console.log("updateBooking called end");
      }
    });

    socket.on("completed", async (data) => {
      console.log("completed on socket working .............");
      console.log(data);
      const order = await completed(data.bookingId, data.isAdmin, data.comment);
      console.log("order", order);
      if (order) {
        // console.log("orderCompleted emit socket working .............");
        io.emit("orderCompleted", {
          driverId: order.driverId,
          paymentType: order.paymentDetails.paymentType,
          amount: order.paymentDetails.amount,
        });
        console.log(data.isAdmin);
        if (data.isAdmin) {
          console.log(
            "Order Finish Called From admin Panel with Id",
            data.bookingId
          );
          console.log(
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS ////////////////// adminOrderCompleted"
          );
          io.emit("adminOrderCompleted", { bookingId: data.bookingId });
        }
        // console.log("updateBookingForAdmin emit socket working .............");
        io.emit("updateBookingForAdmin", order);
        // console.log("updateBookingForAdmin Called");
      }
    });

    socket.on("cancelOrder", async (data) => {
      console.log(data,"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSsssss this is data");
      const order = await cancelOrder(
        data.bookingId,
        data.reason,
        data.admin,
        data.subAdmin
      );

      if (order) {
       
        if (order.fcmToken) {
          cancelNotification(order.fcmToken, order.bookingId);

          cancelUserNotification(order.userFcmToken, order.bookingId);
        }
       

        io.emit("removeOrderForDriver", order);

       
        if(order.fcmToken){
         
          io.emit("removeOrder", {
            bookingId: data.bookingId,
            orderId: order.bookingId,
            driverId: order.driverId,
            fcmToken:order.fcmToken,
            customerId: order.customerId,
          });
        }else{
          
          io.emit("removeOrder", {
            bookingId: data.bookingId,
            orderId: order.bookingId,
            driverId: order.driverId,
            fcmToken:false,
            customerId: order.customerId,
          });
        }
        
       
       
      }

    });

    socket.on("acceptAndRemoveOrder", (data) => {
  
      data.driverId = "";
   
      io.emit("removeOrder", data);
    });

    socket.on("withdrawRequest", (data) => {
    
      withdrawalRequest(data.driverId, data.amount);
    });

    const withdrawalRequest = async (driverId, amount) => {
      const details = await Driver.findById(driverId).exec();
      if (amount <= details.wallet) {
        await Driver.findByIdAndUpdate(driverId, {
          $inc: {
            wallet: -amount,
          },
        }).exec();

        const driver = await Driver.findOne({ _id: driverId }).exec();
      
        const isExist = await HelperCollection.findOne({
          walletlogsid: driver._id,
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
            walletlogsid: driver._id,
            count: 1,
          });
          var walletlogID = 1;
        }

        // res.json({ isExist: isExist, id: customer._id });
        await Driver.findByIdAndUpdate(driverId, {
          $push: {
            walletlogs: {
              walletlogid: walletlogID,
              transactionBy: "Request For Withdrawal",
              holder:
                driver.personalDetails.firstName +
                " " +
                driver.personalDetails.lastName,
              amount: amount,
              comment: "Your withdraw request is under process.",
              transactionType: "On Hold",

              dateAndTime: todayDate() + " " + formatAMPM(new Date()),
            },
          },
        }).exec();
        const detail = await Driver.findById(driver._id).exec();
        const requestid = await generateWithdrawalRequestId();
        const withdrawalRequest = await Withdrawal.create({
          requestId: requestid,

          id: driverId,
          driverId: details.driverId,
          bankName: details.bankDetails.bankName,
          ifscCode: details.bankDetails.ifscCode,
          accountNumber: details.bankDetails.accountNumber,
          driverName:
            details.personalDetails.firstName +
            " " +
            details.personalDetails.lastName,
          driverPhoneNumber: details.personalDetails.defaultPhoneNumber,
          amount: amount,
          status: "Pending",

          comment: "Your request is under process",

          date: todayDate(),
          time: formatAMPM(new Date()),
          walletlogId: detail.walletlogs[detail.walletlogs.length - 1]._id,
        });
        if (withdrawalRequest) {
          // console.log("requestUpdations emit socket working .............");
          io.emit("requestUpdations", {
            request: withdrawalRequest,
            new: true,
          });
          // console.log("withdrawResponse emit socket working .............");
          io.emit("withdrawResponse", withdrawalRequest);
          // console.log("withdrawResponse Called");
        }
      }
    };

    socket.on("withdrawResponse", (data) => {
      // console.log("withdrawResponse on socket working .............");
      io.emit("withdrawResponse", data);
      // console.log("withdrawResponse emit socket working .............");
    });
  });
};

module.exports = socketConfig;
