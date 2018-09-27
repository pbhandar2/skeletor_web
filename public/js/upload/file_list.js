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
	document.getElementsByClassName("container")[0].append(main_row);
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

function addFile(file, file_status) {
	const file_list_container = document.getElementById("file-list-container");

	const file_row = document.createElement("div");
	file_row.className = "row";
	
	const file_name_col = document.createElement("div");
	file_name_col.className = "col-xs-3";

	const file_name = document.createElement("p");
	file_name.style.font = "1.4em bold";
	file_name.innerHTML = file.name;


	const progress_bar_col = document.createElement("div");
	progress_bar_col.className = "col-xs-9";
	const progress_bar = document.createElement("div");
	progress_bar.style.padding = "1px";

	const progress_bar_status = document.createElement("span");
	progress_bar_status.innerHTML = file_status;
	progress_bar_status.style.display = "block";
	progress_bar_status.style.font = "1.2em bold";
	progress_bar_status.style.margin = "10px";

	if (file_status == "PROCESSED.") {
		progress_bar.style.width = "100%";
		progress_bar.style.backgroundColor = "green";
		progress_bar_status.style.color = "white";
	}

	progress_bar.append(progress_bar_status);
	file_name_col.append(file_name);
	progress_bar_col.append(progress_bar);
	file_row.append(file_name_col);
	file_row.append(progress_bar_col);

	file_list_container.append(file_row);
}




