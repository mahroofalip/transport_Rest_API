const mongoose = require('mongoose')

const withdrawalRequestSchema = mongoose.Schema({
    requestId : {
        type : String,
        required : true
    },
    id : {
        type : String,
        required : true
    },
    driverId : {
        type : String,
        required : true
    },
    driverName : {
        type : String,
        required : true
    },
    driverPhoneNumber : {
        type : String,
        required : true
    },
    bankName : {
        type : String,
        required : true
    },
    accountNumber : {
        type : String,
        required : true
    },
    ifscCode : {
        type : String,
        required : true
    },
    status: {
        type : String,
        required : true
    },

    comment :{
        type : String,
        default : ''
    },

    amount : {
        type : Number,
        required : true
    },
    time : {
        type : String,
        required : true
    },
    date : {
        type : String,
        required : true
    },
    walletlogId : {
        type : String,
        required : true
    }
}, { timestamps : true})

const Withdrawal = mongoose.model('Withdrawal', withdrawalRequestSchema)

module.exports = Withdrawal