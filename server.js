var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var multer = require("multer");
require("dotenv/config");
var port = process.env.PORT || 6000;
let cors = require("cors");

//CONFIGURATIONS_2
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
var User = require("./models");
console.log(
  process.env.S3_ACCESS_KEY,
  process.env.S3_SECRET_ACCESS_KEY,
  process.env.S3_BUCKET_REGION,
  process.env.S3_BUCKET_NAME
);

// CONNECTING TO THE AWS S3 BUCKET
//===================================
// Variable stores the return value
const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

const storage = multerS3({
  s3,
  bucket: process.env.S3_BUCKET_NAME,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, `image-${Date.now()}.jpeg`);
  },
});

const upload = multer({
  storage: storage,
});

//CONNECTING TO THE MONGODB DATABASE
//===================================
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//MAKING SURE THAT OUR CONNECTION WAS SUCCESSFUL.
//===============================================
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log(
    "The Image Handler renewed database has been connected to the express server."
  );
});

// CONFIGURING THE MIDDLEWARES
//==============================
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// SETTING EJS AS TEMPLATING ENGINE.
//===================================
app.set("view engine", "ejs");

//SERVER-SIDE RENDERING WITH EJS.
//===============================
app.get("/", (req, res) => {
  User.find({}, (err, items) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred", err);
    } else {
      res.render("imagesPage", { items: items });
    }
  });
});

// THE POST REQUEST FOR PROCESSING THE UPLOADED FILE.
//====================================================
app.post("/", (req, res, next) => {
  // STORES THE RETURN VALUE
  const uploadSingle = upload.single("image");
  //WORKING ON THE RETURN VALUE WHICH IS A CALLBACK FUNCTION.
  uploadSingle(req, res, async (err) => {
    if (err) return res.status(400).send(err);

    await User.create({
      name: req.body.name,
      desc: req.body.desc,
      location: req.file.location,
    });

    res.status(200).json({ data: req.file.location });
  });
});

// CONFIGURING THE SERVER'S PORT
//================================
app.listen(port, (err) => {
  if (err) throw err;
  console.log("Server listening on port", port);
});
