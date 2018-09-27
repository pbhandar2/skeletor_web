$('#file-upload').on('change', function (e){

  e.preventDefault();

  //alert(" File submitted for upload! Please do not close the window during upload. ");
  //$('#metric-status').text("Uploading")

  document.getElementById("file-upload-btn").disabled = true;

  let start = moment();

  const current_url = window.location.href;
  const id = current_url.split("/").pop();
  var files = $('.input-file').get(0).files;

  // files.forEach((file_obj) => {
  //   console.log(file_obj);
  //   add_file_to_list(file_obj)
  // });

  let to_upload = [];
  for (var i = 0; i < files.length; i++) {
    const file_obj = files[i];
    add_file_to_list(file_obj);
    to_upload.push(files[i].name);
  }

  if (files.length > 0){
    var formData = new FormData();

    //loop through all the selected files
    for (var i = 0; i < files.length; i++) {
      console.log(file);
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
          console.log('upload successful!\n' + data);
          let end = moment();
          let diff = end.diff(start);
          let f = moment.utc(diff).format("HH:mm:ss.SSS");
          console.log(f);
          //$('small').text("Extracting file");
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

            // update the Bootstrap progress bar with the new percentage
            //$('#upload-bar').text(percentComplete + '%');
            //$(`#${to_upload[0]}-progress`).width(percentComplete + '%');
            document.getElementById(`${to_upload[0]}-progress`).style.width = percentComplete + '%';

            // console.log(formData);
            // console.log("is in here");
            // console.log(`#${to_upload[0]}-progress`);
            // console.log($(`#${to_upload[0]}-progress`))
            console.log(document.getElementById(`${to_upload[0]}-progress`))

            // once the upload reaches 100%, set the progress bar text to done
            if (percentComplete === 100) {
              $('#upload-bar').html('Done');
              $('#metric-status').text("Uploaded")
              document.getElementById("file-upload-btn").disabled = false;
              //document.getElementById("uploadForm").reset();
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
  }
});