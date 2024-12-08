const mongoose = require('mongoose');
const usersSchema = mongoose.Schema({
  id: {
    type: String,
    default: '',
  },
  phoneNumber: {
    type: String,
    default: '',
  },
});
const promoCodeSchema = mongoose.Schema(
  {
    status: {
      type: String,
      default: 'Active',
    },
    promocode: {
      type: String,
      unique: true,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    createdDate: {
      type: String,
    },
    default: '',
    expireDate: {
      type: String,
      default: '01/05/2022',
    },
    date: {
      type: Date,
      default: '2022-02-26T00:00:00.000+00:00',
      index: { expires: '0m' },
    },
    couponValue: {
      type: Number,
      required: true,
    },
    couponType: {
      type: String,
      required: true,
    },
    minPrice: {
      type: Number,
      required: true,
    },
    maxDiscount: {
      type: Number,
      required: true,
    },
    maxRides: {
      type: Number,
      required: true,
    },
    users: usersSchema,
    completedRides: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

module.exports = PromoCode;
