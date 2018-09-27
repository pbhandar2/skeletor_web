$(document).ready(function() {
  $('#file-upload').on('change', function (e){

    e.preventDefault();

    // rendering the list of files if it isn't already there 
    if (!document.getElementById("file-list-container")) {
      renderFileListContainer(); 
    }

    // disabling the file upload button
    document.getElementById("file-upload-btn").disabled = true;

    // tracking the time it took for the file to upload
    let start = moment();
    const current_url = window.location.href;
    const id = current_url.split("/").pop();
    var files = $('.input-file').get(0).files;
 
    // making a list of files that are to be uploaded
    let to_upload = [];
    for (var i = 0; i < files.length; i++) {
      const file_obj = files[i];
      addFile(file_obj, "UPLOADING.");
      to_upload.push({ "name": files[i].name, "size": files[i].size });
    }

    if (files.length > 0){
      var formData = new FormData();

      // NEED TO CHECK THIS AND WHY THIS NEEDS TO BE DONE BECAUSE I AM LOOPING TWICE
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        file.id = id;
        formData.append('uploads[]', file, file.name);
      }

      formData.id = id;
      formData.files = to_upload;

      $.ajax({
        url: '/traces/' + id,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(data){
            let end = moment();
            let diff = end.diff(start);
            let f = moment.utc(diff).format("HH:mm:ss.SSS");
            console.log(`Upload successful for ${data} in time ${f}`);

            to_upload.forEach((file) => {
              uploadCompleted(file.name);
              lambda_needed = file.size * 15/50000000;
              queue_obj = {
                name: file.name,
                size: file.size,
                done: 0,
                need: lambda_needed
              }
              queue[file.name] = queue_obj;
            });
            document.getElementById("file-upload-btn").disabled = false;
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

              to_upload.forEach((file) => {
                document.getElementById(`${file.name}-progress`).style.width = percentComplete/to_upload.length + '%';
              });

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
    }
  });
});
