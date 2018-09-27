var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/";

var socket = io(baseUrl, {
	transports: ['websocket']
});

const lambda_done_socket_name = `lambda_${id}`;
socket.on(lambda_done_socket_name, function (file_name) {
	queue[file_name]["done"] += 1;
	const width = queue[file_name]["done"]/queue[file_name]["need"];
	document.getElementById(`${file.name}-progress`).style.width = `${width}%`;
});

const calculation_done_socket_name = `calculation_done_${id}`;
socket.on(calculation_done_socket_name, function () {
    $('#metric-bar').css('width', 100 + "%");
    $('#new_data_alert').show();
    $('html, body').animate({ scrollTop: $('#new_data_alert').offset().top }, 'slow');
    $('#metric-status').text("Analyzed.")
    document.getElementById("file-upload-btn").disabled = false;
});