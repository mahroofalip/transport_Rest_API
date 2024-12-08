const mongoose = require('mongoose');

const transactionHistorySchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true
    },
    Id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    txn_id: {
        type: String,
        default : '----'
    },
    user_id : {
        type : String,
        requried: true
    },
    order_id: {
        type: String,
        required: true
    },
    dateAndTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
});

const TransactionHistory = mongoose.model('TransactionHistory', transactionHistorySchema);
module.exports = TransactionHistory;


// 1) ID
// 2) NAME
// 3) NUMBER
// 4) AMOUNT
// 5) TXN ID 
// 6) UTR ID
// 7) DATE & TIME