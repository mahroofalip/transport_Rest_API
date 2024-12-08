const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const userName = encodeURIComponent(process.env.MONGODBATLAS_USERNAME);
    const password = encodeURIComponent(process.env.MONGODBATLAS_PASSWORD);

    // let db = "loadrunnr-main"; // development

    let db = "loadRunnr"; // productio
    const conn = await mongoose.connect(
      `mongodb+srv://${userName}:${password}@cluster0.yrb3yl2.mongodb.net/${db}?retryWrites=true&w=majority`,
      {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      }
    );
    console.log("Database Connected!...");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
