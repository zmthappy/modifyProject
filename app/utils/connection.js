var mongoose = require('mongoose');
var dbconfig = require('../configs/database');

var toConnection = function () {
  console.log('被执行--》');
  mongoose.connect(dbconfig.url, { useMongoClient: true });
  mongoose.Promise = global.Promise;
  mongoose.connection.on('open', function () {
    console.log("connneted----->");
  });
  mongoose.connection.on('error', function (err) {
    console.log('mongo_conn', err);
  });
}



module.exports = toConnection()