console.log("render_graph.js");




/*
	This function renders the containers that they need for file list
*/
function renderFileListContainer() {

	// this is done to maintain the bootstrap consistency I cannot have
	// a row inside a row I need to have a row then a column and then I
	// can again have rows inside the column
	const main_row = document.createElement("div");
	main_row.className = "row card";
	const main_col = document.createElement("div");
	main_col.className = "col-xs-12";
	main_col.id = "file-list-container";

	// creating the title text
	const title_text = document.createElement("p");
	title_text.className = "title-text";
	title_text.innerHTML = "Files";

	main_row.append(title_text);
	main_row.append(main_col);

	// attaching it to the main container
	// the getelements function returns an array and here I am assuming
	// that there is no other element by the class name "container" which
	// is a fair assumption
	document.getElementById("graphContainer").append(main_row);


	fileCount = 0 // the file count provides a unique id to each file 
	files.forEach((file) => {
		addFile(file, "PROCESSED.", fileCount);
		fileCount++;
	});

}

/*
	This function creates and attaches the content to display for each file
*/
function addFile(file, file_status, fileCount) {

	const file_list_container = document.getElementById("file-list-container");

	const file_row = document.createElement("div");
	file_row.className = "row card";
	file_row.id = `${file.name}-main`;

	// the first row of the file_row will contain name and the progress bar
	const wrapper = document.createElement("div");
	wrapper.className="col-xs-12";
	const file_name_progress = document.createElement("div");
	file_name_progress.className="row";

	// creating the file name portion
	const file_name_col = document.createElement("div");
	file_name_col.className = "col-xs-3";
	const file_name = document.createElement("p");
	file_name.style.font = "1.4em bold";
	file_name.innerHTML = file.name;

	// creating the progress bar
	const progress_bar_col = document.createElement("div");
	progress_bar_col.className = "col-xs-9";
	const progress_bar = document.createElement("div");
	progress_bar.id = `${file.name}-progress`;
	progress_bar.style.padding = "1px";
	progress_bar.style.margin = "0 0 0 5px";

	const progress_bar_status = document.createElement("span");
	progress_bar_status.innerHTML = file_status;
	progress_bar_status.style.display = "block";
	progress_bar_status.style.font = "1.2em bold";
	progress_bar_status.style.margin = "10px";

	// defining metric row here because otherwise it is giving me metric
	// row is not defined error
	let metric_row, metrics;

	// process things differently based on the file status
	if (file_status == "PROCESSED.") {

		file_row.style.borderColor = "green";

		// the second row will contain list of metrics
		metrics = document.createElement("div");
		metrics.className="row";


		progress_bar.style.width = "100%";
		progress_bar.style.backgroundColor = "green";
		progress_bar_status.style.color = "white";

		// now need to add metric buttons
		metric_col = document.createElement("div");
		metric_col.className = "col-xs-12";

		file.fields.forEach((field) => {
			if (field != "date") {
				const metric_button = document.createElement("button");
				metric_button.className = "btn btn-light metric_button";
				metric_button.id = `${file.name}-${field}`;
				metric_button.innerHTML = field;
				metric_button.style.margin = "5px 1px 0px 1px";
				metric_col.append(metric_button);
			}
		});

		other_fields=["IO_SIZE_DIST"]
		other_fields.forEach((field) => {
			if (field != "date") {
				const metric_button = document.createElement("button");
				metric_button.className = "btn btn-light io_size_dist_button";
				metric_button.id = `${file.name}-${field}`;
				metric_button.innerHTML = field;
				metric_button.style.margin = "5px 1px 0px 1px";
				metric_col.append(metric_button);
			}
		});

		metrics.append(metric_col);
	} else if (file_status == "UPLOADING.") {
		file_row.style.borderColor = "#3399ff";
		progress_bar.style.width = "0%";
		progress_bar.style.backgroundColor = "#3399ff";
		progress_bar_status.style.color = "black";

	} else {
		file_row.style.borderColor = "#ffcc66";
		progress_bar.style.width = (file.done/file.need)*100 + "%";
		progress_bar.style.backgroundColor = "#ffcc66";
		progress_bar_status.style.color = "black";
	}

	// append in order of smaller element moving to their parent elements
	progress_bar.append(progress_bar_status);
	file_name_col.append(file_name);
	progress_bar_col.append(progress_bar);

	// adding the file name and progress container together
	file_name_progress.append(file_name_col);
	file_name_progress.append(progress_bar_col);
	wrapper.append(file_name_progress);
	if (file_status == "PROCESSED.") wrapper.append(metrics);

	const graph_wrap = document.createElement("div");
	graph_wrap.className = "row";
	graph_wrap.id = `gwrap${fileCount}`;
	graph_wrap.style.border = "red 5px solid";

	file_row.append(wrapper);
	//file_row.append(graph_wrap);

	file_list_container.append(file_row);
	file_list_container.append(graph_wrap);

	// const graph_row = document.createElement("div");
	// graph_row.className = "row card";
	// graph_row.id = `${file.name}-chart-container`;

	// const graph_col = document.createElement("div");
	// graph_row.className = "col-xs-12";

	loadGraph(fileCount, `${file.name}_${file.timestamp}`, file);

	// console.log(file_meta);

}


function loadGraph(fileCount, fileName, fileObject) {

	const svg = d3.select(`#gwrap${fileCount}`).append("svg")
		.attr("width", 1100)
		.attr("height", 500)
		.attr("id", `svg${fileCount}`),
		margin = {top: 20, right: 20, bottom: 110, left: 40},
		margin2 = {top: 530, right: 20, bottom: 30, left: 40},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
		height2 = +svg.attr("height") - margin2.top - margin2.bottom;

	file_meta[fileName]["graph"]["svg"] = svg;

	console.log(`height is ${height}`);

	let x = d3.scaleTime().range([0, width]),
		x2 = d3.scaleTime().range([0, width]),
		y = d3.scaleLinear().range([height, 0]),
		y2 = d3.scaleLinear().range([height2, 0]);

	file_meta[fileName]["graph"]["x"] = x;
	file_meta[fileName]["graph"]["y"] = y;
	file_meta[fileName]["graph"]["x2"] = x2;
	file_meta[fileName]["graph"]["y2"] = y2;

	let xAxis = d3.axisBottom(x),
		xAxis2 = d3.axisBottom(x2),
		yAxis = d3.axisLeft(y);

	file_meta[fileName]["graph"]["xAxis"] = xAxis;
	file_meta[fileName]["graph"]["yAxis"] = yAxis;
	file_meta[fileName]["graph"]["xAxis2"] = xAxis2;

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

	file_meta[fileName]["graph"]["lineChart"] = Line_chart;

	var focus = svg.append("g")
		.attr("class", "focus")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	file_meta[fileName]["graph"]["focus"] = focus;
	file_meta[fileName]["metrics"].push(fileObject.fields[0]);

	//console.log(fileObject.fields)

	loadData(fileObject, fileName);

	

}

function loadData(fileObject, fileName) {

	const fields = fileObject.fields;
	const timestamp = fileObject.timestamp;

	const url = `https://s3.us-east-2.amazonaws.com/fstraces/${id}/${fileObject.name}_${timestamp}/final.json`;

	// THERE IS NO MIN MAX STORE

	d3.json(url, function (error, d) {

		console.log("in de")
		console.log(file_meta)

		const local_data = [];
		const metric_value_range = {};

		d.forEach(function(data_object) {
			const parseTime = d3.timeParse("%Y-%m-%d-%H-%M-%S");
			let to_push = {
				date: parseTime(data_object.date),
			}

			fields.forEach(function(select_value) {
				const current_value = (data_object[select_value]) ? parseInt(data_object[select_value]) : 0;
				to_push[select_value] = (data_object[select_value]) ? current_value : 0;
			});

			// converting from dict to array 
			file_meta[fileName]["data"].push(to_push);
			file_meta[fileName]["content"].push(to_push);

		});


		data_final = file_meta[fileName]["data"]
		
		rescaleGraph(fileObject, fileName);

		return 1;

	});

}


function addLine(metric, fileName) {

	const local_data = file_meta[fileName]["data"];
	const colorScale = d3.scaleSequential(d3.interpolateWarm).domain([0, 25]);

	const line = d3.line().x(function (d) { return x(d.date); }).y(function (d) { return y(d[metric]); });
    file_meta[fileName]["graph"]["lineChart"].append("path")
        .datum(local_data)
        .attr("class", "line")
        .attr("id", `${fileName}_${metric}_main`)
        .style("stroke", colorScale(1))
        .attr("d", line);
	

}

function rescaleGraph(fileObject, fileName) {

	let cur_file_meta = file_meta[fileName];
	let data = cur_file_meta.data

	let date_collection = [];
	date_collection = date_collection.concat(d3.extent(data, function(d) { return d.date; }));

	let xAxis = file_meta[fileName]["graph"]["xAxis"];
	let x = file_meta[fileName]["graph"]["x"];
	let y = file_meta[fileName]["graph"]["y"];
	let yAxis = file_meta[fileName]["graph"]["yAxis"];
	height = 370;

	const colorScale = d3.scaleSequential(d3.interpolateWarm).domain([0, 25]);

	console.log(d3.extent(date_collection));

	x.domain(d3.extent(date_collection));
	file_meta[fileName]["graph"]["focus"].append("g")
		.attr("class", "axis axis--x")
		.attr("id", "x-axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
	
	y.domain([0, 1000]);
	file_meta[fileName]["graph"]["focus"].append("g")
		.attr("class", "axis axis--y")
		.attr("id", "y-axis")
		.call(yAxis);

	let curSelect = file_meta[fileName]["metrics"][0];
	const line = d3.line().x(function (d) { return x(d.date); }).y(function (d) { return y(d[curSelect]); });
	file_meta[fileName]["graph"]["lineChart"].append("path")
		.datum(file_meta[fileName]["data"])
		.attr("class", "line")
		.attr("id", `${fileName}_${curSelect}_main`)
		.style("stroke", colorScale(1))
		.attr("d", line);

}