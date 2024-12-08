const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin_model');
const Customers = require('../models/customer_model');
const Driver = require('../models/driver_model');
const SubAdmin = require('../models/sub-admin_model');

module.exports = {
  // @desc Admin Protection Middleware
  adminProtect: asyncHandler(async (req, res, next) => {
 
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
         req.admin = await Admin.findById(decoded.id).select('-password');
        if (req.admin) {
         
          next();
        } else {
          res.status(401);
          throw new Error('Not Authorized, token failed');
        }
      } catch (error) {
        res.status(401);
        throw new Error('Not Authorized, token failed');
      }
    }

    if (!token) {
      res.status(401);
      throw new Error('Not Authorized, token failed');
    }
  }),

  // @desc Driver Protection Middleware
  driverProtect: asyncHandler(async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.driver = await Driver.findById(decoded.id).select('-password');
        if (req.driver) {
          next();
        } else {
          res.status(401);
          throw new Error('Not Authorized, token failed');
        }
      } catch (error) {
        res.status(401);
        throw new Error('Not Authorized, token failed');
      }
    }

    if (!token) {
      res.status(401);
      throw new Error('Not Authorized, token failed');
    }
  }),

  // @desc Customer Protection Middleware
  customerProtect: asyncHandler(async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.customer = await Customers.findById(decoded.id).select('-password');
        if (req.customer) {
          next();
        } else {
          res.status(401);
          throw new Error('Not Authorized, token failed');
        }
      } catch (error) {
        res.status(401);
        throw new Error('Not Authorized, token failed');
      }
    }

    if (!token) {
      res.status(401);
      throw new Error('Not Authorized, token failed');
    }
  }),

  // @desc SubAdmin Protection Middleware
  subAdminProtect: asyncHandler(async (req, res, next) => {

   
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        token = req.headers.authorization.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.subAdmin = await SubAdmin.findById(decoded.id).select('-password');

        if (req.subAdmin) {
          next();
        } else {
          res.status(401);
          throw new Error('Not Authorized, token failed');
        }
      } catch (error) {
        res.status(401);
        throw new Error('Not Authorized, token failed');
      }
    }

    if (!token) {
      res.status(401);
      throw new Error('Not Authorized, token failed');
    }
  }),

  // @desc check driver or customer
  check_customerOrDriver: asyncHandler(async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        token = req.headers.authorization.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.customer = await Customers.findById(decoded.id).select('-password');
        if (req.customer) {
          next();
        } else {
          req.driver = await Driver.findById(decoded.id).select('-password');
          if (req.driver) {
            next();
          } else {
            res.status(401);
            throw new Error('Not Authorized, token failed');
          }
        }
      } catch (error) {
        res.status(401);
        throw new Error('Not Authorized, token failed');
      }
    }

    if (!token) {
      res.status(401);
      throw new Error('Not Authorized, token failed');
    }
  }),
};
