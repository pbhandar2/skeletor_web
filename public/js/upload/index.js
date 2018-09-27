// check if there is the need to render the file list 
if (files.length || Object.keys(queue).length) {
	console.log("need to render");
	renderFileListContainer();
	renderFileList();
} else {
	console.log("there is no file list");
}