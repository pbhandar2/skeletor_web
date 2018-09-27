$(document).ready(function() {
	$(".metric_button").on("click", function (e) {
		e.preventDefault();
		const current_class = this.className;

		if (current_class.includes("btn-light")) {
			this.className = "btn btn-success metric_button";
			addMetric(this.innerHTML, this.id);
		} else {
			this.className = "btn btn-light metric_button";
			removeMetric(this.innerHTML, this.id);
		}
	});
});

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
	document.getElementsByClassName("file-list-wrapper")[0].append(main_row);
}

/*
	This function iterates through the file and adds each file to the file
	list container
*/

function renderFileList(files) {
	files.forEach((file) => {
		addFile(file, "PROCESSED.");
	});
}

/*
	This function creates and attaches the content to display for each file
*/
function addFile(file, file_status) {
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
			const metric_button = document.createElement("button");
			metric_button.className = "btn btn-light metric_button";
			metric_button.id = `${file.name}-${field}`;
			metric_button.innerHTML = field;
			metric_button.style.margin = "5px 1px 0px 1px";
			metric_col.append(metric_button);
		});

		metrics.append(metric_col);
	} else if (file_status == "UPLOADING.") {
		file_row.style.borderColor = "#3399ff";
		progress_bar.style.width = "0%";
		progress_bar.style.backgroundColor = "#3399ff";
		progress_bar_status.style.color = "black";

	} else {
		file_row.style.borderColor = "#ffcc66";
		progress_bar.style.width = "0%";
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

	file_row.append(wrapper);
	file_list_container.append(file_row);
}


function uploadCompleted(file) {
	const progress_bar = document.getElementById(`${file}-progress`);
	progress_bar.style.width = '0%';
	progress_bar.style.backgroundColor = "#ffcc66";
	const progress_div_status = progress_bar.childNodes[0];
	progress_div_status.innerHTML = "ANALYZING.";
	const file_row = document.getElementById(`${file}-main`);
	file_row.style.borderColor = "#ffcc66";
}

function analysisCompleted(file) {
	document.getElementById(`${file}-main`).remove();
	addFile(file, "PROCESSED.");
}



