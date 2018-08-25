
const select = ['gpfsSwapdEnqueue', 'gpfs_i_lookup', 'gpfs_i_permission', 'Cifs2ACL', 'gpfs_f_open', 'gpfs_f_rdwr', 'gpfs_f_release', 'gpfs_i_create', 'gpfs_i_mkdir', 'gpfs_s_read_inode2', 'gpfs_s_delete_inode', 'gpfs_i_getattr', 'gpfsFsyncRange', 'gpfsInodeDelete', 'gpfs_f_fsync', 'gpfs_f_llseek', 'gpfs_i_unlink'];
const colorScale = d3.scaleSequential(d3.interpolateWarm).domain([0, select.length]);

let data = [];
let selected_metrics_values = [];
var line1_array = [];
var line2_array = [];

const svg = d3.select("#svg1"),
	margin = {top: 20, right: 20, bottom: 110, left: 40},
	margin2 = {top: 530, right: 20, bottom: 30, left: 40},
	width = +svg.attr("width") - margin.left - margin.right,
	height = +svg.attr("height") - margin.top - margin.bottom,
	height2 = +svg.attr("height") - margin2.top - margin2.bottom;
const parseTime = d3.timeParse("%Y-%m-%d-%H-%M-%S");

let x = d3.scaleTime().range([0, width]),
	x2 = d3.scaleTime().range([0, width]),
	y = d3.scaleLinear().range([height, 0]),
	y2 = d3.scaleLinear().range([height2, 0]);

let xAxis = d3.axisBottom(x),
	xAxis2 = d3.axisBottom(x2),
	yAxis = d3.axisLeft(y);

let brush = d3.brushX()
	.extent([[0, 0], [width, height2]])
	.on("brush end", brushed);

let zoom = d3.zoom()
	.scaleExtent([1, Infinity])
	.translateExtent([[0, 0], [width, height]])
	.extent([[0, 0], [width, height]])
	.on("zoom", zoomed);

var clip = svg.append("defs").append("svg:clipPath")
	.attr("id", "clip")
	.append("svg:rect")
	.attr("width", width)
	.attr("height", height)
	.attr("x", 0)
	.attr("y", 0); 


const Line_chart = svg.append("g")
	.attr("class", "focus")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	.attr("clip-path", "url(#clip)");


var focus = svg.append("g")
	.attr("class", "focus")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
	.attr("class", "context")
	.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");


if (!files.length) {
	document.getElementById("chart-container").hidden = true;
	document.getElementById("no-data-message").innerHTML = "No data to load.";
} else {
	loadData();
}

/*
	on clicking #add_metric: adds a metric to the chart
	params:
		e: click event
*/

$("#add_metric").on("click", function(e) {

	// the metric to be added 
	const select_value = document.getElementById("add_metric_value").value;

	if (selected_metrics_values.indexOf(select_value) < 0) {
		const color = colorScale(select.indexOf(select_value)).toString();
		console.log(color);
		$("#selected_metrics").append("<span style='background-color:" + color + ";' id='" + select_value + "' class='badge' onclick='removeMetric(this.id);'>" + select_value + '</span>');

		// current y-axis domain
	    const current_max_y = y.domain();

	    // if the max of the new data to be added is greater than the graph's current max 
	    // value in domain then the y-axis needs to be rescaled
	    if (metric_value_range[select_value] > current_max_y[1]) {
	       selected_metrics_values.push(select_value);
	       resetGraph();
	    } else {
	    	// if the y-axis does not have to be rescaled then we can just add the line
			addMetric(select_value);
			selected_metrics_values.push(select_value);
	    }
	}

});


function loadData() {
	//resetGraph();
	d3.json(`https://s3.us-east-2.amazonaws.com/fstraces/${id}/final.json`, function (error, d) {
	    if (error) throw error;
	  	document.getElementById("loading").innerHTML = "";
	  	$(".loading-container").hide();
	  	data = [];
	  	metric_value_range = {};

		d.forEach(function(data_object) {
			to_push = {
				date: parseTime(data_object.date),
			}
			select.forEach(function(select_value) {
				const current_value = (data_object[select_value]) ? parseInt(data_object[select_value]) : 0;
				const current_max = (metric_value_range[select_value]) ? parseInt(metric_value_range[select_value]) : 0;
				if (current_value > current_max) metric_value_range[select_value] = current_value;
				to_push[select_value] = (data_object[select_value]) ? current_value : 0;
			});
			data.push(to_push);
		});

		const select_dom = document.getElementById('add_metric_value');
		select.forEach(function(op) {
			const option_dom = document.createElement('option');
			option_dom.value = op;
			option_dom.innerHTML = op;
			select_dom.append(option_dom);
		});

	  	select_dom.value="gpfs_i_unlink";

		x.domain(d3.extent(data, function(d) { return d.date; }));
		y.domain([0, d3.max(data, function (d) { return parseInt(d.gpfs_i_unlink); })]);
		x2.domain(x.domain());
		y2.domain(y.domain());

		focus.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		focus.append("g")
			.attr("class", "axis axis--y")
			.attr("id", "y-axis")
			.call(yAxis);

		context.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height2 + ")")
			.call(xAxis2);

		context.append("g")
			.attr("class", "brush")
			.call(brush)
			.call(brush.move, x.range());

		svg.append("rect")
			.attr("class", "zoom")
			.attr("width", width)
			.attr("height", height)
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.call(zoom);


	});
}

/*
	addMetric: adds a line to the graph 
	params:
		select_value: the name of the metric to be added
*/
function addMetric(select_value) {
	// get the index of the metric value from the array of metrics to 
	// get the corresponding color 
	const select_index = select.indexOf(select_value);
	const line = d3.line().x(function (d) { return x(d.date); }).y(function (d) { return y(d[select_value]); });
	const line2 = d3.line().x(function (d) { return x2(d.date); }).y(function (d) { return y2(d[select_value]); });
	line1_array.push(line);
	line2_array.push(line2);
    Line_chart.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("id", select_value+"_main")
        .style("stroke", colorScale(select_index))
        .attr("d", line);
    context.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("id", select_value+"_context")
        .style("stroke", colorScale(select_index))
        .attr("d", line2);

}

/*
	removeMetric: remove metric rom the chart 
	params:
		select_value: the name of the metric to be added
*/
function removeMetric(select_value) {
	selected_metrics_values.splice(selected_metrics_values.indexOf(select_value), 1);
	document.getElementById(select_value).remove();
	resetGraph();
}

/*
	resetGraph: resets the graph based on the metrics selected mainly to rescale the graph and 
	plot the values again to fit the scale
*/
function resetGraph() {
	
	line1_array = [];
	line2_array = [];

	// if there is no element in selected metrics array then remove all the lines in the array 
	// this is for when the only line in the graph is removed 
	if (!selected_metrics.length) d3.selectAll(".line").remove();

	// getting the max y_val for the y-axis domain and removing the existing lines in the graph
	let max_y_val = 0;
	selected_metrics_values.forEach(function(val) {
		if (metric_value_range[val] > max_y_val) max_y_val = metric_value_range[val];
		if (document.getElementById(val +"_main")) removeMetric(val);
	});

	// first setting the graph to the correct scale then adding the lines
	y.domain([0, max_y_val]);
	y2.domain(y.domain());

	focus.select("#y-axis").transition().duration(1500).call(yAxis);
	// Line_chart.select("#y-axis").transition().duration(1500).call(yAxis);
	// context.select("#y-axis").transition().duration(1500).call(yAxis);
	selected_metrics_values.forEach(function(val) {
		addMetric(val);
	});
}

/*
	brushed: react to the brush action on the smaller graph to adjust the main graph
*/
function brushed() {
	if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
	var s = d3.event.selection || x2.range();
	x.domain(s.map(x2.invert, x2));
	let i = 0;
	selected_metrics_values.forEach(function(val) {
		const id = "#" + val + "_main";
		const line = line1_array[i];
		i = i + 1;
		Line_chart.select(id).attr("d", line);
	});
	focus.select(".axis--x").call(xAxis);
	svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
		.scale(width / (s[1] - s[0]))
		.translate(-s[0], 0));
}

/*
	zoomed: react to scroll event to zoom and adjust the brush as well
*/
function zoomed() {
	if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
	var t = d3.event.transform;
	x.domain(t.rescaleX(x2).domain());
	let i = 0;
	selected_metrics_values.forEach(function(val) {
		const id = "#" + val + "_main";
		const line = line1_array[i];
		i = i + 1;
		Line_chart.select(id).attr("d", line);
	});
	focus.select(".axis--x").call(xAxis);
	context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

// socket.on("metricChange", function (data) {
// 	loadData();
// 	console.log("INSIDE METRIC CHANGE")
//     $('#new_data_alert').show();
//     $('html, body').animate({ scrollTop: $('#new_data_alert').offset().top }, 'slow');
// });

var socket = io(`localhost`, {
	transports: [ 'websocket' ],
	upgrade: false
});

const extract_socket_name = `extract_${id}`;
socket.on(extract_socket_name, function (data) {
	console.log(data);
	lambda_needed = lambda_needed + data.num_blocks;
    const width = (lambda_completed/(lambda_needed + 1)) * 100;
    $('#metric-bar').css('width', width + "%");
    $('#metric-status').text("Metric Calculation in Progress.")
});

const lambda_done_socket_name = `lambda_${id}`;
socket.on(lambda_done_socket_name, function () {
	console.log("LAMBDAAA");
	lambda_completed = lambda_completed + 1;
    const width = (lambda_completed/(lambda_needed + 1)) * 100;
    $('#metric-bar').css('width', width + "%");
});

const calculation_done_socket_name = `calculation_done_${id}`;
socket.on(calculation_done_socket_name, function () {
	console.log("DONEEEEEEEE");
    $('#metric-bar').css('width', 100 + "%");
    $('#new_data_alert').show();
    $('html, body').animate({ scrollTop: $('#new_data_alert').offset().top }, 'slow');
    $('#metric-status').text("Metric Calculation Complete!")
});

socket.on(id, function (data) {
	console.log("DONEEEEEEEE");
	console.log(data);
});





