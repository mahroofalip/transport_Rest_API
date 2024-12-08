const mongoose = require('mongoose');

const UserBannerSchema = mongoose.Schema({
  userBanner: {
    type: String,
    required: true,
  },
  bannerKey : {
    type : String,
    required : true
  }
});

const BannerUser = mongoose.model('BannerUser', UserBannerSchema);
module.exports = BannerUser;
