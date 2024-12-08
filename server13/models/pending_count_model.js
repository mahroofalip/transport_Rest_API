const mongoose = require('mongoose');

const pendingCountSchema = mongoose.Schema({
  count: {
    type: Number,
    required : true
  },
  id : {
    type : String,
    required : true
  }
});

const PendingCount = mongoose.model('PendingCount', pendingCountSchema);
module.exports = PendingCount;
