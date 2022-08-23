var _ = require('lodash'),
  eventproxy = require('eventproxy'),
  dbconfig = require('../configs/database'),
  oddArr = require('../configs/company'),
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

// const Hierarchy = {
//   first: {
//     range: [1.2, 1.35],
//     win: {
//       count: 0,
//       flatMax: 0,
//       flatMin: 0,
//       negativeMax: 0,
//       negativeMin: 0,
//     },
//   }
// }






function judgmentData(dataArr, key) {
  if (key == "now") {
    _.each(dataArr, function (value, key) {
      console.log(value);
    })
  } else {
    console.log("first is not deal with");
  }
}

function externalProcessing(value, key, type) {
  if (oddArr.europe.indexOf(key) != -1) {
    _.each(value, function (value, key) {

    })
  } else if (oddArr.asia.indexOf(key.substring(0, key.indexOf(asia) + 1)) != -1) {

  }
}

const Hierarchy = [];

function analysisFun(arr) {
  _.each(arr, function (value, key) {
    let obj = {};
    // if (oddArr.europe.indexOf(key) != -1) {
    //   _.each(value, function (value, key) {
    //   })
    // } else if (oddArr.asia.indexOf(key.substring(0, key.indexOf(asia) + 1)) != -1) {
    // } else {
    console.log(arr, "arr");
    if (key === "result") {
      switch (parseInt(value)) {
        case 3: externalProcessing(arr, 3); break;
        case 1: externalProcessing(arr, 1); break;
        default: externalProcessing(arr, 0);
      }
    }
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
        console.log(resuleAnalysis(analysisArr));
        analysisFun(resuleAnalysis(analysisArr))
      })
    } else {
      console.log("DATA ERROR");
    }
  }
}





Match.getByDateLimit("2022-08-06", 1, queryBackMatch)
// Match.getById(1057594, queryBackMatch)
