let selected_files = new Set([]);
let all_selected_metrics = {};

function addMetric(metric, div_id) {
	document.getElementById("chart-container").hidden = false;
	const file_name = div_id.split(`-${metric}`)[0];
	
	if (selected_files.has(file_name)) {
		all_selected_metrics[file_name].add(metric);
		add_line(file_name, metric);
	} else {
		all_selected_metrics[file_name] = new Set([metric]);
		selected_files.add(file_name);
		loadData(id, file_name, metric);
	}
	
}

function removeMetric(metric, id) {
	//document.getElementById("chart-container").hidden = false;
	const file_name = id.split(`-${metric}`)[0];
	all_selected_metrics[file_name].delete(metric);
	//console.log(all_selected_metrics[file_name].size);
	remove_line(metric, file_name);
	document.getElementById(`${file_name}-${metric}`).style.backgroundColor= '';
	if (all_selected_metrics[file_name].size === 0){
		selected_files.delete(file_name);
		delete all_selected_metrics[file_name];
		if (selected_files.size === 0) document.getElementById("chart-container").hidden = true;
	}
	// console.log(all_selected_metrics);
	// console.log(selected_files);
}