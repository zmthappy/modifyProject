var _ = require('lodash'),
  eventproxy = require('eventproxy'),
  dbconfig = require('../configs/database'),
  dayjs = require('dayjs'),
  converter = require('../utils/converter');
var Match = require('../models/match'),
  AnalysisResult = require('../models/analysisResult'),

  Team = require('../models/team');

var toMongoose = require('../utils/connection');

const fs = require('fs');


const Hierarchy = {
  "3": {},
  "1": {},
  "0": {},
};
const oddArr = {
  'europe': ['average', 'ladbrokes', 'bet365', 'macau', 'victor', 'snai', 'william'],
  'asia': ['ladbrokes', 'bet365', 'macau'],
}

let endStructure = {
  "over6.5": {
    'range': [6.5, 10],
  },
  "over5.5": {
    'range': [5.5, 6.5],
  },
  "over4.5": {
    'range': [4.5, 5.5],
  },
  "over3.5": {
    'range': [3.5, 4.5],
  },
  "over2.6": {
    'range': [2.6, 3.5],
  },
  "0": {
    'range': [2.3, 2.6],
  },
  "0.25": {
    'range': [1.9, 2.3],
  },
  "0.5": {
    'range': [1.7, 1.9],
  },
  "0.75": {
    'range': [1.6, 1.7],
  },
  "1": {
    'range': [1.45, 1.6],
  },
  "1.25": {
    'range': [1.35, 1.45],
  },
  "1.5": {
    'range': [1.25, 1.35],
  },
  "1.75": {
    'range': [1.15, 1.25],
  },
  // "2": { 'range': [1.7, 1.9] },
  // "2.25": { 'range': [1.7, 1.9] },
  // "2.5": { 'range': [1.7, 1.9] },
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


// 判断对应的数组里是否有数据
function isNull(oddsRanges, key) {
  let flag = false;
  _.each(oddsRanges, function (matchResult, matchKey) {
    if (matchKey == key) {
      if (matchResult.length == 0) {
        flag = true;
        return flag;
      }
    }
  })
  return flag;
}

// 根据传的键值来确定数组取值下标,type为赛果
function transformation(type) {
  switch (type) {
    case "1":
      return 1;
    case "3":
      return 0;
    case '0':
      return 2;
  }
}

// 对完成复制之后进行排序，可以对后续的数据添加进行处理
function sort(matchResultArr) {
  if (matchResultArr.length > 1) {
    matchResultArr.sort(function (a, b) {
      return a.oddNumber - b.oddNumber;
    })
  }
}

// 对对应数组进行判断大小后位置
function comparisonOdd(matchResultArr, typeNumber) {
  let obj = {};
  let findItSame = false;
  // 如果数组里中相等是将对应的计数器加一
  _.each(matchResultArr, function (sigleValue, sigelKey) {
    if (Math.abs(typeNumber - sigleValue.oddNumber) <= Number.EPSILON) {
      sigleValue.counter += 1;
      findItSame = true;
    }
  })
  if (!findItSame) {
    if (matchResultArr.length == 1) {
      // 数组里的数据一直一个的时候，比较大小选择插入的位置，大时向后插，小时向前插；
      if (matchResultArr[0].oddNumber > typeNumber) {
        obj = {
          'oddNumber': typeNumber,
          "counter": 1,
        };
        matchResultArr.push(obj)
      } else if (matchResultArr[matchResultArr.length - 1].oddNumber < typeNumber) {
        obj = {
          'oddNumber': typeNumber,
          "counter": 1,
        };
        matchResultArr.unshift(obj)
      }
    } else {
      // 当数组里的数据大于2个时，对数据进行处理
      if (matchResultArr[0].oddNumber > typeNumber && (matchResultArr[matchResultArr.length - 1].oddNumber - typeNumber) <= 0.25) {
        obj = {
          'oddNumber': typeNumber,
          "counter": 1,
        };
        matchResultArr.unshift(obj)
      }
      // 比较数组中的最后一个的大小
      else if (matchResultArr[matchResultArr.length - 1].oddNumber < typeNumber && (typeNumber - matchResultArr[0].oddNumber) <= 0.25) {
        obj = {
          'oddNumber': typeNumber,
          "counter": 1,
        };
        matchResultArr.push(obj)
      }
      else {
        obj = {
          'oddNumber': typeNumber,
          "counter": 1,
        };
        matchResultArr.push(obj);
        sort(matchResultArr);
      }
    }
  }

}

// 用于处理对应的数组的字段
const oddRangesKeys = ['3', "1", "0"];

// 对数据进行最终的处理，type为赛事结果，dataArr为对应获取的数组的赔率数组
function judgmentData(dataArr, attribute, type) {

  _.each(dataArr, function (value, key) {
    // 对数组范围进行判断，确定属于哪一个层级
    _.each(Hierarchy[type][attribute], function (asiaValue, asiaKey) {
      // 只需要根据赛事结果进行来判断属于哪个层级
      if (asiaValue.range[1] >= value[transformation(type)] && asiaValue.range[0] < value[transformation(type)]) {
        let end = Hierarchy[type][attribute][asiaKey];
        // 对对应的层级进行赋值
        if (!end?.oddsRanges) {
          end['oddsRanges'] = {
            '3': [],
            "1": [],
            '0': [],
          }
        }
        // 对最新的赔率数据进行处理
        if (key == "now") {
          if (value.length > 0) {
            // const oddRangesKeys = Object.keys(end.oddsRanges);
            _.each(oddRangesKeys, function (keyValue, keyOfend) {
              // console.log(end);
              if (isNull(end.oddsRanges, keyValue)) {
                // 判断对应的赛果存储的数组是否为空,为空直接进行复制
                // 存储oddRanges的键值
                if (keyValue != type) {
                  // console.log(end.oddsRanges[keyValue], keyValue, "end.oddsRanges");
                  obj = {
                    'oddNumber': value[transformation(keyValue)],
                    "counter": 1,
                  }
                  // console.log(attribute, obj, "type=" + type, "keyValue=" + keyValue, transformation(keyValue), asiaKey, "obj");
                  end.oddsRanges[keyValue].push(obj);
                  // console.log(end.oddsRanges, keyValue, asiaKey, "end.oddsRanges-fuzhi");
                  sort(end.oddsRanges[keyValue]);
                }
              } else {
                // 不为空时需要判断后进行赋值
                if (keyValue != type) {
                  comparisonOdd(end.oddsRanges[keyValue], value[transformation(keyValue)]);
                  sort(end.oddsRanges[keyValue]);
                }
              }
            })
          }
        }
      }
    })
  })
}



function externalProcessing(value, type) {

  _.each(value, function (item, key) {
    //只对欧赔进行分析
    if (oddArr.europe.indexOf(key) != -1) {
      // item==>属性值；key==>属性；type=>类型
      judgmentData(item, key, type);
    } else {
      // 后续处理
    }
  })
}


// 统计胜平负的数量
const spfNumber = [{ "3": 0 }, { "1": 0 }, { "0": 0 }]
// 对数据的进行三段处理
function analysisFun(arr) {
  // 在数据处理前完成对结构的搭建
  _.each(Hierarchy, function (outvalue, outKey) {
    _.each(oddArr.europe, function (eurValue, eurKey) {
      if (!Hierarchy[outKey]?.[eurValue]) {
        Hierarchy[outKey][eurValue] = JSON.parse(JSON.stringify(endStructure));
      }
    })
  })
  _.each(arr, function (value, key) {
    _.each(value, function (item, key) {
      if (key == "result") {
        if (item == 3) {
          console.log("3-win");
          spfNumber[0]['3'] += 1;
          externalProcessing(value, "3");
        } else if (item == 1) {
          console.log("1-flat");
          spfNumber[1]['1'] += 1;
          externalProcessing(value, "1");
        } else if (item == 0) {
          console.log("0-lose");
          spfNumber[2]['0'] += 1;
          externalProcessing(value, "0");
        }
      }
    })
  })
}

// 保存数据到文件
function saveToJson() {
  const data = JSON.stringify(Hierarchy, null, 4)
  fs.writeFile('./result.json', data, err => {
    if (err) {
      console.log(err);
    } else {
      console.log('数据添加成功!')
    }
  });
}


const queryBackMatch = function (e, match) {
  let analysisArr = [];
  if (!e) {
    // 数据为一条时
    console.log(match.length, "match.length");
    if (match.length === undefined) {
      analysisArr.push(resetDataArr(match));
      analysisFun(resuleAnalysis(analysisArr))
    }
    // 数据大于两条
    else if (match.length > 0) {
      match.forEach(item => {
        analysisArr.push(resetDataArr(item));
      })
      analysisFun(resuleAnalysis(analysisArr))
      Hierarchy.spfNUmber = spfNumber;
      saveToJson();
    } else {
      console.log("DATA ERROR");
    }
  }
}






// Match.getById(1057594, queryBackMatch)
var start = function () {
  // Match.getByDateLimit("2022-08-20", 50, queryBackMatch)
  Match.getJingcaiByDateNotToday(dayjs().format("YYYY-MM-DD"), queryBackMatch)
  // Match.getMatchesNo(10, queryBackMatch)
}

start()




