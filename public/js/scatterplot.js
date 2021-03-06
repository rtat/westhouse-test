// sets up initial static variables
var scatterplot_width = 1000;
var scatterplot_height = 600;
var padding = {top: 50, bottom: 45, left: 60, right: 15};

// global arrays
var public_dataset = [];
var dataArrayX = [];
var dataArrayY = [];

// global non-static variables
var x_axis_label = "Date";
var y_axis_label = "Consumption";

// viz spaces
var test_viz = d3.select('#test-viz-div')
				.append("svg")
				.attr("width", scatterplot_width)
				.attr("height", scatterplot_height);

// tooltip for viz spaces
var test_MouseOverLines;

var query = btoa(JSON.stringify({
  // query: {},
	"aggs" : {
		"values" : {
    		"date_histogram" : {
    			"field" : "time",
    			"interval" : "1d",
    			"format" : "yyyy/MM/dd HH:mm:ss" 
    	  	},
    		"aggs": {
      			"consumption": {
        			"avg": { "field": "value" }
      			}
      		}
    	}
  	}
}));

/* Data retrieval 
 * for nws, localhost:3030: 
 		fetch('http://142.58.183.207:5000/data')
 * for nodemon/app.js, localhost:3000: 
 		fetch('/data')
 */
var dataPromise = fetch('http://142.58.183.207:5000/jdbc/_search?query=' + query).then(function (response) {
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

	dataset.forEach(function(obj) {
		//test viz: converting to date format
		dataArrayX.push(newDateCreator(obj.key_as_string));
		dataArrayY.push(obj.consumption.value);

	});



	drawScatterplot(dataset, dataArrayX, dataArrayY);
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
			.attr("transform", "translate(0,"+(scatterplot_height-padding.bottom)+")")
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
		.attr("y2", scatterplot_height-padding.bottom)
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