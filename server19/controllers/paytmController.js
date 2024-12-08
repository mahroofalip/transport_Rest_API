const asyncHandler = require('express-async-handler');
const PaytmChecksum = require('../paytm/paytmChecksum');
const { v4 } = require('uuid');
const uuidv4 = v4;
const https = require('https');
const Driver = require('../models/driver_model');
const Customers = require('../models/customer_model');
const HelperCollection = require('../models/helper_model');
const TransactionHistory = require('../models/paytm_transaction_history_model');
const moment = require("moment");

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
  var ampm = hoursIST2 >= 12 ? 'PM' : 'AM';
  minutesIST = minutesIST < 10 ? '0' + minutesIST : minutesIST;
  secondsIST = secondsIST < 10 ? '0' + secondsIST : secondsIST;
  var str = hoursIST + ':' + minutesIST + ':' + secondsIST + ' ' + ampm;
  return str;
}

// get today date
function todayDate() {
  // get Current Date
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  today = dd + '/' + mm + '/' + yyyy;
  return today;
}

module.exports = {
  // @desc paytm amount come here
  // @router POST /api/driver/paytm-payment
  // @access PRIVATE
  paytmPayment: asyncHandler(async (req, res) => {
    try {
      const { id, amount } = req.body;
      let date = moment(new Date()).format('DD/MM/YYYY hh:mm:ss a')
      if (req.driver) {
        const driver = await Driver.findById(id).exec();
        if (driver) {
          var params = {};
          const totalAmount = JSON.stringify(amount);

          /* initialize an array */
          (params['MID'] = process.env.MID),
            (params['WEBSITE'] = process.env.WEBSITE),
            (params['CHANNEL_ID'] = process.env.CHANNEL_ID),
            (params['INDUSTRY_TYPE_ID'] = process.env.INDUSTRY_TYPE),
            (params['ORDER_ID'] = uuidv4()),
            (params['CUST_ID'] = id),
            (params['TXN_AMOUNT'] = totalAmount),
            (params['CALLBACK_URL'] =
              'https://securegw.paytm.in/theia/paytmCallback?ORDER_ID='),
              //  'https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID='),
            (params['MOBILE_NO'] = driver.personalDetails.defaultPhoneNumber);

          /**
           * Generate checksum by parameters we have
           * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
           */
          var paytmChecksum = PaytmChecksum.generateSignature(
            params,
            process.env.MERCHANT_KEY
          );
          paytmChecksum
            .then(async function (checksum) {
              let paytmParams = {
                ...params,
                CHECKSUMHASH: checksum,
              };

              const txnLen = await TransactionHistory.count()
              // write here transaction history attempting users>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
              const addTransaction = await TransactionHistory.create({
                userId: paytmParams.CUST_ID,
                userType: "Driver",
                Id: `LRNR-TXN_ID${txnLen + 1}`,
                user_id: req.driver.driverId,
                name: req.driver.personalDetails.firstName + " " + req.driver.personalDetails.lastName,
                phoneNumber: paytmParams.MOBILE_NO,
                amount: paytmParams.TXN_AMOUNT,
                order_id: paytmParams.ORDER_ID,
                dateAndTime: date,
                status: "Pending"
              })

              if (addTransaction) {
                res.status(200);
                res.json(paytmParams);
              }
            })
            .catch(function (error) {
              console.log(error);
            });
        } else {
          res.status(400);
          throw new Error('not found driver');
        }
      } else if (req.customer) {
        const customer = await Customers.findById(id).exec();
        if (customer) {
          var params = {};
          const totalAmount = JSON.stringify(amount);

          /* initialize an array */
          (params['MID'] = process.env.MID),
            (params['WEBSITE'] = process.env.WEBSITE),
            (params['CHANNEL_ID'] = process.env.CHANNEL_ID),
            (params['INDUSTRY_TYPE_ID'] = process.env.INDUSTRY_TYPE),
            (params['ORDER_ID'] = uuidv4()),
            (params['CUST_ID'] = id),
            (params['TXN_AMOUNT'] = totalAmount),
            (params['CALLBACK_URL'] =
              'https://securegw.paytm.in/theia/paytmCallback?ORDER_ID='),
              // 'https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID='),
            (params['MOBILE_NO'] = customer.phoneNumber);

          /**
           * Generate checksum by parameters we have
           * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
           */
          var paytmChecksum = PaytmChecksum.generateSignature(
            params,
            process.env.MERCHANT_KEY
          );
          paytmChecksum
            .then(async function (checksum) {
              let paytmParams = {
                ...params,
                CHECKSUMHASH: checksum,
              };
              // write here transaction history attempting users>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
              const txnLen = await TransactionHistory.count()
              const addTransaction = await TransactionHistory.create({
                userId: paytmParams.CUST_ID,
                userType: "Customer",
                Id: `LRNR-TXN_ID${txnLen + 1}`,
                user_id: req.customer.cutomerID,
                name: req.customer.firstName + " " + req.customer.lastName,
                phoneNumber: paytmParams.MOBILE_NO,
                amount: paytmParams.TXN_AMOUNT,
                order_id: paytmParams.ORDER_ID,
                dateAndTime: date,
                status: "Pending"
              })

              if (addTransaction) {
                res.status(200);
                res.json(paytmParams);
              }

            })
            .catch(function (error) {
              console.log(error);
            });
        } else {
          res.status(400);
          throw new Error('not found driver');
        }
      }
    } catch (err) {
      console.log(err);
    }
  }),

  // @desc paytm payment verify
  // @router POST /api/driver/paytm-verify
  // @access PRIVATE

  verifypayment: asyncHandler(async (req, res) => {
    try {
      // console.log(req.body);
      var today = todayDate();
      var currentTime = formatAMPM(new Date());
      /* checksum that we need to verify */
      var paytmChecksum = req.body.CHECKSUMHASH;
      delete req.body.CHECKSUMHASH;

      var isVerifySignature = PaytmChecksum.verifySignature(
        req.body,
        process.env.MERCHANT_KEY,
        paytmChecksum
      );
      if (isVerifySignature) {
        var paytmParams = {};
        paytmParams['MID'] = req.body.MID;
        paytmParams['ORDERID'] = req.body.ORDERID;

        /*
         * Generate checksum by parameters we have
         * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
         */
        PaytmChecksum.generateSignature(
          paytmParams,
          process.env.MERCHANT_KEY
        ).then(function (checksum) {
          paytmParams['CHECKSUMHASH'] = checksum;

          var post_data = JSON.stringify(paytmParams);

          var options = {
            /* for Staging */
            //  hostname: 'securegw-stage.paytm.in',

            /* for Production */
           hostname: 'securegw.paytm.in',

            port: 443,
            path: '/order/status',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': post_data.length,
            },
          };

          var response = '';
          var post_req = https.request(options, async function (post_res) {
            post_res.on('data', function (chunk) {
              response += chunk;
            });

            post_res.on('end', async function () {
              let result = JSON.parse(response);

              if (result.STATUS === 'TXN_SUCCESS') {
                const amount = parseInt(result.TXNAMOUNT);
                // store database
                if (req.customer) {
                  // customer model

                  Customers.findOneAndUpdate(
                    { _id: req.customer._id },
                    {
                      $inc: {
                        wallet: amount,
                      },
                    },
                    { new: true }
                  ).exec(async (err, done) => {
                    if (!err) {
                      const customer = await Customers.findById(
                        req.customer._id
                      ).exec();
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

                      Customers.findByIdAndUpdate(req.customer._id, {
                        $push: {
                          walletlogs: {
                            walletlogid: walletlogID,
                            transactionBy:
                              customer.firstName + ' ' + customer.lastName,
                            holder:
                              customer.firstName + ' ' + customer.lastName,
                            amount: amount,
                            comment: 'Money added to wallet',
                            transactionType: 'Credited',
                            dateAndTime: today + ' ' + currentTime,
                          },
                        },
                      }).exec((err, done) => {
                        if (!err) {


                          // write here transaction history successfully completed  users>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

                          res.status(200);
                          res.json({
                            message: 'payment success',
                            amount: result.TXNAMOUNT,
                            status: result.STATUS,
                          });
                        } else {
                          res.status(400);
                          throw new Error(err);
                        }
                      });
                    } else {
                      console.log(err);
                      res.json({
                        message: 'payment failed',
                        amount: result.TXNAMOUNT,
                        status: result.STATUS,
                      });
                    }
                  });
                } else if (req.driver) {
                  // driver model
                  Driver.findOneAndUpdate(
                    { _id: req.driver._id },
                    {
                      $inc: {
                        wallet: amount,
                      },
                    },
                    { new: true }
                  ).exec(async (err, done) => {
                    if (!err) {
                      const driver = await Driver.findById(
                        req.driver._id
                      ).exec();
                      // setup walletlogs id with database HelperCollection

                      // is exist customer
                      const isExist = await HelperCollection.findOne({
                        walletlogsid: req.driver._id,
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
                          walletlogsid: req.driver._id,
                          count: 1,
                        });
                        var walletlogID = 1;
                      }
                      // res.json({ isExist: isExist, id: customer._id });
                      Driver.findByIdAndUpdate(driver._id, {
                        $push: {
                          walletlogs: {
                            walletlogid: walletlogID,
                            transactionBy:
                              driver.personalDetails.firstName +
                              ' ' +
                              driver.personalDetails.lastName,
                            amount: amount,
                            comment: 'Money added to wallet',
                            transactionType: 'Credited',
                            dateAndTime: today + ' ' + currentTime,
                          },
                        },
                      }).exec((err, done) => {
                        if (!err) {
                          // write here transaction history successfully completed  users>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

                          res.status(200);
                          res.json({
                            message: 'payment success',
                            amount: result.TXNAMOUNT,
                            status: result.STATUS,
                          });
                        } else {
                          console.log(err);
                        }
                      });
                    } else {
                      res.json({
                        message: err,
                        amount: result.TXNAMOUNT,
                        status: result.STATUS,
                      });
                    }
                  });
                }
                if (result.STATUS === "TXN_SUCCESS") {
                  let date = moment(new Date(result.TXNDATE)).format("DD/MM/YYYY hh:mm:ss a")
                  console.log({ date1: result.TXNDATE, date });
                  await TransactionHistory.findOneAndUpdate({
                    order_id: result.ORDERID
                  }, {
                    txn_id: result.TXNID,
                    status: "Success",
                    dateAndTime: date
                  }).exec()
                }
              }
            });
          });

          post_req.write(post_data);
          post_req.end();
        });
      } else {
        if (req.body.STATUS === 'TXN_FAILURE') {

          let date = moment(new Date(req.body.TXNDATE)).format("DD/MM/YYYY hh:mm:ss a")
          await TransactionHistory.findOneAndUpdate({
            order_id: req.body.ORDERID
          }, {
            txn_id: req.body.TXNID,
            dateAndTime: date,
            status: "Failed"
          }).exec()
          res.json({
            message: req.body.errorMessage,
            amount: req.body.TXNAMOUNT,
            status: req.body.STATUS,
          });
        }
      }
    } catch (err) {
      res.status(400);
      throw new Error(err);
    }
  }),

  // @desc generateTXN token for paytm
  // POST /api/driver/generateTxnToken
  //

  generateTxnToken: asyncHandler(async (req, res) => {
    try {
      const { ORDERID, TXN_AMOUNT, CUST_ID, CALLBACK_URL, MID, WEBSITE } =
        req.body;
      var paytmParams = {};

      paytmParams.body = {
        requestType: 'Payment',
        mid: MID,
        websiteName: WEBSITE,
        orderId: ORDERID,
        callbackUrl: CALLBACK_URL,
        txnAmount: {
          value: TXN_AMOUNT,
          currency: 'INR',
        },
        userInfo: {
          custId: CUST_ID,
        },
      };

      /*
       * Generate checksum by parameters we have in body
       * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
       */
      PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        process.env.MERCHANT_KEY
      ).then(function (checksum) {
        paytmParams.head = {
          signature: checksum,
        };

        var post_data = JSON.stringify(paytmParams);

        var options = {
          /* for Staging */
          // hostname: 'securegw-stage.paytm.in',

          /* for Production */
          hostname: 'securegw.paytm.in',

          port: 443,
          path: `/theia/api/v1/initiateTransaction?mid=${MID}&orderId=${ORDERID}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length,
          },
        };

        var response = '';
        var post_req = https.request(options, function (post_res) {
          post_res.on('data', function (chunk) {
            response += chunk;
          });

          post_res.on('end', function () {

            const resp = JSON.parse(response);

            res.json({
              txn_token: resp.body.txnToken,
            });
          });
        });

        post_req.write(post_data);
        post_req.end();
      });
    } catch (err) {
      console.log({ err: err });
    }
  }),

  // failedPayment: asyncHandler(async (req, res) => {
  //   try {

  //     const { PaymentOrderId, id } = req.body
  //     let date = moment(new Date()).format("DD/MM/YYYY hh:mm:ss a")
  //     await TransactionHistory.findOneAndUpdate({
  //       userId: id,
  //       order_id: PaymentOrderId
  //     }, {
  //       dateAndTime: date,
  //       status: "Failed"
  //     }).exec()
  //   } catch (error) {
  //     res.status(400)
  //     throw new Error("Something went wrong!..")
  //   }
  // })

  failedPayment: asyncHandler(async (req, res) => {
    try {

      const { PaymentOrderId, id } = req.body
      let date = moment(new Date()).format("DD/MM/YYYY hh:mm:ss a")
      await TransactionHistory.findOneAndUpdate({
        userId: id,
        order_id: PaymentOrderId
      }, {
        dateAndTime: date,
        status: "Failed"
      }).exec()
    } catch (error) {
      res.status(400)
      throw new Error("Something went wrong!..")
    }
  })
};
