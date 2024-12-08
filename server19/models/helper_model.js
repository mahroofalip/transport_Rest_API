const mongoose = require('mongoose');

const helperSchema = mongoose.Schema({
  walletlogsid: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

const HelperCollection = mongoose.model('HelperCollection', helperSchema);
module.exports = HelperCollection;
