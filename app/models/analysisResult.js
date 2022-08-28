var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var analysisResultSchema = new Schema({});

//查找
analysisResultSchema.statics.getAll = function (callback) {
  this.find({}, callback);
}

analysisResultSchema.statics.removeAll = function (callback) {
  this.remove({}, callback);
}


mongoose.model('analysisResult', analysisResultSchema);

module.exports = mongoose.model('analysisResult');