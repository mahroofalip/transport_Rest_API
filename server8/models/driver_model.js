const mongoose = require('mongoose');
require('mongoose-double')(mongoose);

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, default: '' },
    id: {
      type: String,
      required: true
    },
    orderId: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

const vehicleDetailsSchema = mongoose.Schema({
  // vehicleType_1 : {
  //   type : String,
  //   default : ''
  // },
  vehicleType: {
    type: String,
    required: true,
  },
  // subType_1 : {
  //   type : String,
  //   default : ''
  // },
  subType: {
    type: String,
    required: true,
  },
  // rcBookImg_1 : {
  //   type : String,
  //   default : ''
  // },
  rcBookImg: {
    type: String,
    required: true,
  },
  // rcBookImg_id_1 : {
  //   type : String,   
  //   default : ''
  // },
  rcBookImg_id: {
     
    type: String,
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
  },
  // vehicleNumber_1 : {
  //   type : String,
  //   default : ''
  // },
  // vehicleFrontImg_1 : {
  //   type : String,
  //   default : ''
  // },
  vehicleFrontImg: {
    type: String,
    required: true,
  },
  // vehicleFrontImg_id_1 : {
  //   type : String,
  //   default : ''
  // },
  vehicleFrontImg_id: {
    type: String,
    required: true,
  },
  vehicleBackImg: {
    type: String,
    required: true,
  },
  // vehicleBackImg_1 : {
  //   type : String,
  //   default : ''
  // },
  vehicleBackImg_id: {
    type: String,
    required: true,
  },
  // vehicleBackImg_id_1 : {
  //   type :String,
  //   default : ''
  // },
  insuranceNumber: {
    type: String,
    required: true,
  },
  // insuranceNumber_1 : {
  //   type : String,
  //   default : ''
  // },
  insuranceImg: {
    type: String,
    required: true,
  },
  // insuranceImg_1 : {
  //   type : String,
  //   default : ''
  // },
  insuranceImg_id: {
    type: String,
    required: true,
  },
  // insuranceImg_id_1 : {
  //   type : String,
  //   default : ''
  // },
  insuranceExpiryDate: {
    type: String,
    required: true,
  },
  // insuranceExpiryDate_1 : {
  //   type : String,
  //   default : ''
  // },
  drivingLicenseNo: {
    type: String,
    required: true,
  },
  // drivingLicenseNo_1 : {
  //   type : String,
  //   default: ''
  // },
  drivingLicenseImg: {
    type: String,
    required: true,
  },
  // drivingLicenseImg_1 : {
  //   type : String,
  //   default : ''
  // },
  drivingLicenseImg_id: {
    type: String,
    required: true,
  },
  // drivingLicenseImg_id_1 : {
  //   type : String,
  //   default : ''
  // }
});

var SchemaTypes = mongoose.Schema.Types;
const currentLocationSchema = mongoose.Schema({
  lat: {
    type: SchemaTypes.Double,
    default : 0.00

  },
  lng: {
    type: SchemaTypes.Double,
    default : 0.00

  },
});

const bankDetailsSchema = mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  ifscCode: {
    type: String,
    required: true,
  },
  // passbookStatementImg_1 : {
  //   type : String,
  //   default : ''
  // },
  passbookStatementImg: {
    type: String,
    required: true,
  },
  // passbookStatementImg_id_1 : {
  //   type : String,
  //   default : ''
  // },
  passbookStatementImg_id: {
    type: String,
    required: true,
  },
  panCardNumber: {
    type: String,
  },
  // panCardImg_1 : {
  //   type : String,
  //   default : ''
  // },
  panCardImg: {
    type: String,
    default : '--no updated--'
  },
  // panCardImg_id_1 : {
  //   type : String,
  //   default : ''
  // },
  panCardImg_id: {
    type: String,
    default : ''
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
    default: 'NA',
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
  date: {
    type: Date,
    default: new Date()
  }
});

const csnotesSchema = mongoose.Schema({
  admin: {
    type: String,
    default: '',
  },
  comment: {
    type: String,
    required: true,
  },
  dateAndTime: {
    type: String,
    required: true,
  },
});

const CompletedOrders = mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentType: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  commision: {
    type: Number,
    required: true,
  },
});

const rejectedFieldsSchema = mongoose.Schema({
  remark: {
    type: String,
    required: true
  },
  field: {
    type: String,
    required: true
  }
})

const rejectedDocumentsSchema = mongoose.Schema({
  docmentType: {
    type: String,
    required: true
  },
  rejectedFields: [rejectedFieldsSchema]
})

const DriverSchema = mongoose.Schema(
  {
    personalDetails: {
      // profileImg_1: {
      //   type: String,
      //   default: ''
      // },
      // profileImg_id_1: {
      //   type: String,
      //   default: ''
      // },
      profileImg: {
        type: String,
        required: true,
      },
      profileImg_id: {
        type: String,
        required: true,
      },
      refferalNumber: {
        type: String,
        default: '',
      },
      firstName: {
        type: String,
        required: true,
      },
      // firstName_1: {
      //   type: String,
      //   default: ''
      // },
      lastName: {
        type: String,
        required: true,
      },
      // lastName_1: {
      //   type: String,
      //   default: ''
      // },
      defaultPhoneNumber: {
        type: String,
        unique: true,
        required: true,
      },
      // defaultPhoneNumber_1: {
      //   type: String,
      //   default: ''
      // },
      alternativeNumber: {
        type: String,
        required: true,
      },
      // alternativeNumber_1: {
      //   type: String,
      //   default: ''
      // },
      emergencyNumber: {
        type: String,
        required: true,
      },
      // emergencyNumber_1: {
      //   type: String,
      //   default: ''
      // },
      addCity: {
        type: String,
        required: true,
      },
      // addCity_1: {
      //   type: String,
      //   default: ''
      // },
      addLocality: {
        type: String,
        required: true,
      },
      // addLocality_1: {
      //   type: String,
      //   default: ''
      // },
      adharNumber: {
        type: String,
        unique: true,
        required: true,
      },
      // adharNumber_1: {
      //   type: String,
      //   default: ''
      // },
      adharFrontImg: {
        type: String,
        required: true,
      },
      // adharFrontImg_1: {
      //   type: String,
      //   default: ''
      // },
      adharFrontImg_id: {
        type: String,
        required: true,
      },
      // adharFrontImg_id_1: {
      //   type: String,
      //   default: ''
      // },
      adharBackImg: {
        type: String,
        required: true,
      },
      // adharBackImg_1: {
      //   type: String,
      //   default: ''
      // },
      adharBackImg_id: {
        type: String,
        required: true,
      },
      // adharBackImg_id_1: {
      //   type: String,
      //   default: ''
      // }
    },
    vehicleDetails: vehicleDetailsSchema,
    bankDetails: bankDetailsSchema,
    numReviews: {
      type: Number,
      default: 0
    },
    reviews: [reviewSchema],
    rating: {
      type: SchemaTypes.Double,
      default: 0.0
    },
    
    currentLocation: currentLocationSchema,

    isOnline: {
      type: Boolean,
      default: false,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    isReject: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    wallet: {
      type: Number,
      default: 0.0,
    },
    status: {
      type: String,
      default: 'PendingVehicleDetails',
    },
    regCompleted: {
      type: Boolean,
      default: false,
    },
    driverId: {
      type: String,
      required: true,
    },
    fcmToken: {
      type: String,
      default: ""
    },

    walletlogs: [walletlogsSchema],
    dateAndTime: {
      type: String,
    },
    csnotes: [csnotesSchema],
    completedRides: {
      type: Number,
      default: 0,
    },
    earnings: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    completedOrders: [CompletedOrders],
    paymentStatus: {
      type: String,
      default: '',
    },
    onOrder: {
      type: Boolean,
      default: false
    },
    attemptedRides: {
      type: Number,
      default: 0
    },
    rejectedDocuments: [rejectedDocumentsSchema],
    isRejectBasicDetails : {
      type : Boolean,
      default  : false
    },
    isRejectAadharDetails : {
      type : Boolean,
      default : false
    },
    isRejectBankDetails : {
      type : Boolean,
      default : false
    },
    isRejectPancardDetails : {
      type : Boolean,
      default : false
    },
    isRejectVehicleDetails : {
      type : Boolean,
      default : false
    },
    isRejectInsuranceDetails : {
      type : Boolean,
      default : false
    },
    isRejectLicenceDetails : {
      type : Boolean,
      default : false
    },
    isRejectRcDetails : {
      type : Boolean,
      default : false
    }
  },
  { timestamps: true }
);

const Driver = mongoose.model('Driver', DriverSchema);
module.exports = Driver;