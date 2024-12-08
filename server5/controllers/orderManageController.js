const Booking = require("../models/booking_model");
const Commision = require("../models/commision_model");
const Customers = require("../models/customer_model");
const Driver = require("../models/driver_model");
const HelperCollection = require("../models/helper_model");
const fetch = require("node-fetch");
const {
  assignedNotification,
  reachedPickupNotification,
} = require("../fcm/notification");

// const options = { priority :"high", timeTolive: 60 * 60* 24}

function todayDate() {
  // get Current Date
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  today = dd + "/" + mm + "/" + yyyy;
  return today;
}
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

function todayDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  today = dd + "/" + mm + "/" + yyyy;
  return today;
}

function distance(lat1, lon1, lat2, lon2, unit) {
  var radlat1 = (Math.PI * lat1) / 180;
  var radlat2 = (Math.PI * lat2) / 180;
  var theta = lon1 - lon2;
  var radtheta = (Math.PI * theta) / 180;
  var dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  if (unit == "K") {
    dist = dist * 1.609344;
  }
  if (unit == "N") {
    dist = dist * 0.8684;
  }
  return dist;
}

async function findNearestDriver(lat, lng, driverLocations, searchRadius) {
  const nearestDrivers = [];

  for (var i = 0; i < driverLocations.length; i++) {
    const dist = distance(
      lat,
      lng,
      driverLocations[i].location.lat,
      driverLocations[i].location.lng,
      "K"
    );
     if (dist <= searchRadius) {
    if (searchRadius) {
      nearestDrivers.push({
        driverId: driverLocations[i].driverId,
        fcmToken: driverLocations[i].driverFcmTokens,
        location: {
          lat: driverLocations[i].location.lat,
          lng: driverLocations[i].location.lng,
        },
      });
    }
     }
  }
 
  return nearestDrivers;
  //***** finding nearest drivers ended ********* */
}

let willEnter = true;

module.exports = {
  assingDrivers: async (orderId) => {
    const orderDetails = await Booking.findOne({ Id: orderId }).exec();
    // if(orderDetails.reassinging){
    //   console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$44");
    //   console.log(orderDetails);
    //   console.log(orderDetails.driverId);
    //   console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$444444444444444444444444444444444444444444444444444444444444444444444444444");
    //   await Booking.findByIdAndUpdate(orderId, {
    //     $push : {oldDrivers : orderDetails.driverId},
    //   },{upsert : true}).exec()
    // }
    if (orderDetails) {
      let vehicleTypeQuery;
      let lat = orderDetails.mainAddress.pickupPoint.lat;
      let lng = orderDetails.mainAddress.pickupPoint.lan;
      if (orderDetails.subType != "Open" && orderDetails.subType != "Close") {
        if (orderDetails.vehicleType === "Motor Cycle") {
          vehicleTypeQuery = {
            $or: [
              { "vehicleDetails.vehicleType": "Motor Cycle" },
              { "vehicleDetails.vehicleType": "Scooter" },
            ],
          };
        } else if (orderDetails.vehicleType === "Scooter") {
          vehicleTypeQuery = { "vehicleDetails.vehicleType": "Scooter" };
        } else {
          vehicleTypeQuery = {
            "vehicleDetails.vehicleType": orderDetails.vehicleType,
          };
        }
        // console.log("vehicle Type Query : ", vehicleTypeQuery);
        var drivers = await Driver.find({
          $and: [
            vehicleTypeQuery,
            { isOnline: true },
            { isBlock: false },
            { isApproved: true },
            { onOrder: false },
            {
              wallet: {
                $gte: 10,
              },
            },
          ],
        }).exec();
      } else {
        var drivers = await Driver.find({
          $and: [
            { "vehicleDetails.vehicleType": orderDetails.vehicleType },
            { "vehicleDetails.subType": orderDetails.subType },
            { isOnline: true },
            { isBlock: false },
            { onOrder: false },
            { isApproved: true },
            {
              wallet: {
                $gte: 10,
              },
            },
          ],
        }).exec();
      }

      if (drivers && drivers.length > 0) {
        const driverLocations = [];
        for (let i = 0; i < drivers.length; i++) {
          const element = drivers[i];
          driverLocations.push({
            driverId: element._id,
            location: {
              lat: parseFloat(element.currentLocation.lat),
              lng: parseFloat(element.currentLocation.lng),
            },
            driverFcmTokens: element.fcmToken,
          });
        }
        const nearestDrivers = await findNearestDriver(
          lat,
          lng,
          driverLocations,
          orderDetails.searchNextRadius
        );

        await Booking.findByIdAndUpdate(orderDetails._id, {
          $inc: {
            searchNextRadius: 2.5,
          },
        }).exec();

        let driver = [];
        let driverFcm = [];
        for (let i = 0; i < nearestDrivers.length; i++) {
          let element = nearestDrivers[i];
          driver.push(element.driverId);

          driverFcm.push(element.fcmToken);
        }

        let data = {
          status: orderDetails.status,
          bookingId: orderDetails.Id,
          orderId: orderDetails.bookingId,
          drivers: driver,
          driverFcm,
          locations: {
            pickupPoint: {
              location: orderDetails.mainAddress.pickupPoint.location,
              lat: orderDetails.mainAddress.pickupPoint.lat,
              lng: orderDetails.mainAddress.pickupPoint.lan,
            },
            stop1: {
              location: orderDetails.address2.location
                ? orderDetails.address2.location
                : null,
              lat: orderDetails.address2.lat ? orderDetails.address2.lat : null,
              lng: orderDetails.address2.lan ? orderDetails.address2.lan : null,
            },
            stop2: {
              location: orderDetails.address3.location
                ? orderDetails.address3.location
                : null,
              lat: orderDetails.address3.lat ? orderDetails.address3.lat : null,
              lng: orderDetails.address3.lan ? orderDetails.address3.lan : null,
            },
            dropPoint: {
              location: orderDetails.mainAddress.dropPoint.location
                ? orderDetails.mainAddress.dropPoint.location
                : null,
              lat: orderDetails.mainAddress.dropPoint.lat
                ? orderDetails.mainAddress.dropPoint.lat
                : null,
              lng: orderDetails.mainAddress.dropPoint.lan
                ? orderDetails.mainAddress.dropPoint.lan
                : null,
            },
          },
          amount: orderDetails.paymentDetails.amount.toFixed(0),
          paymentType: orderDetails.paymentDetails.paymentType,
          oldDrivers: orderDetails.oldDrivers,
          oldDriversFcm: orderDetails.oldDriversFcm,
        };
        // console.log(data);
        return data;
      } else {
        console.log("nnnnnnnnnnnnnnnnoooooooo drirvers 1");
        return "not found drivers";
      }
    } else {
      console.log("nnnnnnnnnnnnnnnnoooooooo drirvers 2");
      return "not found order";
    }
  },
  updateTrakingStatus: async (orderId, status, isAdmin, comment, adminName) => {
    if (isAdmin) {
      await Booking.findOneAndUpdate(
        { Id: orderId },
        {
          trakingStatus: status,
          $push: {
            csNotes: {
              admin: adminName,
              dateAndTime: todayDate() + " " + formatAMPM(new Date()),
              comment: "Stop 1 Completed:)" + comment,
            },
          },
        }
      );
    } else {
      await Booking.findOneAndUpdate(
        { Id: orderId },
        {
          trakingStatus: status,
        }
      ).exec();
    }
  },

  // driver accepting driver

  acceptDriver: async (driverId, orderId) => {
    try {
      const driver_id = driverId;
      let otp;
      const orderDetails = await Booking.findOne({ Id: orderId }).exec();
      const driverDetails = await Driver.findById(driverId).exec();
      if (
        orderDetails &&
        !orderDetails.acceptOrder &&
        orderDetails.status === "Assigning" &&
        willEnter
      ) {
        // console.log("entered");
        willEnter = false;

        await Booking.findByIdAndUpdate(orderDetails._id, {
          acceptOrder: true,
          status: "Assigned",
          driverId: driverDetails._id,
          trakingStatus: "Assigned",
          fcmToken: driverDetails.fcmToken,
          "driverDetails.name":
            driverDetails.personalDetails.firstName +
            " " +
            driverDetails.personalDetails.lastName,
          "driverDetails.mobNo":
            driverDetails.personalDetails.defaultPhoneNumber,
        }).exec();
        await Driver.findByIdAndUpdate(driverDetails._id, {
          onOrder: true,
        });
        const customer = await Customers.findById(
          orderDetails.customerId
        ).exec();
        let customerId = customer.cutomerID.split("");
        let driverId = driverDetails.driverId.split("");
        let bookingId = orderDetails.bookingId.split("");
        otp =
          customerId[customerId.length - 1] +
          customerId[customerId.length - 2] +
          driverId[driverId.length - 2] +
          driverId[driverId.length - 1] +
          bookingId[bookingId.length - 1];
        await Booking.findByIdAndUpdate(orderDetails._id, {
          otp: otp,
        }).exec();

        // console.log(driver_id);
        await Driver.findByIdAndUpdate(driver_id, {
          $inc: {
            attemptedRides: 1,
          },
        }).exec();
        assignedNotification(customer.fcmToken, driverDetails);
        const orderData = await Booking.findById(orderDetails._id).exec();
        const forDriver = {
          message: "Reached Pickup",
          bookingId: orderDetails.Id,
          orderId: orderDetails.bookingId,
          customerName: orderDetails.customer.name,
          customerPhoneNumber: orderDetails.customer.mobNo,
          amount: orderDetails.paymentDetails.amount.toFixed(0),
          paymentType: orderDetails.paymentDetails.paymentType,
          pickupPoint: {
            location: orderDetails.mainAddress.pickupPoint.location,
            lat: orderDetails.mainAddress.pickupPoint.lat,
            lng: orderDetails.mainAddress.pickupPoint.lan,
          },
        };

        const forCustomer = {
          orderId: orderDetails.Id,
          otp: otp,
          bookingId: orderDetails.bookingId,
          profileImage: driverDetails.personalDetails.profileImg,
          amount: orderDetails.paymentDetails.amount.toFixed(0),
          paymentType: orderDetails.paymentDetails.paymentType,
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
          alreadyAssign: false,
          bookingId: orderDetails.Id,
          fcmToken: driverDetails.fcmToken,
          orderId: orderDetails.Id, // orderDetails._id,
          driverId: driverDetails._id,
          driverLocation: driverDetails.currentLocation,
          customer: orderDetails.customerId,
          forDriver: forDriver,
          forCustomer: forCustomer,
          forAdmin: orderData,
        };
        willEnter = true;
        return data;
      } else {
        let data = {
          bookingId: orderDetails.Id,
          driver: driverId,
          alreadyAssign: true,
        };
        return data;
      }
    } catch (err) {
      console.log(err);
    }
  },

  // comfirmation order
  comfirmation: async (driverId, orderId) => {
    // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", orderId);
    const orderDetails = await Booking.findOne({ Id: orderId }).exec();

    if (orderDetails) {
      if (orderDetails.driverId === driverId) {
        const driver = await Driver.findById(orderDetails.driverId).exec();
        const customer = await Customers.findById(
          orderDetails.customerId
        ).exec();
        if (driver && customer) {
          let customerId = customer.cutomerID.split("");
          let driverId = driver.driverId.split("");
          let bookingId = orderDetails.bookingId.split("");
          let otp =
            customerId[customerId.length - 1] +
            customerId[customerId.length - 2] +
            driverId[driverId.length - 2] +
            driverId[driverId.length - 1] +
            bookingId[bookingId.length - 1];

          return {
            bookingId: orderDetails.Id,
            driverId: driver._id,
            customerId: customer._id,
            otp: otp,
          };
        } else {
          return "something went wrong";
        }
      } else {
        return "this driver not corret";
      }
    } else {
      return "not found order details";
    }
  },

  // get driver current location

  driverLocation: async (orderId) => {
    // console.log(orderId);
    try {
      let order = await Booking.findOne({ Id: orderId }).exec();

      // console.log(order);
      if (order) {
        const driver = await Driver.findById(order.driverId).exec();
        if (driver) {
          if (order.status === "Assigned" || order.status === "Confirming") {
            let location = {
              bookingId: order.Id,
              driverId: driver._id,
              customerId: order.customerId,
              lat: driver.currentLocation.lat,
              lng: driver.currentLocation.lng,
              pickupPoint: order.mainAddress.pickupPoint,
              dropPoint: null,
              stop1: null,
              stop2: null,
            };
            return location;
          } else if (
            order.status === "Ongoing" ||
            order.trakingStatus === "stop1Available" ||
            order.trakingStatus === "stop1Completed"
          ) {
            let location = {
              bookingId: order.Id,
              driverId: driver._id,
              customerId: order.customerId,
              lat: driver.currentLocation.lat,
              lng: driver.currentLocation.lng,
              pickupPoint: order.mainAddress.pickupPoint,
              dropPoint: order.mainAddress.dropPoint.location
                ? order.mainAddress.dropPoint
                : null,
              stop1: order.address2.location ? order.address2 : null,
              stop2: order.address3.location ? order.address3 : null,
            };
            return location;
          } else if (
            order.status === "Ongoing" &&
            order.trakingStatus === "stopNotAvailable"
          ) {
            let location = {
              bookingId: order.Id,
              driverId: driver._id,
              customerId: order.customerId,
              lat: driver.currentLocation.lat,
              lng: driver.currentLocation.lng,
              pickupPoint: order.mainAddress.pickupPoint,
              dropPoint: order.mainAddress.dropPoint,
              stop1: null,
              stop2: null,
            };
            return location;
          }
        } else {
          console.log("driver not found");
        }
      } else {
        console.log("order not exist");
      }
    } catch (err) {
      console.log(err);
    }
  },

  reachedPickupPoint: async (bookingId, isAdmin, comment, adminName) => {
    try {
      // console.log(bookingId,"kkkkkkkkkkkkkkkkkkkkkk");
      const checkOrder = await Booking.findOne({ Id: bookingId }).exec();
      // console.log(checkOrder.status);
      // console.log(checkOrder);

      if (checkOrder && checkOrder.status != "Assigned") {
        console.log("reached not assigned");
        return;
      }
      if (isAdmin) {
        await Booking.findOneAndUpdate(
          { Id: bookingId },
          {
            status: "Confirming",
            trakingStatus: "Confirming",
            $push: {
              csNotes: {
                admin: adminName,
                dateAndTime: todayDate() + " " + formatAMPM(new Date()),
                comment: "Ongoing:)" + comment,
              },
            },
          }
        );
      } else {
        await Booking.findOneAndUpdate(
          { Id: bookingId },
          {
            status: "Confirming",
            trakingStatus: "Confirming",
          }
        ).exec();
      }

      const order = await Booking.findOne({ Id: bookingId }).exec();
      if (order) {
        reachedPickupNotification(order.userFcmToken, order.otp);
        let data = {
          message: "Picked",
          driverId: order.driverId,
          order: order,
        };
        return data;
      }
    } catch (err) {
      console.log(err, "err at reachedPickupPoint");
    }
  },

  ongoing: async (bookingId, isAdmin, comment, adminName) => {
    console.log("ongoooooooooooooooooooooooooing ///////////////////");
    try {
      const checkOrder = await Booking.findOne({ Id: bookingId }).exec();
      // console.log(checkOrder);
      // console.log(bookingId);

      if (checkOrder && checkOrder.status != "Confirming") {
        return;
      }
      if (isAdmin) {
        await Booking.findOneAndUpdate(
          { Id: bookingId },
          {
            status: "Ongoing",
            // trakingStatus:"Ongoing",
            $push: {
              csNotes: {
                admin: adminName,
                dateAndTime: todayDate() + " " + formatAMPM(new Date()),
                comment: "Ongoing:)" + comment,
              },
            },
          }
        );
      } else {
        await Booking.findOneAndUpdate(
          { Id: bookingId },
          {
            status: "Ongoing",
            // trakingStatus:"Ongoing",
          }
        ).exec();
      }
      const order = await Booking.findOne({ Id: bookingId }).exec();
      if (order) {
        // console.log(order);
        return order;
      }
    } catch (err) {
      console.log(err, "err at ongoing");
    }
  },

  completed: async (bookingId, isAdmin, comment) => {
    try {
      const details = await Booking.findOne({ Id: bookingId }).exec();
      if (details.status === "Completed") return;
      if (isAdmin) {
        await Booking.findOneAndUpdate(
          { Id: bookingId },
          {
            status: "Completed",
            trakingStatus: "Completed",
            $push: {
              csNotes: {
                admin: "Admin",
                dateAndTime: todayDate() + " " + formatAMPM(new Date()),
                comment: "Completed:)" + comment,
              },
            },
          }
        );
      } else {
        await Booking.findOneAndUpdate(
          { Id: bookingId },
          {
            status: "Completed",
            trakingStatus: "Completed",
          }
        ).exec();
      }

      // if(details.appliedCoupon){
      //   await Customers.findByIdAndUpdate(details.customerId, {
      //     $push : {
      //       appliedCoupons : details.promoCodeDetails.id
      //     }
      //   }).exec()
      // }

      const order = await Booking.findOne({ Id: bookingId }).exec();
      if (order) {
        await Driver.findByIdAndUpdate(order.driverId, {
          onOrder: false,
        }).exec();
        let rate = await Commision.findById("62d13db74ac2561522fd5218").exec();

        let commision = (order.paymentDetails.amount * rate.rate) / 100;
        let earnings = order.paymentDetails.amount - commision;
        if (order.paymentDetails.paymentType === "Wallet") {
          const update = await Driver.findOneAndUpdate(
            { _id: order.driverId },
            {
              $inc: {
                wallet: order.paymentDetails.amount,
              },
            },
            { new: true }
          ).exec();
          if (update) {
            const driver = await Driver.findById(order.driverId).exec();
            // setup walletlogs id with database HelperCollection

            // is exist customer
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
            const addComment = await Driver.findByIdAndUpdate(order.driverId, {
              $push: {
                walletlogs: {
                  walletlogid: walletlogID,
                  transactionBy: "From Order",
                  holder:
                    driver.personalDetails.firstName +
                    " " +
                    driver.personalDetails.lastName,
                  amount: order.paymentDetails.amount,
                  comment: `For Order : ${order.bookingId}`,
                  transactionType: "Credited",
                  dateAndTime: todayDate() + " " + formatAMPM(new Date()),
                },
              },
            }).exec();
          }

          const update1 = await Driver.findOneAndUpdate(
            { _id: order.driverId },
            {
              $inc: {
                wallet: -commision,
              },
            },
            { new: true }
          ).exec();
          if (update1) {
            const driver = await Driver.findById(order.driverId).exec();
            // setup walletlogs id with database HelperCollection

            // is exist customer
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
            const addComment = await Driver.findByIdAndUpdate(order.driverId, {
              $push: {
                walletlogs: {
                  walletlogid: walletlogID,
                  transactionBy: "Commision",
                  holder:
                    driver.personalDetails.firstName +
                    " " +
                    driver.personalDetails.lastName,
                  amount: commision,
                  comment: `Admin Charges for Order : ${order.bookingId}`,
                  transactionType: "Debited",
                  dateAndTime: todayDate() + " " + formatAMPM(new Date()),
                },
              },
            }).exec();

            // updateBooking

            await Booking.findByIdAndUpdate(order._id, {
              amountAfterCommision: earnings,
              commisionAmount: commision,
            }).exec();
          }
          await Driver.findByIdAndUpdate(order.driverId, {
            $inc: {
              completedRides: 1,
            },
          }).exec();

          await Customers.findByIdAndUpdate(order.customerId, {
            $inc: {
              orders: 1,
            },
          }).exec();
        } else if (order.paymentDetails.paymentType === "Cash") {
          // const update = await Driver.findByIdAndUpdate(order.driverId, {
          //   $push: {
          //     completedOrders: {
          //       bookingId: order._id,
          //       amount: order.paymentDetails.amount,
          //       paymentType: order.paymentDetails.paymentType,
          //       commision: commision,
          //       date: order.bookingDate,
          //     },
          //   },
          //   $inc: {
          //     completedRides: 1,
          //     totalAmount: order.paymentDetails.amount,
          //   },
          // });

          const update1 = await Driver.findOneAndUpdate(
            { _id: order.driverId },
            {
              $inc: {
                wallet: -commision,
              },
            },
            { new: true }
          ).exec();
          if (update1) {
            const driver = await Driver.findById(order.driverId).exec();
            // setup walletlogs id with database HelperCollection

            // is exist customer
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
            const addComment = await Driver.findByIdAndUpdate(order.driverId, {
              $push: {
                walletlogs: {
                  walletlogid: walletlogID,
                  transactionBy: "Commision",
                  holder: driver.firstName + " " + driver.lastName,
                  amount: commision,
                  comment: `Admin Charges for Order : ${order.bookingId}`,
                  transactionType: "Debited",
                  dateAndTime: todayDate() + " " + formatAMPM(new Date()),
                },
              },
            }).exec();

            // updateBooking
            await Booking.findByIdAndUpdate(order._id, {
              amountAfterCommision: earnings,
              commisionAmount: commision,
            }).exec();
          }

          await Driver.findByIdAndUpdate(order.driverId, {
            $inc: {
              completedRides: 1,
            },
          }).exec();

          await Customers.findByIdAndUpdate(order.customerId, {
            $inc: {
              orders: 1,
            },
          }).exec();
        }
        console.log("order");
        console.log(order);

        return order;
      }
    } catch (err) {
      console.log(err, "err at completed");
    }
  },

  cancelOrder: async (bookingId, comment, admin, subadmin) => {
    try {
      var today = todayDate();
      var currentTime = formatAMPM(new Date());
     
      const order1 = await Booking.findOne({ Id: bookingId });
      if (order1.status != "Expired") {
        if (admin || subadmin) {
          const order = await Booking.findOneAndUpdate(
            { Id: bookingId },
            {
              status: "Cancel",
              $push: {
                csNotes: {
                  admin: admin ? admin : subadmin,
                  comment: "cancel :) " + comment,
                  dateAndTime: today + " " + currentTime,
                },
              },
            }
          ).exec();
          if (order1.driverId) {
            await Driver.findByIdAndUpdate(order1.driverId, {
              onOrder: false,
            }).exec();
          }
          if (order) {
            if (order.paymentDetails.paymentType === "Wallet") {
              let customerId = order.customerId;
              Customers.findOneAndUpdate(
                { _id: customerId },
                {
                  $inc: {
                    wallet: parseInt(order.paymentDetails.amount.toFixed(0)),
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

                  await Customers.findByIdAndUpdate(customerId, {
                    $push: {
                      walletlogs: {
                        walletlogid: walletlogID,
                        transactionBy: "Refund Money",
                        holder: customer.firstName + " " + customer.lastName,
                        amount: parseInt(
                          order.paymentDetails.amount.toFixed(0)
                        ),
                        comment: `Refund Order : ${order.bookingId}`,
                        transactionType: "Credited",
                        dateAndTime: today + " " + currentTime,
                      },
                    },
                  }).exec();
                } else {
                  console.log(err);
                  // res.json({
                  //   message: 'payment failed',
                  //   amount: result.TXNAMOUNT,
                  //   status: result.STATUS,
                  // });
                }
              });
            }
            const order2 = await Booking.findOne({ Id: bookingId }).exec();
            return order2;
          }
        } else {
          const order = await Booking.findOneAndUpdate(
            { Id: bookingId },
            {
              status: "Cancel",
              $push: {
                csNotes: {
                  admin: "User",
                  comment: "cancel :) " + comment,
                  dateAndTime: today + " " + currentTime,
                },
              },
            }
          ).exec();
          //////////////
          if (order1.driverId) {
            await Driver.findByIdAndUpdate(order1.driverId, {
              onOrder: false,
            }).exec();
          }
          if (order) {
            if (order.paymentDetails.paymentType === "Wallet") {
              let customerId = order.customerId;
              Customers.findOneAndUpdate(
                { _id: customerId },
                {
                  $inc: {
                    wallet: parseInt(order.paymentDetails.amount.toFixed(0)),
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

                  await Customers.findByIdAndUpdate(customerId, {
                    $push: {
                      walletlogs: {
                        walletlogid: walletlogID,
                        transactionBy: "Refund Money",
                        holder: customer.firstName + " " + customer.lastName,
                        amount: parseInt(
                          order.paymentDetails.amount.toFixed(0)
                        ),
                        comment: `Refund Order : ${order.bookingId}`,
                        transactionType: "Credited",
                        dateAndTime: today + " " + currentTime,
                      },
                    },
                  }).exec();
                } else {
                  console.log(err);
                  // res.json({
                  //   message: 'payment failed',
                  //   amount: result.TXNAMOUNT,
                  //   status: result.STATUS,
                  // });
                }
              });
            }
            const order2 = await Booking.findOne({ Id: bookingId });
            return order2;
          }
          //const order = await Booking.findById(bookingId).exec();
        }
      } else {
        console.log("already expired .....");
      }
    } catch (err) {
      console.log(err, "err at cancelOrder");
    }
  },

  expireOrder: async (bookingId) => {
    try {
     
      let checkStatus = await Booking.findOne({ Id: bookingId });
      if (
        checkStatus &&
        checkStatus.status &&
        checkStatus.status === "Assigning"
      ) {
        await Booking.findOneAndUpdate(
          { Id: bookingId },
          {
            status: "Expired",
          }
        ).exec();
        const expiredOrder = await Booking.findOne({ Id: bookingId }).exec();
        if (expiredOrder) {
          console.log("ok");
          return expiredOrder;
        }
      }
    } catch (err) {
      console.log(err);
    }
  },
};
