const mongoose = require('mongoose')

const customerDetailsSchema = mongoose.Schema({
    customerId : {
        type : String,
        required : true
    },
    name : {
        type : String,
        required : true
    },
    phoneNumber : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    totalCoins : {
        type : Number,
        required : true
    }
})
const claimWithdrawalsSchema = mongoose.Schema({
    claimOffersId : {
        type : String,
        required : true
    },
    customerDetails : customerDetailsSchema,
    status : {
        type : String,
        default : "Pending"
    },
    offerDetails : {
        title : {
            type : String,
            required : true
        },
        img : {
            type : String,
            required : true
        },
        needCoins : {
            type : Number,
            required : true
        },
      },
      comment : {
        type : String,
        default : ''
      }
}, {timestamps : true})

const ClaimWithdrawal = mongoose.model("ClaimWithdrawal", claimWithdrawalsSchema)
module.exports = ClaimWithdrawal