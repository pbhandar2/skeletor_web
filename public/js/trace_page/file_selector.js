let selected_files = [];
let all_selected_metrics = {};

/*
	This function is called when a user cliks on a file to add that data
	to the chart. This will do a UI update to show the file name, metric
	options for the file, and a button to remove the file. This will also
	call the function loadData() which will load the data for the chart to
	be available to use it. 
*/
$("#add-file").click(function(){
	const select_element = document.getElementById("file-selector");
	const selected_file = select_element.value;

	if (select_element.value != "none" && selected_files.indexOf(selected_file) < 0 && selected_files.length < 1) {
		const file_selected_div = document.getElementById("files-selected-list");
		
		// updating the selected file array with the file name 
		// updating the selected metrics to have an entry for this file 
		selected_files.push(selected_file);
		all_selected_metrics[selected_file] = [];

		// creating the main wrapper for all the other elements
		const main_wrapper = document.createElement("div");
		main_wrapper.id = selected_file;
		main_wrapper.className = "row";

		// creating the file name portion 
		const file_name_wrapper = document.createElement("div");
		file_name_wrapper.className = "col-xs-3";
		const file_name_p_element = document.createElement("p");
		file_name_p_element.className = "content-test";
		file_name_p_element.innerHTML = selected_file;
		file_name_wrapper.appendChild(file_name_p_element);

		// creating the selector field
		const select_element_wrapper = document.createElement("div");
		select_element_wrapper.className = `col-xs-4 ${selected_file}`;
		const file_object = files.find((file) => file.name == selected_file);
		const file_select_element = create_selected_file_element(file_object.fields);
		file_select_element.id = "selected-metric";
		select_element_wrapper.appendChild(file_select_element);

		// add metric button
		const add_button_wrapper = document.createElement("div");
		add_button_wrapper.className = `col-xs-1 ${selected_file}`;
		const add_metric_button = document.createElement("button");
		add_metric_button.className = `btn btn-success`;
		add_metric_button.id = "add-selected-metric";
		add_metric_button.innerHTML = "Add Metric";
		add_button_wrapper.appendChild(add_metric_button);

		// filler div to just space out the elements
		const filler_div = document.createElement("div");
		filler_div.className = "col-xs-2";
		
		// create the remove button 
		const remove_button_wrapper = document.createElement("div");
		remove_button_wrapper.className = `col-xs-2 ${selected_file}`;
		const remove_button = document.createElement("button");
		remove_button.className = `btn btn-danger`;
		remove_button.id = `remove-selected-file`;
		remove_button.innerHTML = "Remove File";
		remove_button_wrapper.appendChild(remove_button);

		// now creating the area where selected metrics will be displayed for each file 
		selected_metrics_area_wrapper = document.createElement("div");
		selected_metrics_area_wrapper.className = "row";
		selected_metrics_area = document.createElement("div");
		selected_metrics_area.id = `selected-metric-area-${selected_file}`;
		selected_metrics_area_wrapper.appendChild(selected_metrics_area);

		// appending everything to the main wrapper and then appending that to the list div
		main_wrapper.appendChild(file_name_wrapper);
		main_wrapper.appendChild(select_element_wrapper);
		main_wrapper.appendChild(add_button_wrapper);
		main_wrapper.appendChild(filler_div);
		main_wrapper.appendChild(remove_button_wrapper);
		main_wrapper.appendChild(selected_metrics_area);

		file_selected_div.appendChild(main_wrapper);

	}

	// loading the data for that particular file into the chart
	loadData(selected_file);

});


/*
	This function creates a select element for each file. This allows the
	user to have multiple files loaded on a graph and to select indivudual
	metrics from each file. 

	params:
		file_object: The file object which contains the fields or the options
		that the users need to be able to select
*/
function create_selected_file_element(fields) {
	let select_element = document.createElement("select");
	select_element.className = `form-control`;

	fields.forEach((field) => {
		const option_element = document.createElement("option");
		option_element.value = field;
		option_element.innerHTML = field;
		select_element.appendChild(option_element);
	});

	return select_element;
}

/*
	This function removes a selected file's data from the overall data of the chart. 
	It makes a UI change where it removes the file and its selected metrics from the 
	selected files list and then removes all data relevant to this file from the chart.
*/
$(document).on('click', '#remove-selected-file', function(){ 
	const file_name = this.parentNode.className.split(" ").pop();
    const id_to_remove = this.parentNode.parentNode.id;
    selected_files.splice(selected_files.indexOf(id_to_remove), 1);
    all_selected_metrics[file_name] = undefined;
    this.parentNode.parentNode.remove();
});

/*
	This function add the selected metrics to the chart and the list of selected metrics. 
	It makes a UI change where it adds the metric to the list of selected metrics for the
	relevant file and also adds a line to the graph for this metric, file combination.
*/
$(document).on('click', '#add-selected-metric', function(){ 
	const add_metric_value = document.getElementById("selected-metric").value;
	const file_name = this.parentNode.className.split(" ").pop();
	const selected_metrics = all_selected_metrics[file_name];

	if (selected_metrics.indexOf(add_metric_value) < 0) {
		const selected_metrics_area = document.getElementById(`selected-metric-area-${file_name}`);
		all_selected_metrics[file_name].push(add_metric_value);
		const color = "red";

		// createa a span element so that everything is in line
		const span_element = document.createElement("span");
		span_element.style = `background-color:${color};`;
		span_element.id = "metric-badge";
		span_element.className = "badge";
		span_element.innerHTML = add_metric_value;

		selected_metrics_area.appendChild(span_element);
	}

	add_line(add_metric_value, file_name);


});

$(document).on('click', '#metric-badge', function(){
	const metric = this.innerHTML;
	const file_name = this.parentNode.id.split("selected-metric-area-").pop();
	this.remove();
	all_selected_metrics[file_name].splice(all_selected_metrics[file_name].indexOf(metric), 1);
	remove_line(metric, file_name);
});

$(document).on('click', '#test-loader', function(){
	console.log("this is hte test loader.");
	load_test_data();
});


