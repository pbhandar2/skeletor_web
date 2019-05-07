/*
	The function uploads the selected files to the server. 
*/
function uploadFile(form) {

	let files = $('#fileUpload').get(0).files; // get the files 
	let curSessionNumber = numUploadSessions; // used to identify a session 
	if (files.length < 1) {
		return;
	}

	numUploadSessions++;

	createProgressBar(curSessionNumber);

	// get the files selected and create the form data
	let formData = new FormData();
	
	for (let i=0; i<files.length; i++) {
		formData.append("fileList", files[i]);
	}

	let progressBarClass = 'progressBar-' + curSessionNumber;

	// make a post call to the server 
	$.ajax({
		url: '/traceprofile/' + id,
		type: 'POST',
		data: formData,
		processData: false,
		contentType: false,
		success: function(data){
			// remove the upload dialog once the files have finished uploading
			removeProgressBar(curSessionNumber);
		},
		xhr: function() {

			// create an XMLHttpRequest
			var xhr = new XMLHttpRequest();

			// listen to the 'progress' event
			xhr.upload.addEventListener('progress', function(evt) {

				if (evt.lengthComputable) {

					// calculate the percentage of upload completed
					var percentComplete = evt.loaded / evt.total;
					percentComplete = parseInt(percentComplete * 100);

					// console.log(evt);
					// console.log(percentComplete);

					progressBarList = document.getElementsByClassName(progressBarClass);
					for (let i=0; i<progressBarList.length; i++) {
						// console.log(progressBarList[i])
						progressBarList[i].style.width = percentComplete + '%';
					}

				}
			}, false)

			return xhr;
		},
        error: function(err) {
			console.log("An error occured.")
			console.log(err);
			if (err) throw(err)
        }
	});

	return false;
}