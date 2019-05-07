let getUrl = window.location;
let baseUrl = getUrl.protocol + "//" + getUrl.host + "/";

let socket = io(baseUrl, {
	transports: ['websocket']
});

const lambda_done_socket_name = `lambda_${id}`;
const calculation_done_socket_name = `calculation_done_${id}`;
const start_analysis = `extract_${id}`;

/*
The function creates a progress bar for analysis. 
*/
function traceProcessStart() {

}

/*
This function increments the progress value in the progress bar. 
*/
function incrementProgress(fileName, timestamp, size, completed) {
	if(document.getElementById("analysisProgressBar-" + fileName + "_" + timestamp + "-wrapper")) {
		incrementAnalysisProgressBar(`${fileName}_${timestamp}`, size, completed, timestamp);		  
	} else {
		createAnalysisProgressBar(fileName, timestamp);
		incrementAnalysisProgressBar(`${fileName}_${timestamp}`, size, completed, timestamp);
	}
}

/*
	The function removes the progress bar for analysis. 
	An issue to be handled is when multiple files are being processed and one of them
	completes calculation. 
*/
function traceProcessDone(fileName, timestamp) {
	removeAnalysisProgressBar(`${fileName}_${timestamp}`);
}

/*
	This socket represents when a lambda function computation is done. It means that we have to increment the progress bar by one. 

	params:
		fileName: the name of the file 
		timestamp: timestamp to distinguish between files of the same name 
		fileSize: the size of the file (this is the compressed size so need to be processed)
*/
socket.on(start_analysis, function (fileName, timestamp, fileSize, filesCompleted) {
	// console.log("Here in lambda_done_socket_name");
	// console.log(`For file ${fileName} with timestamp ${timestamp} of size ${fileSize} where ${filesCompleted} are done`);

	incrementProgress(fileName, timestamp, fileSize, filesCompleted);
});

/*
	This socket represents when a lambda function computation is done. It means that we have to increment the progress bar by one. 

	params:
		fileName: the name of the file 
		timestamp: timestamp to distinguish between files of the same name 
		fileSize: the size of the file (this is the compressed size so need to be processed)
*/
socket.on(lambda_done_socket_name, function (fileName, timestamp, fileSize, filesCompleted) {
	// console.log("Here in lambda_done_socket_name");
	// console.log(`For file ${fileName} with timestamp ${timestamp} of size ${fileSize} where ${filesCompleted} are done`);

	incrementProgress(fileName, timestamp, fileSize, filesCompleted);
});

/*
	This socket represents the communication for all calculation for a given file being completed. Called after the combine json lambda has returned. 
*/
socket.on(calculation_done_socket_name, function (fileName, timestamp) {
	console.log("Here in calculation_done_socket_name");
	traceProcessDone(fileName, timestamp);
	location.reload();
});