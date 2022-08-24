var _ = require('lodash'),
  eventproxy = require('eventproxy'),
  dbconfig = require('../configs/database'),
  converter = require('../utils/converter');
const { asia } = require('../configs/company');
var Match = require('../models/match'),
  Team = require('../models/team');
var toMongoose = require('../utils/connection');

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

const Hierarchy = [];
const oddArr = {
  'europe':['average','ladbrokes', 'bet365','macau','victor','snai','william'],
  'asia':['ladbrokes','bet365','macau'],
}

// 结构数据
function resuleAnalysis(analysisArr) {
  let deconstruction = [];
  analysisArr.forEach(item => {
    let obj = {};
    _.each(item, function (value, key) {
      if (key == "odds") {
        _.each(value, function (value, key) {
          if (key == "asia") {
            _.each(value, function (value, key) {
              if (value != undefined) {
                obj[key + 'asia'] = value;
              }
            })
          } else {
            _.each(value, function (value, key) {
              if (value != undefined) {
                obj[key] = value;
              }
            })
          }
        })
      } else {
        const getArr = ['result', 'now', 'first', 'sp', 'trade', 'rq']
        _.each(value, function (value, key) {
          if (key == "rqspf") {
            // 需要获取数据的数据
            _.each(value, function (value, key) {
              if (getArr.indexOf(key) != -1) {
                if (value != undefined) {
                  obj['rq' + key] = value;
                }
              }
            })
          } else {
            _.each(value, function (value, key) {
              if (getArr.indexOf(key) != -1) {
                if (value != undefined) {
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

// 最终的数据判断
function judgmentData(dataArr, key) {
  _.each(dataArr, function (value, key) {
    if (key == "now") {
      // 欧赔数据
    } else {
      // 亚盘数据
    }
  })

}



// 对数据的外部进行处理
function externalProcessing(arr, type) {
  _.each(arr,function(value,key){
    if (oddArr.europe.indexOf(key) != -1) {
     judgmentData(value)
    } else if (oddArr.asia.indexOf(key.substring(0, key.indexOf(asia) + 1)) != -1) {
      console.log("asia");
    }
  })
}


// 对数据的进行三段处理
function analysisFun(arr) {
  _.each(arr, function (value, key) {
    let obj = {};
    _.each(value,function(item,key){
      if (key == "result") {
        switch (parseInt(item)) {
          case 3: externalProcessing(value, 3); break;
          case 1: externalProcessing(value, 1); break;
          default: externalProcessing(value, 0);
        }
      }
    })
  })
}

const queryBackMatch = function (e, match) {
  let analysisArr = [];
  if (!e) {
    console.log(match.length, "match.length");
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





Match.getByDateLimit("2022-08-06", 1, queryBackMatch)
// Match.getById(1057594, queryBackMatch)
