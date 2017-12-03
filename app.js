const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const RedisStore = require('connect-redis')(session);
const config = require("./config/config");
const compress = require("compression");
const passport = require("passport");

const Db = require('mongodb').Db;
const MongoClient = require('mongodb').MongoClient;

process.on('unhandledRejection', r => console.error(r));

// db init
mongoose.Promise = global.Promise;
mongoose.connect(config.databaseConnection, {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 120000
});

require("./app/models");
require("./app/controllers/helpers.js");

// controllers init
const app = express();
const port = process.env.PORT || config.port;

// view engine setup
app.set("views", path.join(__dirname, "app/views"));
app.set("view engine", "ejs");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.use(bodyParser.json());
app.use((req, res, next) => {
  let isLocal = config.env === 'local';
  let isAdmin = req.originalUrl.match(/^\/(admin|api)/)

  if (req.get("host") !== config.loginUrl || (isLocal && !isAdmin))
    next()
  else
    bodyParser.urlencoded({ "extended": false })(req, res, next);
});

app.use(cookieParser());
app.use(compress());

app.enable('trust proxy');
app.disable('x-powered-by');

app.use(
  '/this-is-a-static-dir',
  express.static(path.resolve(__dirname, "public"), {
    etag: true,
    lastModified: true,
    maxAge: 60 * 1000
  })
);

// setup session
app.use(
  session({
    name: "phantom.sid",
    secret: "Aj1oa21;aew)8jN",
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    },
    store: new RedisStore({
      prefix: "sess",
      host: "localhost",
      port: 6379
    })
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
require("./app/routes")(app);

// catch 404 and forward to error handler
app.use((req, res) => {
  var err = new Error("Not Found");
  err.status = 404;
  res.status(err.status);
  res.render("404", {
    message: err.message,
    error: err
  });
});

// production error handler
// no stacktraces leaked to user
app.use((err, req, res) => {
  console.error(JSON.stringify(err, null, 4));
  res.sendStatus(500);
});

console.error('Server restarted!');
console.log("App will listen at port " + port);
app.listen(port, () => {
  console.log("Listening...");
});


module.exports = app;
