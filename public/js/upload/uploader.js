$(document).ready(function() {

  $('#file-upload').on('change', function (e) {

    e.preventDefault();

    // rendering the list of files if it isn't already there
    if (!document.getElementById("file-list-container")) {
      renderFileListContainer();
    }

    // disabling the file upload button
    $("#file-upload-btn").prop("disabled", true);

    // tracking the time it took for the file to upload
    let start = moment();
    const current_url = window.location.href;
    const id = current_url.split("/").pop();

    let files = $('.input-file').get(0).files;

    // making a list of files that are to be uploaded
    let to_upload = [];
    let formData = new FormData();

    for (var i = 0; i < files.length; i++) {
      const file_obj = files[i];
      addFile(file_obj, "UPLOADING.");
      formData.append("uploadFile", file, file.name);
      to_upload.push({ "name": files[i].name, "size": files[i].size });
    }

    // console.log("TO UPLOAD")
    // console.log(to_upload)

    if (files.length > 0){

      

      // NEED TO CHECK THIS AND WHY THIS NEEDS TO BE DONE BECAUSE I AM LOOPING TWICE
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        file.id = id;
        
        lambda_needed = file.size * 15/50000000;
        queue_obj = {
          name: file.name,
          size: file.size,
          done: 0,
          need: lambda_needed
        }
        queue[file.name] = queue_obj;
      }

      // formData.append('uploads', 'ok', 'test');

      // formData.id = id;
      // formData.files = to_upload;

      $.ajax({
        url: '/testup',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(data){
          console.log("DONE UPLOADING FILE");
            // let end = moment();
            // let diff = end.diff(start);
            // let f = moment.utc(diff).format("HH:mm:ss.SSS");

            // console.log(`Upload successful for ${formData} in time ${f}`);
            // print(to_upload)
            // print(queue)

            // print("THIS IS THE DATA YOOO")
            // print(data)

            // to_upload.forEach((file) => {
            //   console.log("in to_upload for each")
            //   uploadCompleted(file.name);
            //   lambda_needed = file.size * 15/50000000;
            //   queue_obj = {
            //     name: file.name,
            //     size: file.size,
            //     done: 0,
            //     need: lambda_needed
            //   }
            //   queue[file.name] = queue_obj;
            //   print(queue)
            // });
            // document.getElementById("file-upload-btn").disabled = false;
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

              console.log(evt);

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
