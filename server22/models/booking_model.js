const mongoose = require("mongoose");
require("mongoose-double")(mongoose);
const csnoteSchema = mongoose.Schema({
  admin: {
    type: String,
    default:"User"
  },
  comment: {
    type: String,
  },
  dateAndTime: {
    type: String,
  },
});
const stopScheama = mongoose.Schema({
  total: {
    type: Number,
    default: 2,
  },
  data: [],
});

const diversSchema = mongoose.Schema({
  driverId: {
    type: String,
  },
  lat: {
    type: mongoose.Schema.Types.Double,
  },
  lng: {
    type: mongoose.Schema.Types.Double,
  },
});

const oldDriversDetailsSchema = mongoose.Schema({
  name : {
    type : String,
    required : true
  },
  mob : {
    type : String,
    required : true
  }
})

const promoCodeDetailsSchema = mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  off: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
});
const bookingSchema = mongoose.Schema(
  {
    Id : {
      type : String,
      default : ''
    },
    customerId: {
      type: String,
      required: true,
    },
    driverId: {
      type: String, //mongoose.Schema.Types.ObjectId, // String, //mongoose.Schema.Types.ObjectId
      default: "",
    },
    bookingId: {
      type: String,
      required: true,
    },
    fcmToken: {
      type: String,
      default: "",
    },
    place:{
      type: String,
      required:true
    },
    userFcmToken: {
      type: String,
      default: "",
    },
    otp: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Assigning",
    },
    actualOrder : {
      type : Boolean,
      default : true
    },
    reassinging: {
      type: Boolean,
      default: false,
    },
    trakingStatus: {
      type: String,
      default: "assigning",
    },
    stops: stopScheama,
    acceptOrder: {
      type: Boolean,
      default: false,
    },
    customer: {
      name: {
        type: String,
        required: true,
      },
      mobNo: {
        type: String,
        required: true,
      },
    },
    mainAddress: {
      pickupPoint: {
        location: {
          type: String,
          required: true,
        },
        lan: {
          type: Number,
          required: true,
        },
        lat: {
          type: Number,
          required: true,
        },
        name: {
          type: String,
          default: "",
        },
        phoneNumber: {
          type: String,
          default: "",
        },
      },
      dropPoint: {
        location: {
          type: String,
          default : '',
        },
        lan: {
          type: Number,
          default : '',
        },
        lat: {
          type: Number,
          default : "",
        },
        name: {
          type: String,
          default: "",
        },
        phoneNumber: {
          type: String,
          default: "",
        },
      },
    },
    address2: {
      location: {
        type: String,
        default: "",
      },
      lan: {
        type: Number,
        default: "",
      },
      lat: {
        type: Number,
        default: "",
      },
      name: {
        type: String,
        default: "",
      },
      phoneNumber: {
        type: String,
        default: "",
      },
    },
    address3: {
      location: {
        type: String,
        default: "",
      },
      lan: {
        type: Number,
        default: "",
      },
      lat: {
        type: Number,
        default: "",
      },
      name: {
        type: String,
        default: "",
      },
      phoneNumber: {
        type: String,
        default: "",
      },
    },
    paymentDetails: {
      amount: {
        type: Number,
        required: true,
      },
      paymentType: {
        type: String,
        required: true,
      },
      extraCharge : {
        type : Number,
        default : 0
      },
      nightSurge : {
        type : Number,
        default : 0
      },
      oldAmount : {
        type : Number,


	default : 0
        


      }
    },
    promoCodeDetails: promoCodeDetailsSchema,
    vehicleType: {
      type: String,
      required: true,
    },
    subType: {
      type: String,
      required: true,
    },
    driverDetails: {
      name: {
        type: String,
        default: "",
      },
      mobNo: {
        type: String,
        default: "",
      },
    },
    comment: {
      type: String,
      default: "",
    },
    amountAfterCommision : {
      type : Number,
      default : 0
    },
    commisionAmount : {
      type : Number,
      default : 0
    },
    bookingDate: {
      type: String,
      required: true,
    },
    startingTime: {
      type: String,
    },
    unAssignCancel: {
      type: String,
      default: "assign",
    },
    csNotes: [csnoteSchema],
	  isCompleted:{
     type:Boolean,
     default:false
    },
    searchNextRadius: {
      type: Number,
      default: 2.5,
    },
    nearestDrivers: [diversSchema],
    appliedCoupon : {
      type : Boolean,
      default : false
    },
	isCompleted:{
     type:Boolean,
     default:false
    },  
    rent : {
      type : Boolean,
      default : false
    },isCompleted:{
     type:Boolean,
     default:false
    },

    isCompleted:{

     type:Boolean,
     default:false
    },
    rated : {
      type : Boolean,
      default : false
    },
    oldDrivers : [],
    oldDriversFcm : [],
    oldDriversDetails :[oldDriversDetailsSchema]
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
