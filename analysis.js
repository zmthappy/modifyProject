var _ = require('lodash'),
  eventproxy = require('eventproxy'),
  dbconfig = require('./app/configs/database'),
  converter = require('./app/utils/converter');
var Match = require('./app/models/match'),
  Team = require('./app/models/team');
var toMongoose = require('./app/utils/connection');

// 递归调用循环的次数
function controlPieNumber(value, count) {
  count = count - 1;
  if (!count) {
    let obj = {}
    _.each(value, function (value, key) {
      obj[key] = value;
    })
    return obj
  }
  _.each(value, function (value, key) {
    controlPieNumber(value, count,);
  })
}

// 重新组合获得的数据
function resetDataArr(item) {
  let obj = {
    odds: item.odds,
    result: item.jingcai,
  }
  return obj;
}

// 结构数据
function resuleAnalysis(analysisArr) {
  let deconstruction = [];
  analysisArr.forEach(item => {
    let obj = {};
    _.each(item, function (value, key) {
      if (key == "odds") {
        _.each(value,function(value,key){
          if(key == "asia"){
            _.each(value, function (value, key) {
              if(value != undefined){
                obj[key+'asia'] = value;
              }
            })
          }else{
            _.each(value, function (value, key) {
              if(value != undefined){
                obj[key] = value;
              }
            })
          }
        })
      } else {
        const getArr = ['result','now','first','sp','trade','rq']
        _.each(value,function(value,key){
          if(key == "rqspf"){
            // 需要获取数据的数据
            _.each(value,function(value,key){
              if(getArr.indexOf(key) != -1){
                if(value != undefined){
                  obj['rq'+key] = value;
                }
              }
            })
          }else{
            _.each(value,function(value,key){
              if(getArr.indexOf(key) != -1){
                if(value != undefined){
                  obj[key] = value;
                }
              }
            })
          }
        })
      }
    })
    deconstruction.push(obj)
  })
  // console.log(deconstruction.length,'返回的数据');
  return deconstruction;
}


//分析数据

const  Hierarchy = {
  first:{
    range:[1.2 , 1.35],
    win:{
      count:0,
      flatMax:0,
      flatMin:0,
      negativeMax:0,
      negativeMin:0,
    },
  }
}

function analysisFun(arr){
  _.each(arr,function(value,key){
    console.log(value);
    // _.each(value,function(value,key){
    //   console.log(value,"item");
    // })
  })
} 

const queryBackMatch = function (e, match) {
  let analysisArr = [];
  if (!e) {
    console.log(match.length,"match.length");
    // 数据为一条时
    if (match.length === undefined) {
      analysisArr.push(resetDataArr(match));
      analysisFun(resuleAnalysis(analysisArr))
    }
    // 数据大于两条
    else if (match.length > 0) {
      match.forEach(item => {
        analysisArr.push(resetDataArr(item));
        analysisFun(resuleAnalysis(analysisArr))
      })
    } else {
      console.log("DATA ERROR");
    }
  }
}





// Match.getAllMatches({}, queryBackMatch)
Match.getByDateLimit("2022-08-06",5, queryBackMatch)
// Match.getById(1057594, queryBackMatch)
