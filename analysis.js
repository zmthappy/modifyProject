var _ = require('lodash'),
  eventproxy = require('eventproxy'),
  dbconfig = require('./app/configs/database'),
  converter = require('./app/utils/converter');
var Match = require('./app/models/match'),
  Team = require('./app/models/team');
var toMongoose = require('./app/utils/connection');


function controlPieNumber(value, count) {
  count = count - 1;
  // console.log(count);
  if (!count) {
    let obj = {}
    _.each(value, function (value, key) {
      obj[key] = value;
    })
    console.log(obj, 'obj');
    return obj
  }
  _.each(value, function (value, key) {
    controlPieNumber(value, count);
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
  // 第一层
  analysisArr.forEach(item => {
    // 第二层
    _.each(item, function (value, key) {
      // 第三层
      if (key == "odds") {
        // 第四层
        let obj = controlPieNumber(value, 2)
        console.log(obj, "obj");
        // _.each(value, function (value, key) {
        //   // 第五层
        //   _.forEach(value, function (value, key) {
        //     obj[key] = value;
        //   })
        // })
      } else {
        // _.each(value, function (value, key) {
        //   console.log(value, "top");
        //   _.each(value, function (value, key) {
        //     if (key == "sp") {
        //       console.log(key.data);
        //     } else {
        //       console.log(key, value, "value");
        //     }
        //   })
        // })
      }
    })
    // console.log(obj);
  })
}


const queryBackMatch = function (e, match) {
  let analysisArr = [];
  if (!e) {
    // console.log(match.odds.europe, match.odds.asia);
    // 数据只有一条时
    if (match.length === undefined) {
      analysisArr.push(resetDataArr(match));
      console.log(analysisArr, "ls<1");
      resuleAnalysis(analysisArr)
    }
    // 数据大于两条
    else if (match.length > 0) {
      match.forEach(item => {
        analysisArr.push(resetDataArr(match));
        console.log(analysisArr, "ls>2");
        resuleAnalysis(analysisArr)
      })
    } else {
      console.log("DATA ERROR");
    }
  }
}





// Match.getAllMatches({}, queryBackMatch)
// Match.getByDate("2022-08-06", queryBackMatch)
Match.getById(1057594, queryBackMatch)
