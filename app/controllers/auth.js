const mongoose = require("mongoose");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const config = require("../../config/config");

const User = mongoose.model("User");

passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ 
    username: username.toLowerCase() 
  }, (err, user) => {
    if (err || !user) 
      return done(err, false)

    user.verifyPassword(password, (err, valid) => {
      done(err, valid ? user : null);
    });
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  done(null, {});
});

function loggedIn(req) {
  return req.session &&
          (req.session.role === 'user' || req.session.role === 'admin')
}

module.exports = {

  ensureHost: (req, res, next) => {
    if (req.get("host") !== config.loginUrl)
      res.sendStatus(404)

    else
      next();  
  },

  loggedIn: (req, res, next) => {
    if (loggedIn(req))
      next();

    else if (req.get("host") === config.loginUrl)
      res.status(401).json({ "message": "API access unauthorized" });

    else
      res.sendStatus(404);
  },

  indexPage: (req, res) => {
    res.render("index", { 
      title: "Phantom",
      username: req.session.username,
      role: req.session.role
    });
  },

  loginPage: (req, res) => {
    res.render("login", {
      "title": "Login"
    });
  },

  login: (req, res, next) => {
    passport.authenticate('local', function(err, user) {
      if (err) return next(err);
      if (!user) return res.redirect('/admin/login');
      req.session.username = user.username;
      req.session.role = user.role;

      res.redirect('/admin');
    })(req, res, next);
  },

  checkAdminAuth: (req, res, next) => {
    if (loggedIn(req))
      next();
    else
      res.redirect("/admin/login");
  }
};