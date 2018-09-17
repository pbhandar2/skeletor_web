var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/";

var socket = io(baseUrl, {
	transports: ['websocket']
});


const extract_socket_name = `extract_${id}`;
socket.on(extract_socket_name, function (data) {
	console.log(`The number of blocks needed is ${data}`);
	lambda_needed = data;
    const width = (lambda_completed/(lambda_needed + 1)) * 100;
    $('#metric-bar').css('width', width + "%");
    //$('#metric-status').text("Initializing ")
});

const lambda_done_socket_name = `lambda_${id}`;
socket.on(lambda_done_socket_name, function () {
	//console.log("LAMBDAAA");
	//console.log(lambda_needed);
	lambda_completed = lambda_completed + 1;
    const width = (lambda_completed/(lambda_needed + 1)) * 100;
    $('#metric-bar').css('width', width + "%");
    $('#metric-status').text("Extracted. Analysis in Progress.")
});

const calculation_done_socket_name = `calculation_done_${id}`;
socket.on(calculation_done_socket_name, function () {
	console.log("DONEEEEEEEE");
    $('#metric-bar').css('width', 100 + "%");
    $('#new_data_alert').show();
    $('html, body').animate({ scrollTop: $('#new_data_alert').offset().top }, 'slow');
    $('#metric-status').text("Analyzed.")
    document.getElementById("file-upload-btn").disabled = false;
});

