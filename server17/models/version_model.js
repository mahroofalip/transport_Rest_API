const mongoose = require('mongoose')

const versionSchema = mongoose.Schema({
    version : {
        type : String,
        required : true
    },
    customerApp : {
        type : Boolean,
        default : true
    }
}, { timestatp : true})


const Version = mongoose.model("Version", versionSchema)

module.exports = Version