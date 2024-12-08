const mongoose = require('mongoose');

const DriverBannerSchema = mongoose.Schema({
  driverBanner: {
    type: String,
    required: true,
  },
  bannerKey : {
    type : String,
    required : true
  }
});

const BannerDriver = mongoose.model('BannerDriver', DriverBannerSchema);
module.exports = BannerDriver;
