console.log("In File test.js");

$(document).ready(function() {
  $('#uploadForm2').on('submit', function (e){
    e.preventDefault();
  	$.ajax({
        url: '/test',
        type: 'POST'
    });
    
    const id = "test";
    var files = $('.input-file').get(0).files;
    console.log(files);
    if (files.length > 0){
      // One or more files selected, process the file upload

      // create a FormData object which will be sent as the data payload in the
      // AJAX request
      var formData = new FormData();

      console.log(formData);

      // loop through all the selected files
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        file.id = id;
        // add the files to formData object for the data payload
        formData.append('uploads[]', file, file.name);
      }

      formData.id = id;

      $.ajax({
        url: '/test/test',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(data){
            console.log('upload successful!\n' + data);
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

             	console.log(percentComplete);

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

