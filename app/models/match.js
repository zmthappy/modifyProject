var _ = require('lodash'),
  mongoose = require('mongoose'),
  COMPANY = require('../configs/company'),
  dayjs = require('dayjs'),
  Schema = mongoose.Schema;

var SchemaProto = {
  //是否为简单场次（简单场次用于记录未来赛事和早期赛事，可能会缺少部分赔率数据、红黄牌数据，仅用作胜负关系参考）
  simple: { type: Boolean, default: false },
  //赛事
  game: {
    name: { type: String, index: true },
    gid: { type: Number, index: true }
  },
  //赛季编号
  sid: { type: Number, index: true },
  //比赛所在日期（注：是国内竞彩的对应日期）
  date: { type: String, index: true },
  //开赛时间
  time: { type: Date, index: true },
  //当日代号
  shortcut: { type: String },
  //唯一编号
  mid: { type: Number, index: true, unique: true },
  //信息ID
  iid: { type: Number },
  //是否已结束
  done: { type: Boolean, default: false, index: true },

  //是否为中立场
  neutral: { type: Boolean, default: false },
  //主队
  home: {
    //全称
    fullname: { type: String },
    //缩写
    name: { type: String, index: true },
    //队伍ID
    tid: { type: Number, index: true }
  },
  //客队
  away: {
    fullname: { type: String },
    name: { type: String, index: true },
    tid: { type: Number, index: true }
  },
  //国内竞彩
  jingcai: {
    //胜平负
    spf: {
      //是否开售单关
      //single: { type: Boolean, default: false },
      //成交量：[主胜，平局，客胜]
      trade: [Number],
      //赔率：[主胜，平局，客胜]，变赔时间
      sp: [{ data: [Number], time: Date }]
    },
    //让球胜平负
    rqspf: {
      //让球数
      rq: Number,
      //是否开售单关
      //single: { type: Boolean, default: false },
      //成交量：[主胜，平局，客胜]
      trade: [Number],
      //赔率：[主胜，平局，客胜]，变赔时间
      sp: [{ data: [Number], time: Date }]
    }
  },
  //必发盈亏
  bwin: [Number],

  //各家赔率
  odds: {},
  //赛果
  score: {
    full: {
      home: { type: Number },
      away: { type: Number }
    },
    half: {
      home: { type: Number },
      away: { type: Number }
    }
  },
  //红黄牌
  card: {
    yellow: {
      home: { type: Number },
      away: { type: Number }
    },
    red: {
      home: { type: Number },
      away: { type: Number }
    }
  }
};

//注入博彩公司列表
_.forEach(COMPANY, function (list, type) {
  SchemaProto.odds[type] = {};
  list.forEach(function (cpy) {
    SchemaProto.odds[type][cpy.name] = {
      first: [Number],
      now: [Number]
    };
  });
});

var MatchSchema = new Schema(SchemaProto);

//虚拟属性
['spf', 'rqspf'].forEach(function (jcType) {
  //初赔和终赔
  MatchSchema.virtual('jingcai.' + jcType + '.first').get(function () {
    if (this.jingcai[jcType].sp && this.jingcai[jcType].sp[0]) {
      return this.jingcai[jcType].sp[0].data;
    }
    return undefined;
  });
  MatchSchema.virtual('jingcai.' + jcType + '.now').get(function () {
    if (this.jingcai[jcType].sp && this.jingcai[jcType].sp[0]) {
      return this.jingcai[jcType].sp[this.jingcai[jcType].sp.length - 1].data;
    }
    return undefined;
  });
  //成交比例
  MatchSchema.virtual('jingcai.' + jcType + '.ratio').get(function () {
    if (this.jingcai[jcType].trade && this.jingcai[jcType].trade[0]) {
      var trade = this.jingcai[jcType].trade;
      var total = Math.floor(trade[0] + trade[1] + trade[2]);
      return [trade[0] / total, trade[1] / total, trade[2] / total];
    }
    return undefined;
  });
  //根据比分计算赛果数组
  MatchSchema.virtual('jingcai.' + jcType + '.results').get(function () {
    if (this.score.full.home !== undefined) {
      var o = { home: this.score.full.home, away: this.score.full.away };
      if (jcType === "rqspf") {
        o.home += this.jingcai.rqspf.rq;
      }
      if (o.home > o.away) {
        return [1, 0, 0];
      } else if (o.home === o.away) {
        return [0, 1, 0];
      }
      return [0, 0, 1];
    }
    return undefined;
  });
  //根据比分计算赛果（3/1/0）
  MatchSchema.virtual('jingcai.' + jcType + '.result').get(function () {
    if (this.score.full.home !== undefined) {
      var o = { home: this.score.full.home, away: this.score.full.away };
      if (jcType === "rqspf") {
        o.home += this.jingcai.rqspf.rq;
      }
      if (o.home > o.away) {
        return 3;
      } else if (o.home === o.away) {
        return 1;
      }
      return 0;
    }
    return undefined;
  });
});

//赛果短路径
['result', 'results'].forEach(function (key) {
  MatchSchema.virtual(key).get(function () {
    return this.jingcai.spf[key];
  });
});


//是否为主队
MatchSchema.methods.homeOrAway = function (team) {
  if (this.home.tid === team.tid) {
    return 0;
  } else if (this.away.tid === team.tid) {
    return 1;
  }
  return -1;
}

//是否赢球
MatchSchema.methods.isWin = function (team) {
  if (this.jingcai.spf.result !== undefined) {
    if (this.home.tid === team.tid) {
      return this.jingcai.spf.result;
    } else if (this.away.tid === team.tid) {
      return [3, 1, 0, 0][this.jingcai.spf.result];
    }
  }
  return -1;
}

//查询
MatchSchema.statics.getById = function (mid, callback) {
  this.findOne({ mid: mid }, callback);
}

MatchSchema.statics.getByDate = function (date, callback) {
  this.find({ 'date': date }).sort({ time: 1 }).exec(callback);
}
MatchSchema.statics.getByDateLimit = function (date, limit, callback) {
  this.find({ 'date': date }).limit(limit).sort({ time: 1 }).exec(callback);
}

MatchSchema.statics.getJingcaiByDate = function (date, callback) {
  this.find({ 'date': date, 'simple': false }).sort({ time: 1 }).exec(callback);
}

// 搜索不包含当天的所有数据
MatchSchema.statics.getJingcaiByDateNotToday = function (date, callback) {
  this.find({ 'date': { $ne: date } }).sort({ time: 1 }).exec(callback);
}


MatchSchema.statics.getJingcaiByDate = function (date, callback) {
  this.find({ 'date': date, 'simple': false }).sort({ time: 1 }).exec(callback);
}

MatchSchema.statics.getByTeam = function (team, query, limit, callback) {
  query.time = query.time || Date.now();
  var q;
  if (query.home) {
    q = { 'home.tid': team.tid, done: true };
  } else if (query.away) {
    q = { 'away.tid': team.tid, done: true };
  } else {
    q = { $or: [{ 'home.tid': team.tid }, { 'away.tid': team.tid }], done: true };
  }
  if (query.game) {
    q['game.gid'] = game.gid;
  }
  this.find(q).lt('time', query.time).limit(limit).sort({ time: -1 }).exec(callback);
}

MatchSchema.statics.getByTeams = function (teams, query, limit, callback) {
  query.time = query.time || Date.now();
  var q = { $or: [{ 'home.tid': teams[0].tid, 'away.tid': teams[1].tid }, { 'home.tid': teams[1].tid, 'away.tid': teams[0].tid }], done: true };
  if (query.game) {
    q['game.gid'] = game.gid;
  }
  this.find(q).lt('time', query.time).limit(limit).sort({ time: -1 }).exec(callback);
}

MatchSchema.statics.getByGame = function (game, limit, callback) {
  this.find({ 'game.name': game }).limit(limit).sort({ time: -1 }).exec(callback);
}

MatchSchema.statics.getDoneMatchesByGame = function (game, skip, limit, callback) {
  this.find({ 'game.name': game, done: true }).skip(skip).limit(limit).sort({ time: -1 }).exec(callback);
}

MatchSchema.statics.getDoneMatches = function (skip, limit, callback) {
  this.find({ done: true }).skip(skip).limit(limit).sort({ time: -1 }).exec(callback);
}

MatchSchema.statics.getMatches = function (skip, limit, callback) {
  this.find({}).skip(skip).limit(limit).sort({ time: -1 }).exec(callback);
}

MatchSchema.statics.getMatchesNo = function (limit, callback) {
  this.find({}).limit(limit).sort({ time: -1 }).exec(callback);
}

MatchSchema.statics.getByQuery = function (query, limit, sort, callback) {
  this.find(query).limit(limit).sort(sort).exec(callback);
}

//删除
MatchSchema.statics.removeAll = function (callback) {
  this.remove({}, callback);
}

MatchSchema.statics.removeByDate = function (date, callback) {
  this.remove({ date: date }, callback);
}

mongoose.model('Match', MatchSchema);

module.exports = mongoose.model('Match');
