const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const csnoteSchema = mongoose.Schema({
  admin: {
    type: String,
  },
  comment: {
    type: String,
  },
  dateAndTime: {
    type: String,
  },
});

const walletlogsSchema = mongoose.Schema({
  walletlogid: {
    type: String,
    required: true,
  },
  transactionBy: {
    type: String,
    required: true,
  },
  holder: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  transactionType: {
    type: String,
    required: true,
  },
  dateAndTime: {
    type: String,
    required: true,
  },
});

const coinHistorySchema = mongoose.Schema(
  {
    date :{
      type : String,
      required : true
    },
    status : {
      type : String,
      required : true
    },
    details : {
      type : String,
      required : true
    },
    coins : {
      type : Number,
      required  :true
    }
  }
)


const customerSchema = mongoose.Schema(
  {
    cutomerID: {
      type: String,
      required: true,

    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    fcmToken: {
      type: String,
      required:true
    },
    email: {
      type: String,
      requirde: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    gstNo: {
      type: String,
      default: 0,
    },
    wallet: {
      type: Number,
      default: 0,
    },
    place:{
      type: String,
      required:true
    },
    walletlogs: [walletlogsSchema],
    orders: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    csnote: [csnoteSchema],
    
    isBlock: {
      type: Boolean,
      default: false,
    },
    placedOrders : {
      type : Number, 
      default : 0
    },
    dateAndTime: {
      type: String,
      required: true,
    },
    place : {
      type : String,
      required : true
    },
    coins : {
      type : Number,
      default : 0
    },
    coinHistory : [coinHistorySchema],
    appliedCoupons : []
  },
  { timestamps: true }
);

customerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Customers = mongoose.model('Customers', customerSchema);
module.exports = Customers;
