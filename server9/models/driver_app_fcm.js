const mongoose = require("mongoose");

const idSchema = mongoose.Schema({
  fcmTokens: [],
  fcmFor: {
    type: String,
  },
});

const Fcm = mongoose.model("fcm", idSchema);
module.exports = Fcm;
