const mongoose = require('mongoose');

const idSchema = mongoose.Schema({
  count: {
    type: Number,
  },
});

const Ids = mongoose.model('ids', idSchema);
module.exports = Ids;

