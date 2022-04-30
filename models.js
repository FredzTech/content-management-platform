const mongoose = require("mongoose");
const { Schema } = mongoose;

const imageSchema = new Schema({
  name: String,
  desc: String,
  location: String,
});

module.exports = mongoose.model("image", imageSchema);
