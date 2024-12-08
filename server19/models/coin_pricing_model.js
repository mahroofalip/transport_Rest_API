const mongoose = require("mongoose")

const coinPricingSchema = mongoose.Schema({
    orderNumber : {
        type : Number,
        required : true
    },
    coins : {
        type : Number,
        required : true
    },
    coins1 : {
        type : Number,
        default : 0
    },
    type : {
        type : String,
        required : true
    },
    range : {
        type : Number,
        required : true
    },
    range1 : {
        type : Number,
        default : 0
    }
}, { timestamps : true})


const CoinPricing = mongoose.model('CoinPricing', coinPricingSchema);
module.exports = CoinPricing;
