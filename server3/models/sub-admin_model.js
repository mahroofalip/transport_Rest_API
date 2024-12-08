const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const subAdminSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// subAdminSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };
// subAdminSchema.methods.dcryptedpwd = async function (enteredPassword) {
//   let pwd = await bcrypt.compare(enteredPassword, this.password);
//    return pwd
// };

// subAdminSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);

// });

const SubAdmin = mongoose.model("subAdmin", subAdminSchema);
module.exports = SubAdmin;
