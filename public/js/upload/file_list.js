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
	main_row.append(main_col);

	// attaching it to the main container
	// the getelements function returns an array and here I am assuming
	// that there is no other element by the class name "container" which 
	// is a fair assumption
	document.getElementsByClassName("container")[0].append(main_row);
}



/*
	This function renders the files column for completed files
*/

function renderFileList(files) {
	const file_list_container = document.getElementById("file-list-container");
	files.forEach((file) => {
		addToFileList();
	});
}

