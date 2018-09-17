const svg = d3.select("#svg1"),
	margin = {top: 20, right: 20, bottom: 110, left: 40},
	margin2 = {top: 430, right: 20, bottom: 30, left: 40},
	width = +svg.attr("width") - margin.left - margin.right,
	height = +svg.attr("height") - margin.top - margin.bottom,
	height2 = +svg.attr("height") - margin2.top - margin2.bottom;

var x = d3.scaleTime().range([0, width]),
	x2 = d3.scaleTime().range([0, width]),
	y = d3.scaleLinear().range([height, 0]),
	y2 = d3.scaleLinear().range([height2, 0]);

var xAxis = d3.axisBottom(x),
	xAxis2 = d3.axisBottom(x2),
	yAxis = d3.axisLeft(y);

var clip = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0); 

var Line_chart = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("clip-path", "url(#clip)");


var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

