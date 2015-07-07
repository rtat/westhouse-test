// sets up initial static variables
var day_height = 400;
var colorLightArray = ["#AEC7E8", "#FFBB78", "#98E98A", "#FF9896", "#C5B0D5", "#C49C94", "#F7B6D2"];
var colorArray = ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD", "#8C564B", "#E377C2"];

// global arrays
var dayArray = [];
var recentSevenArr = [];
var displayed = [false, false, false, false, false, false, false];

// global non-static variables
var margin;
var day_width;
var dayTop_padding;

// viz spaces
var day_viz;

// layer groups for viz spaces
var layerBG, layerData, layerBottomData;

var querySeven = btoa(JSON.stringify({
    query: { filtered: { filter: { range: { time: { gte: 'now-6d' } } } } },
    aggs: {
      series: {
        terms: { field: 'series' },
        aggs: {
          values: {
            'date_histogram': {
              field: 'time',
              format: 'yyyy/MM/dd HH:mm:ss',
              interval: '1h'
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
	// 	"values" : {
 //    		"date_histogram" : {
 //    			"field" : "time",
 //    			"interval" : "1h",
 //    			"format" : "yyyy/MM/dd HH:mm:ss" 
 //    	  	},
 //    		"aggs": {
 //      			"consumption": {
 //        			"avg": { "field": "value" }
 //      			}
 //      		}
 //    	}
 //  	}

}));

/* Data retrieval 
 * for nws, localhost:3030: 
 		fetch('http://142.58.183.207:5000/data')
 * for nodemon/app.js, localhost:3000: 
 		fetch('/data')
 */
var dataPromise = fetch('http://142.58.183.207:5000/jdbc/_search?query=' + querySeven).then(function (response) {
	return response.json();
});

dataPromise.then(function (jsonData) {
	var tempDataset = [];
	
	// for all days query
	// jsonData.aggregations.values.buckets.forEach(function(datum) {

	// for 7 day query
	jsonData.aggregations.series.buckets[0].values.buckets.forEach(function(datum) {	
		tempDataset.push(datum);
	});
	setVariables(tempDataset);
});

function setVariables(dataset) {
	window.addEventListener('resize', resizeBrowser);

	dataset.forEach(function(obj) {
		//day viz: create dayArray for use
		createDay(obj.key_as_string, obj.consumption.value);
	});

	drawDayViz();
}

function resizeBrowser(){
	clearDayViz();
	drawDayViz();
}

/*
 * Dashboard: Day array creation
 */
function createDay(dateString, consumptionValue) {
	var objDate = new Date(dateString);
	var objDay = objDate.getFullYear()+"/"+(objDate.getMonth()+1)+"/"+objDate.getDate();

	var thisHour = {
		hour: objDate.getHours(),
		totalC: consumptionValue
	};

	// Check if day exists, Y: don't create new day N: create new day
	var result = search(objDay);
	if (result == true) {
		// Day exists, push to existing day
		dayArray[dayArray.length-1].hours.push(thisHour);
	} else {
		// New day created
		var thisDay = {
			day: objDay,
			totalC: 0,
			hours: []
		};
	
		thisDay.hours.push(thisHour);
		dayArray.push(thisDay);
	} 

	// Calculate total consumption
    for (var i=0; i < dayArray.length; i++) {
    	var total = 0;
    	var currentArr = dayArray[i].hours;
    	// Go into each hour in the hours array
    	currentArr.forEach(function (obj) {
    		total += obj.totalC;
    	});
    	// Update totalC
    	dayArray[i].totalC = total;
    }	
}

function search(nameKey){
	if (dayArray.length != 0 && dayArray[dayArray.length-1].day == nameKey) {
		return true;
	} else {
		return false;
	}
}
function setupDayViz() {
	day_width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)*0.90;
	day_viz = d3.select('#db-day-div')
				.append("svg")
				.attr("width", day_width)
				.attr("height", day_height);
	margin = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)*0.05;
	dayTop_padding = {top: 100, bottom: 125, left: margin+day_width/14, right: day_width-day_width/14};

	layerBG = day_viz.append("g");
	layerData = day_viz.append("g");
	layerBottomData = day_viz.append("g");
}

function clearDayViz() {
	// Remove current viz
	d3.select("#db-day-div svg").remove();
}

function drawDayViz() {
	setupDayViz();
	// Calculating recent 7 days with values starting from most recent value
	recentSevenArr = dayArray.slice(-7);

	var curX = margin;
	var xDist = (day_width-margin)/7;
	var xArray = [];
	var yArray = [];
	var coordsArray = [];

	// Variables for a day's hours (day bottom viz)
	var curL = margin;
	var curR = margin+xDist;
	var padChange = xDist;
	var padArray = [];
	var totalHourY = [];

	// Create 7 rectangles, Hover = light RGB, Selected = RGB
	recentSevenArr.forEach(function (obj, i) {
		// Check if clicked from array
		var classType;
		if (displayed[i] == true) {
			var rectangle = layerBG.append("rect")
								.attr("x", curX)
								.attr("y", 0)
								.attr("width", xDist)
								.attr("height", 400)
								.attr("fill", colorLightArray[i])
								.attr("stroke", "#cccccc")
								.attr("class", "clicked")
								.attr("id", i)
								.on("click", rectClickedFn)
								.on("mouseover", rectMouseOverFn)
								.on("mouseout", rectMouseOutFn);		
		} else {
			var rectangle = layerBG.append("rect")
								.attr("x", curX)
								.attr("y", 0)
								.attr("width", xDist)
								.attr("height", 300)
								.attr("fill", "#ffffff")
								.attr("stroke", "#cccccc")
								.attr("class", "unclicked")
								.attr("id", i)
								.on("click", rectClickedFn)
								.on("mouseover", rectMouseOverFn)
								.on("mouseout", rectMouseOutFn);
		}
		curX += xDist;

		// Create xArray and yArray
		var xVal = i;
		var yVal = obj.totalC;
		var tempXY = {x: xVal, y: yVal};
		xArray.push(xVal);
		yArray.push(yVal);
		coordsArray.push(tempXY);

		// Vars
		var xArrayHours = [];
		var yArrayHours = [];
		var coordsArrayHours = [];

		obj.hours.forEach(function (obj, index) {
			xArrayHours.push(index);
			yArrayHours.push(obj.totalC);
			totalHourY.push(obj.totalC);
			coordsArrayHours.push({x: index, y: obj.totalC});
		});

		// Dynamic padding for each of the day's hours
		var dayBottom_padding = {top: 320, bottom: 5, left: curL, right: curR};
		padArray.push({p: dayBottom_padding, x: xArrayHours, y: yArrayHours, coord: coordsArrayHours});

		curL += padChange;
		curR += padChange;
	});

	// Calculate xDomain, xRange, xScale, and vice versa for y
	var xyScaleObj = xyScale(xArray, yArray, dayTop_padding, day_height);
	
	// Create line graph of total consumption for each of the 7 days
	drawTopLines(layerData, coordsArray, xyScaleObj.x, xyScaleObj.y);

	// Line graph of specific day, yArr contains all 7 days for comparison
	padArray.forEach(function (obj, index) {
		var xyScaleObjHours = xyScale(obj.x, totalHourY, obj.p, day_height);
		drawBottomLines(layerBottomData, obj.coord, xyScaleObjHours.x, xyScaleObjHours.y, index);
	});	
}

// Returns xScale and yScale
function xyScale (xArr, yArr, p, h) {
	var xDomain = [d3.min(xArr), d3.max(xArr)];
	var xRange = [p.left, p.right];
	var xScale = d3.scale.linear()
					.domain(xDomain)
					.range(xRange);

	var yDomain = [d3.min(yArr), d3.max(yArr)];
	var yRange = [h-p.bottom, p.top];
	var yScale = d3.scale.linear()
					.domain(yDomain)
					.range(yRange);

	var xyObj = {x: xScale, y: yScale};
	return xyObj;
}

// When the rectangle is hovered over, change colour and show hours
var rectMouseOverFn = function(d, i) {
	// Retrieve index
	var colorIndex = colorLightArray[d3.select(this).attr("id")];

	if (d3.select(this).attr("class")=="unclicked") {
		d3.select(this)
			.transition()
			.attr("fill", colorIndex);
	}
}

var rectMouseOutFn = function(d, i) {
	if (d3.select(this).attr("class")=="unclicked") {
		d3.select(this)
			.transition()
			.attr("fill", "#ffffff");
	}
}

var rectClickedFn = function(d, i) {
	// Retrieve which index it is
	var thisIndex = d3.select(this).attr("id");
	var colorIndex = colorLightArray[thisIndex];

	// Unclicked to clicked
	if (d3.select(this).attr("class") == "unclicked") {
		displayed[thisIndex] = true;
		d3.select(this)
			.transition()
			.attr("height", 400)
			.attr("fill", colorIndex)
			.attr("class", "clicked")
		// Show hourly line graph
		d3.select("#hour"+thisIndex)
			.transition()
			.style("opacity", 1);
	} 
	// Clicked to unclicked
	else if (d3.select(this).attr("class") == "clicked") {
		displayed[thisIndex] = false;
		d3.select(this)
			.transition()
			.attr("height", 300)
			.attr("fill", "#ffffff")
			.attr("class", "unclicked");
		// Hide hourly line graph
		d3.select("#hour"+thisIndex)
			.transition()
			.style("opacity", 0);
	}
}

function drawBottomLines(svg, coordPoints, xScale, yScale, id) {
	var lineFunction = d3.svg.line()
					.x(function(d) { return xScale(d.x); })
					.y(function(d) { return yScale(d.y); })
					.interpolate("linear");

	// Checks if rectangle selected, Y: draw bottom lines N: do not display lines
	var opacityCheck;
	if (displayed[id] == true) {
		opacityCheck = 1;
	} else {
		opacityCheck = 0;
	}
	// Draw lines
	svg.append("path")
		.attr("d", lineFunction(coordPoints))
		.attr("id", "hour"+id)
		.attr("stroke", colorArray[id])
		.attr("stroke-width", 2)
		.attr("fill", "none")
		.style("opacity", opacityCheck);
}

function drawTopLines(svg, coordPoints, xScale, yScale) {
	var lineFunction = d3.svg.line()
					.x(function(d) { return xScale(d.x); })
					.y(function(d) { return yScale(d.y); })
					.interpolate("linear");

	// Draw lines
	svg.append("path")
		.attr("d", lineFunction(coordPoints))
		.attr("stroke", "black")
		.attr("stroke-width", 2)
		.attr("fill", "none");

	// Draw points
	svg.selectAll("circle")
		.data(coordPoints)
		.enter()
		.append("circle")
		// .attr("id", function(d, i) {
		// 	return "Consumption " + xScale(d.x);
		// })
		.attr("cx", function (d,i) {
			return xScale(d.x);
		})
		.attr("cy", function (d,i){
			return yScale(d.y);
		})
		.attr("r", 4)
		.attr("fill", "black");
}