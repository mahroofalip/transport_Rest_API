const mongoose = require("mongoose");
require("mongoose-double")(mongoose);

const pricingSchema = mongoose.Schema(
  {
    sortId : {
      type : Number,
      required : true
    },
    vehicleType: {
      type: String,
      required: true,
    },
    subType: {
      type: String,
      default: "",
    },
    baseKM: {
      type: Number,
      required: true,
    },
    baseFare: {
      type: Number,
      required: true,
    },
    range1: {
      type: String,
      required: true,
    },
    minKM1: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    infoDiscription: {
      type: String,   //   60 Minutes Loading/Unloading Time , Above Which ₹3/min is applicable
      default: "",
    },
    maxKM1: {
      type: Number,
      required: true,
    },
    fareBetweenRange1: {
      type: Number,
      required: true,
    },
    range2: {
      type: String,
      required: true,
    },
    minKM2: {
      type: Number,
      required: true,
    },
    maxKM2: {
      type: Number,
      required: true,
    },
    fareBetweenRange2: {
      type: Number,
      required: true,
    },
    greaterThanKm: {
      type: Number,
      required: true,
    },
    fareAfterRange2: {
      type: Number,
      required: true,
    },
    extraCharge: {
      type: Number,
      required: true,
    },
    farePerMin: {
      type: mongoose.Schema.Types.Double,
    },
    extraChargeReason: {
      type: String,
    },
    nightSurgeCharge: {
      type: Number,
    },
    nightSurgeTime: {
      type: String,
      required: true,
    },
    nightSurgeTimeFrom: {
      type: String,
      required: true,
    },
    nightSurgeTimeTo: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    capacity: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    rental: {
      type: Boolean,
      default: false,
    },
    rentalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Pricing = mongoose.model("Princing", pricingSchema);
module.exports = Pricing;

// {  "vehicleType" : "Three Wheeler & APE",
//       "subType":"Any",
//       "baseKM":"1",
//       "baseFare":"257",
//       "minKM1":"2",
//       "maxKM1":"10",
//       "fareBetweenRange1":"38",
//       "minKM2":"11",
//       "maxKM2":"15",
//       "fareBetweenRange2":"19",
//       "greaterThanKm":"16",
//       "fareAfterRange2":"20",
//       "extraCharge":"0",
//       "extraChargeReason":"something",
//       "nightSurgeCharge":"0",
//       "timeFrom":"08 : 00 PM" ,
//       "timeTo":"06 : 00 AM",
//       "image_url":"https://loadrunnr-images.s3.ap-south-1.amazonaws.com/pricingImages/Asset+20%402x.png",
//       "capacity":"500Kg",
//       "rental": "false",
//        "rentalAmount": "0",
//       "size":"5.5ft X 4.5ft X 5ft"}
