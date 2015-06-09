var express = require('express');
var request = require('request');
var path = require('path');

var app = express();

app.use(express.static(path.join(__dirname, 'public')))

app.get('/data', function (req, res) {
    request('http://142.58.183.207:9200/jdbc/_search', {
        method: 'GET',
        
        body: JSON.stringify({
          "aggs" : {
            "values" : {
              "date_histogram" : {
                "field" : "time",
                "interval" : "1M",
                "format" : "yyyy-MM-dd" 
              },
              "aggs": {
                "consumption": {
                  "avg": { "field": "value" }
                }
              }
            }
          }
        })
    }).pipe(res);
})

app.listen(process.env.PORT);