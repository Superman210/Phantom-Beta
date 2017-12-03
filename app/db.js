const mongoose = require("mongoose");
const config = require("../config");

const conn = mongoose.connection;

function mongooseConnect() {
  mongoose.connect(config.databaseConnection, {
    'server': {
      'poolSize': 100,
      'socketOptions': {
        'keepAlive': 300000, 
        'connectTimeoutMS': 30000,
        'socketTimeoutMS': 120000
      }
    }
  });  
}

function gracefulExit() { 
  conn.close(function() {
    console.log('Mongoose default connection is disconnected through app termination');
    process.exit(0);
  });
}

mongoose.Promise = global.Promise;

if (config.isLocal) 
  mongoose.set('debug', true);

mongooseConnect();

conn.on('connecting', function() {
  console.log('Connecting to MongoDB...');
});

conn.on('error', function(error) {
  console.error('Error in MongoDB connection: ' + error);
  mongoose.disconnect();
});

conn.on('connected', function() {
  console.log('MongoDB Connected!');
  console.error('MongoDB Connected!');
});

conn.once('open', function() {
  console.log('MongoDB Connection opened!');
});

conn.on('reconnected', function () {
  console.log('MongoDB reconnected!');
});

conn.on('disconnected', function() {
  console.log('MongoDB disconnected!');
  mongooseConnect();
});

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);