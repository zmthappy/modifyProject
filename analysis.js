var _ = require('lodash'),
  eventproxy = require('eventproxy'),
  dbconfig = require('./app/configs/database'),
  converter = require('./app/utils/converter');
var Match = require('./app/models/match'),
  Team = require('./app/models/team');
var toMongoose = require('./app/utils/connection');


// 重新组合获得的数据
function resetDataArr(item) {
  let analysisArr = [];
  // item.forEach(item => {
  let obj = {
    odds: item.odds,
    result: item.jingcai.spf.result,
  }
  analysisArr.push(obj);
  // })
  return analysisArr;
}

// 数据分析
function resuleAnalysis(analysisArr) {

}

const queryBackMatch = function (e, match) {
  // let analysisArr = [];
  // let matchResult = [];
  if (!e) {
    // 数据只有一条时
    console.log(match.length);
    if (match.length === undefined) {
      analysisArr = resetDataArr(match);
    }
    // 数据大于两条
    else if (match.length > 0) {
      match.forEach(item => {
        analysisArr = resetDataArr(item);
      })
    } else {
      console.log("DATA ERROR");
    }
  }
}





// Match.getAllMatches({}, queryBackMatch)
Match.getByDate("2022-08-16", queryBackMatch)
