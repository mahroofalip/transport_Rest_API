const mongoose = require('mongoose');

const commisionSchema = mongoose.Schema({
  rate: {
    type: Number,
    required: true,
  },
});

const Commision = mongoose.model('Commision', commisionSchema);
module.exports = Commision;
