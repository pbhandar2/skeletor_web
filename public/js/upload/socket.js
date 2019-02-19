var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/";

var socket = io(baseUrl, {
	transports: ['websocket']
});

const lambda_done_socket_name = `lambda_${id}`;
//console.log(lambda_done_socket_name);
socket.on(lambda_done_socket_name, function (file_name) {
	//console.log("LMAMDA");
	//console.log(file_name);
	queue[file_name]["done"] += 1;
	const width = (queue[file_name]["done"]/queue[file_name]["need"]) * 100;
	//console.log(document.getElementById(`${file_name}-progress`));
	document.getElementById(`${file_name}-progress`).style.width = `${width}%`;
});

const calculation_done_socket_name = `calculation_done_${id}`;
socket.on(calculation_done_socket_name, function () {
	location.reload();
});