var request = require('request');

// value
// time

request('http://142.58.183.207:9200/jdbc/_search', {
  method: 'GET',
  
  body: JSON.stringify({

    query: { filtered: { filter: { range: { time: { gte: 'now-6d' } } } } },
    aggs: {
      series: {
        terms: { field: 'series' },
        aggs: {
          values: {
            'date_histogram': {
              field: 'time',
              format: 'yyyy/MM/dd HH:mm:ss',
              interval: '1d'
            },
            aggs: {
              consumption: {
                avg: { field: 'value' }
              }
            }
          }
        }
      }
    }

  // "aggs" : {
  //   "values" : {
  //       "date_histogram" : {
  //         "field" : "time",
  //         "interval" : "10d",
  //         "format" : "yyyy/MM/dd HH:mm:ss" 
  //         },
  //       "aggs": {
  //           "consumption": {
  //             "avg": { "field": "value" }
  //           }
  //         }
  //     }
  //   }


  })

}, function (err, res, body) {
  var result = JSON.stringify(JSON.parse(body.toString('utf8')), null, 2);
  console.log(result);
});