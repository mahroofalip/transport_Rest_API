const mongoose = require('mongoose')
const claimOfferSchema = mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    coins : {
        type : Number,
        required : true
    },
    img_url: {
      type: String,
      required : true
    },
    img_id : {
      type : String,
      required : true
    }
  }, { timestamps: true });
  
  const ClaimOffers = mongoose.model('ClaimOffers', claimOfferSchema);
  module.exports = ClaimOffers;
  