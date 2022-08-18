var _ = require('lodash'),
  eventproxy = require('eventproxy'),
  dbconfig = require('./app/configs/database'),
  converter = require('./app/utils/converter');
var Match = require('./app/models/match'),
  Team = require('./app/models/team');
var toMongoose = require('./app/utils/connection');




const queryBackMatch = function (e, match) {
  if (!e) {
    console.log(match.length);
    if (match.length === undefined) {
      _.forEach(match, function (value, key) {
        console.log(value, "value");
      })
    }
    else if (match.length > 0) {
      match.forEach(item => {
        _.forEach(item, function (value, key) {
          console.log(value, "value");
        })
      })
    } else {
      console.log("DATA ERROR");
    }
  }
}


const queryBackTeam = function (err, team) {
  if (!err) {
    if (team.length === undefined) {
      console.log(team);
    } else {
      console.log("DATA ERROR");
    }
  }
}

Match.getByQuery({ 'date': "2022-08-09" }, 10, { time: -1 }, queryBackMatch)
Team.getById(1605, queryBackTeam)
