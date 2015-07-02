var express = require('express');
var request = require('request');
var path = require('path');

var app = express();

app.use(express.static(path.join(__dirname, 'public')))

app.get('/data', function (req, res) {
  req.query.interval

  request('http://142.58.183.207:5000/jdbc/_search?query=' + new Buffer(JSON.stringify({
      "aggs" : {
        "values" : {
          "date_histogram" : {
          "field" : "time",
          "interval" : "1h",
          "format" : "yyyy/MM/dd HH:mm:ss" 
          },
          "aggs": {
          "consumption": {
            "avg": { "field": "value" }
          }
          }
        }
      }
    })).toString('base64'), {
    method: 'GET'

  }).pipe(res);
})

app.listen(3000);
console.log('listening on port 3000');