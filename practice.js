var request = require('request');

// value
// time

request('http://142.58.183.207:9200/jdbc/_search', {
  method: 'GET',
  
  body: JSON.stringify({
    // "aggs" : {
    //   "values" : {
    //     "date_histogram" : {
    //     "field" : "time",
    //     "interval" : "2d",
    //     "format" : "yyyy/MM/dd" 
    //     },
    //     "aggs": {
    //     "consumption": {
    //       "avg": { "field": "value" }
    //     }
    //     }
    //   }
    // }
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

  })

}, function (err, res, body) {
  var result = JSON.stringify(JSON.parse(body.toString('utf8')), null, 2);
  console.log(result);
});