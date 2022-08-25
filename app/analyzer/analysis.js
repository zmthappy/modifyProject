var _ = require('lodash'),
  eventproxy = require('eventproxy'),
  dbconfig = require('../configs/database'),
  converter = require('../utils/converter');
const { asia } = require('../configs/company');
var Match = require('../models/match'),
  Team = require('../models/team');
var toMongoose = require('../utils/connection');



const Hierarchy = {};
const oddArr = {
  'europe': ['average', 'ladbrokes', 'bet365', 'macau', 'victor', 'snai', 'william'],
  'asia': ['ladbrokes', 'bet365', 'macau'],
}

let endStructure = {
  "0": {
    'rang': [2.3, 2.6],
  },
  "0.25": {
    'rang': [1.9, 2.3],
  },
  "0.5": {
    'rang': [1.7, 1.9],
  },
  "0.75": {
    'rang': [1.6, 1.7],
  },
  "1": {
    'rang': [1.45, 1.6],
  },
  "1.25": {
    'rang': [1.35, 1.45],
  },
  "1.5": {
    'rang': [1.25, 1.35],
  },
  "1.75": {
    'rang': [1.15, 1.25],
  },
  // "2": { 'rang': [1.7, 1.9] },
  // "2.25": { 'rang': [1.7, 1.9] },
  // "2.5": { 'rang': [1.7, 1.9] },
};
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
  return deconstruction;
}

// function judgmentData(dataArr, attribute, type) {
//   _.each(dataArr, function (value, key) {
//     if (key == "now") {
//       _.each(Hierarchy[type], function (rang, key) {
//         if (!Hierarchy[type][key]?.[attribute + '3']) {
//           Hierarchy[type][key][attribute + '3'] = [0, 0]
//         }
//         if (value[0] >= rang.rang[0] && value[0] < rang.rang[1]) {
//           // console.log(Hierarchy[type][rang]?.[attribute + '3'], attribute + '3');
//           let left = Hierarchy[type][key][attribute + '3'];
//           if (left[0] == 0 && left[1] == 0) {
//             left[0] = left[1] = value[0]
//           }
//           console.log(left);
//         }
//       })
//     } else {
//     }
//   })
// }


function judgmentData(dataArr, attribute, type) {
  _.each(dataArr, function (value, key) {
    if (key == "now") {
      if (!Hierarchy[attribute][type]?.max) {
        Hierarchy[attribute][type] = {
          'max': [],
          'min': [],
        }
      }
      let innermostLayer = Hierarchy[attribute][type];
      if (innermostLayer.max.length == 0 && innermostLayer.max.length == 0) {
        obj = {
          'leftOdd': value[0],
          "counter": 1,
        }
        innermostLayer.max.push(obj);
        innermostLayer.min.push(obj);
      } else {

      }
      // if (Hierarchy[attribute][type][max]) {
      //   //           let left = Hierarchy[type][key][attribute + '3'];
      //   //           if (left[0] == 0 && left[1] == 0) {
      //   //             left[0] = left[1] = value[0]
      //   //           }
      //   //           console.log(left);
      //   //         }
      // }
      console.log(innermostLayer.max, "H");
    }
  })
}

function assignment(arrType) {

}


// 对数据的外部进行处理
// function externalProcessing(arr, type) {
//   _.each(arr, function (value, key) {
//     if (oddArr.europe.indexOf(key) != -1) {
//       judgmentData(value, key, type)
//     } else if (oddArr.asia.indexOf(key.substring(0, key.indexOf(asia) + 1)) != -1) {
//       judgmentData(value, key, type)
//     }
//   })
// }


function externalProcessing(value, type) {
  _.each(value, function (item, key) {
    if (oddArr.europe.indexOf(key) != -1) {
      if (!Hierarchy?.[key]) {
        Hierarchy[key] = {
          "3": {},
          "1": {},
          "0": {},
        };
      }
      judgmentData(item, key, type);
    } else {
      // 后续处理
    }
  })
}

// 对数据的进行三段处理
function analysisFun(arr) {
  _.each(arr, function (value, key) {
    let obj = {};
    _.each(value, function (item, key) {
      if (key == "result") {
        switch (parseInt(item)) {
          case 3:
            externalProcessing(value, "3");
            break;
          case 1:
            externalProcessing(value, "1");
            break;
          default:
            externalProcessing(value, "0");
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
