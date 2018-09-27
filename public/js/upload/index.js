document.getElementById("chart-container").hidden = true;

// check if there is the need to render the file list 
if (files.length || Object.keys(queue).length) {
	console.log("need to render");
	console.log(queue);
	renderFileListContainer();
	renderFileList(files);
	renderQueueList(queue);
} else {
	console.log("there is no file list");
}