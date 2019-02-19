let data = {};
let overall_metric_values = {};
let overall_select = [];
let max_y_val = 0;
let max_x_value = 0;
let test_line;

const svg = d3.select("#svg1"),
	margin = {top: 20, right: 20, bottom: 110, left: 40},
	margin2 = {top: 530, right: 20, bottom: 30, left: 40},
	width = +svg.attr("width") - margin.left - margin.right,
	height = +svg.attr("height") - margin.top - margin.bottom,
	height2 = +svg.attr("height") - margin2.top - margin2.bottom;

let x = d3.scaleTime().range([0, width]),
	x2 = d3.scaleTime().range([0, width]),
	y = d3.scaleLinear().range([height, 0]),
	y2 = d3.scaleLinear().range([height2, 0]);

let xAxis = d3.axisBottom(x),
	xAxis2 = d3.axisBottom(x2),
	yAxis = d3.axisLeft(y);

const parseTime = d3.timeParse("%Y-%m-%d-%H-%M-%S");

const select = ['gpfsSwapdEnqueue', 'gpfs_i_lookup', 'gpfs_i_permission', 'Cifs2ACL', 'gpfs_f_open', 'gpfs_f_rdwr', 'gpfs_f_release', 'gpfs_i_create', 'gpfs_i_mkdir', 'gpfs_s_read_inode2', 'gpfs_s_delete_inode', 'gpfs_i_getattr', 'gpfsFsyncRange', 'gpfsInodeDelete', 'gpfs_f_fsync', 'gpfs_f_llseek', 'gpfs_i_unlink'];
const colorScale = d3.scaleSequential(d3.interpolateWarm).domain([0, select.length]);

// let brush = d3.brushX()
// 	.extent([[0, 0], [width, height2]])
// 	.on("brush end", brushed);

let zoom = d3.zoom()
	.scaleExtent([1, Infinity])
	.translateExtent([[0, 0], [width, height]])
	.extent([[0, 0], [width, height]])
	.on("zoom", zoomed);

/*
	zoomed: react to scroll event to zoom and adjust the brush as well
*/
function zoomed() {
	if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
	var t = d3.event.transform;
	x.domain(t.rescaleX(x2).domain());
	// let i = 0;
	// selected_metrics_values.forEach(function(val) {
	// 	const id = "#" + val + "_main";
	// 	const line = line1_array[i];
	// 	i = i + 1;
	// 	Line_chart.select(id).attr("d", line);
	// });
	const id = "#t2.gz_gpfs_f_llseek_main";
	Line_chart.select(id).attr("d", line);
	focus.select(".axis--x").call(xAxis);
	context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}


let clip = svg.append("defs").append("svg:clipPath")
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

function loadData(file_name) {

	const file_object = get_file_object(file_name);
	const fields = file_object.fields;
	const timestamp = timestamp;
	overall_select.push(fields);

	const url = `https://s3.us-east-2.amazonaws.com/fstraces/${id}/${file_name}_${timestamp}/final.json`;
	d3.json(url, function (error, d) {

		const local_data = [];
		const metric_value_range = {};

		console.log(d);

		d.forEach(function(data_object) {
			let to_push = {
				date: parseTime(data_object.date),
			}
			select.forEach(function(select_value) {
				const current_value = (data_object[select_value]) ? parseInt(data_object[select_value]) : 0;
				const current_max = (metric_value_range[select_value]) ? parseInt(metric_value_range[select_value]) : 0;
				if (current_value > current_max) metric_value_range[select_value] = current_value;
				to_push[select_value] = (data_object[select_value]) ? current_value : 0;
			});
			local_data.push(to_push);
		});

		data[file_name] = local_data;
		overall_metric_values[file_name] = metric_value_range;

		return 1;

	});
}

function load_test_data() {
	const url = `https://s3.us-east-2.amazonaws.com/fstraces/final.json`;
	const fields = select;
	const file_name = "test";
	d3.json(url, function(err, d) {

		console.log(d);

		const local_data = [];
		const metric_value_range = {};

		d.forEach(function(data_object) {
			let to_push = {
				date: parseTime(data_object.date),
			}
			select.forEach(function(select_value) {
				const current_value = (data_object[select_value]) ? parseInt(data_object[select_value]) : 0;
				const current_max = (metric_value_range[select_value]) ? parseInt(metric_value_range[select_value]) : 0;
				if (current_value > current_max) metric_value_range[select_value] = current_value;
				to_push[select_value] = (data_object[select_value]) ? current_value : 0;
			});
			local_data.push(to_push);
		});

		data[file_name] = local_data;
		overall_metric_values[file_name] = metric_value_range;

		console.log(data);
		rescale_graph();
		// console.log(local_data);
		// console.log(d3.extent(local_data, function(d) { return d.date; }));
		// x.domain(d3.extent(local_data, function(d) { return d.date; }));
		// focus.append("g")
		// 	.attr("class", "axis axis--x")
		// 	.attr("transform", "translate(0," + height + ")")
		// 	.call(xAxis);
		//focus.select("#x-axis").transition().duration(500).call(xAxis);
		add_line("gpfs_f_llseek", "test");
	});
}


function get_file_object(file_name) {
	return files.find((file_object) => file_object.name == file_name);
}

function add_line(metric, file_name) {

	const local_data = data[file_name];
	const metric_value_range = overall_metric_values[file_name];

	const y_max = metric_value_range[metric];

	console.log(`IN ADD FILE FOR ${file_name} and metric ${metric} and the max value is ${y_max}`);


	if (max_y_val < y_max) {
		max_y_val = y_max;
		rescale_graph();
	} else {
		console.log("just add line");
		const line = d3.line().x(function (d) { return x(d.date); }).y(function (d) { return y(d[metric]); });
	    Line_chart.append("path")
	        .datum(local_data)
	        .attr("class", "line")
	        .attr("id", `${file_name}_${metric}_main`)
	        .style("stroke", colorScale(select.indexOf(metric)))
	        .attr("d", line);
	}

}

function remove_line(metric, file_name) {
	if(document.getElementById(`${file_name}_${metric}_main`)) document.getElementById(`${file_name}_${metric}_main`).remove();
}

function rescale_graph() {

	// remove both the axes
	if (document.getElementById(`x-axis`)) document.getElementById(`x-axis`).remove();
	if (document.getElementById(`y-axis`)) document.getElementById(`y-axis`).remove();

	let date_collection = [];
	for (var data_file in data) {
		date_collection = date_collection.concat(d3.extent(data[data_file], function(d) { return d.date; }));
	}

	x.domain(d3.extent(date_collection));
	focus.append("g")
		.attr("class", "axis axis--x")
		.attr("id", "x-axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
	
	y.domain([0, max_y_val]);
	focus.append("g")
		.attr("class", "axis axis--y")
		.attr("id", "y-axis")
		.call(yAxis);

	for (var selection in all_selected_metrics) {
		const current_selection = all_selected_metrics[selection];
		current_selection.forEach((metric) => remove_line(metric, selection));
		current_selection.forEach((metric) => {
			const line = d3.line().x(function (d) { return x(d.date); }).y(function (d) { return y(d[metric]); });
		    Line_chart.append("path")
		        .datum(data[selection])
		        .attr("class", "line")
		        .attr("id", `${selection}_${metric}_main`)
		        .style("stroke", colorScale(select.indexOf(metric)))
		        .attr("d", line);
		});
	}

}

