// sets up initial static variables
var scatterplot_width = 1000;
var scatterplot_height = 600;
var day_width = 700;
var day_height = 400;
var padding = {top: 50, bottom: 45, left: 60, right: 15};
var dayTop_padding = {top: 100, bottom: 125, left: day_width/14, right: day_width-day_width/14};
// var dayBottom_padding = {top: 320, bottom: 0, left: 0, right: 0};
var dayBottom_XY = {x: 0, y: 300};
var colorLightArray = ["#AEC7E8", "#FFBB78", "#98E98A", "#FF9896", "#C5B0D5", "#C49C94", "#F7B6D2"];
var colorArray = ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD", "#8C564B", "#E377C2"];

// global arrays
var public_dataset = [];
var dataArrayX = [];
var dataArrayY = [];
var dayArray = [];
var recentSevenArr = [];

// global non-static variables
var x_axis_label = "Date";
var y_axis_label = "Consumption";

// viz spaces
var test_viz = d3.select('#test-viz-div')
				.append("svg")
				.attr("width", scatterplot_width)
				.attr("height", scatterplot_height);

var day_viz = d3.select('#db-day-div')
				.append("svg")
				.attr("width", day_width)
				.attr("height", day_height);

// layer groups for viz spaces
var layerBG = day_viz.append("g");
var layerData = day_viz.append("g");
var layerBottomData = day_viz.append("g");

// tooltip for viz spaces
var test_MouseOverLines;

/* Data retrieval 
 * for nws, localhost:3030: 
 		fetch('http://142.58.183.207:5000/data')
 * for nodemon/app.js, localhost:3000: 
 		fetch('/data')
 */
var dataPromise = fetch('/data').then(function (response) {
	return response.json();
});

dataPromise.then(function (jsonData) {
	jsonData.aggregations.values.buckets.forEach(function(datum) {
		public_dataset.push(datum);
	});
	setVariables(public_dataset);
});

function setVariables(dataset) {
	dataArrayX = [];
	dataArrayY = [];

	public_dataset.forEach(function(obj) {
		//test viz: converting to date format
		dataArrayX.push(newDateCreator(obj.key_as_string));
		dataArrayY.push(obj.consumption.value);

		//day viz: create dayArray for use
		createDay(obj.key_as_string, obj.consumption.value);
	});

	drawDayViz(dayArray);

	// drawScatterplot(dataset, dataArrayX, dataArrayY);
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

function drawDayViz(dataset) {
	// Calculating recent 7 days with values starting from most recent value
	recentSevenArr = dataset.slice(-7);

	var curX = 0;
	var xDist = day_width/7;
	var xArray = [];
	var yArray = [];
	var coordsArray = [];

	// Variables for a day's hours (day bottom viz)
	var curL = 0;
	var curR = day_width/7;
	var padChange = day_width/7;
	var padArray = [];
	var totalHourY = [];

	// Create 7 rectangles, Hover = light RGB, Selected = RGB
	recentSevenArr.forEach(function (obj, i) {
		var rectangle = layerBG.append("rect")
								.attr("x", curX)
								.attr("y", 0)
								.attr("width", xDist)
								.attr("height", 300)
								.attr("fill", "#ffffff")
								.attr("stroke", "#000000")
								.attr("class", "unclicked")
								.attr("id", i)
								.on("click", rectClickedFn)
								.on("mouseover", rectMouseOverFn)
								.on("mouseout", rectMouseOutFn);
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
		var dayBottom_padding = {top: 320, bottom: 0, left: curL, right: curR};
		padArray.push({p: dayBottom_padding, x: xArrayHours, y: yArrayHours, coord: coordsArrayHours});
		// var xyScaleObjHours = xyScale(xArrayHours, yArrayHours, dayBottom_padding, day_height);

		// // Might push to array, need the real min max for y
		// drawBottomLines(layerBottomData, coordsArrayHours, xyScaleObjHours.x, xyScaleObjHours.y, i);

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
	var colorIndex = colorArray[thisIndex];

	// Unclicked to clicked
	if (d3.select(this).attr("class") == "unclicked") {
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

	// Draw lines
	svg.append("path")
		.attr("d", lineFunction(coordPoints))
		.attr("id", "hour"+id)
		.attr("stroke", "black")
		.attr("stroke-width", 2)
		.attr("fill", "none")
		.style("opacity", 0);;
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

/*
 *	Scatterplot visualization
 */
function newDateCreator(d) {
	return new Date(d);
}

function drawScatterplot(dataset, dataX, dataY) {
	var xDomain = [d3.min(dataX), d3.max(dataX)];
	var xRange = [padding.left, scatterplot_width-padding.right];
	var xScale = d3.time.scale()
				.range(xRange)
				.domain(xDomain);

	var yDomain = [d3.min(dataY), d3.max(dataY)];
	var yRange = [scatterplot_height-padding.bottom, padding.top];
	var yScale = d3.scale.linear()
				.range(yRange)
				.domain(yDomain);

	drawXAxis(xScale);
	drawYAxis(yScale);

	test_MouseOverLines = d3.select("#test-viz-div svg").append("g")
			.attr("id", "lines-group");

	// creates points
	var coordPoints = convertToCoords(dataX, dataY);
	drawPoints(test_viz, coordPoints, xScale, yScale);

}

// draws the scaled x-axis with its label
function drawXAxis(xScale){
	var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom");

	test_viz.append("g")
			.attr("class", "axis")
			.attr("id", "x-axis")
			.attr("transform", "translate(0,"+(height-padding.bottom)+")")
			.call(xAxis);

	d3.select("#x-axis")
			.append("text")
			.attr("x", scatterplot_width / 2)
			.attr("y", 40)
			.style("text-anchor", "middle")
			.text(x_axis_label);
}

// draws the scaled y-axis with its label
function drawYAxis(yScale){
	var yAxis = d3.svg.axis()
	  		.scale(yScale)
	  		.orient("left");

	test_viz.append("g")
			.attr("class", "axis")
			.attr("id", "y-axis")
			.attr("transform", "translate("+padding.left+",0)")
			.call(yAxis);

	d3.select("#y-axis")
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", -(scatterplot_height / 2))
			.attr("y", -45)
			.style("text-anchor", "middle")
			.text(y_axis_label);
}

function convertToCoords(dataX, dataY) {
		var newArray = [];
		for (var i = 0, len = dataX.length; i < dataX.length; i++) {
			var tempObject = {x: dataX[i], y: dataY[i], id: i};
			newArray.push(tempObject);
		}
		return newArray;
}

function drawPoints(svg, coordPoints, xScale, yScale) {
	svg.selectAll("circle")
		.data(coordPoints)
		.enter()
		.append("circle")
		.attr("id", function(d, i) {
			return "Consumption " + xScale(d.x);
		})
		.attr("cx", function (d,i) {
			return xScale(d.x);
		})
		.attr("cy", function (d,i){
			return yScale(d.y);
		})
		.attr("r", 4)
		.attr("fill", "purple")
		.attr("class", "unclicked")
		// .on("click", scatterClickedFn)
		.on("mouseover", scatterMouseOverFn)
		.on("mouseout", scatterMouseOutFn);

}

var scatterMouseOverFn = function(d, i) {
	var point = d3.select(this);
	// current point will increase in radius
	point
		.transition()
		.attr("r", 8);

	var currentObj = public_dataset[d.id];

	// draws tooltip
	d3.select("#tooltip-test")
		.style("visibility", "visible")
		.style("top", (d3.event.pageY-15)+"px").style("left",(d3.event.pageX+20)+"px")
		.html("<strong>" + currentObj.key_as_string+ "</strong>" +
			"<p>Consumption: "+currentObj.consumption.value+"</p>");


	// draws guidelines
	test_MouseOverLines.append("line")
		.attr("id", "x-line")
		.attr("x1", point.attr("cx"))
		.attr("y1", point.attr("cy"))
		.attr("x2", point.attr("cx"))
		.attr("y2", height-padding.bottom)
		.style("stroke", "black")
		.style("opacity", 0.3);

	test_MouseOverLines.append("line")
		.attr("id", "y-line")
		.attr("x1", point.attr("cx"))
		.attr("y1", point.attr("cy"))
		.attr("x2", padding.left)
		.attr("y2", point.attr("cy"))
		.style("stroke", "black")
		.style("opacity", 0.3);
}

var scatterMouseOutFn = function(d, i) {
	if (d3.select(this).attr("class")=="unclicked") {
		d3.select(this)
			.transition()
			.attr("r", 4);
	}

	test_MouseOverLines.select("#x-line").remove();
	test_MouseOverLines.select("#y-line").remove();

	d3.select("#tooltip-test").style("visibility", "hidden");
}