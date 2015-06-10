// sets up initial static variables
var width = 1000;
var height = 600;
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
				.attr("width", width)
				.attr("height", height);

// data retrieval
var dataPromise = fetch('/data').then(function (response) {
	return response.json();
});

dataPromise.then(function (jsonData) {
	jsonData.aggregations.values.buckets.forEach(function(datum) {
		// console.log(datum);
		public_dataset.push(datum);
	});
	// console.log(public_dataset);
	setVariables(public_dataset);
});

function setVariables(dataset) {
	dataArrayX = [];
	dataArrayY = [];


	public_dataset.forEach(function(obj) {
		dataArrayX.push(obj.key_as_string);
		dataArrayY.push(obj.consumption.value);
		console.log(obj.key_as_string);
		// console.log(obj.consumption.value);
	});

	drawScatterplot(dataset, dataArrayX, dataArrayY);
}

// function find
function drawScatterplot(dataset, dataX, dataY) {
	var xDomain = [d3.min(dataX), d3.max(dataX)];
	var xRange = [padding.left, width-padding.right];
	var xScale = d3.scale.linear()
				.range(xRange)
				.domain(xDomain);

	var yDomain = [d3.min(dataY), d3.max(dataY)];
	var yRange = [height-padding.bottom, padding.top];
	var yScale = d3.scale.linear()
				.range(yRange)
				.domain(yDomain);

	drawXAxis(xScale);
	drawYAxis(yScale);
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