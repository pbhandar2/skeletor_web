var lambda_completed = 0;
var lambda_needed = 0;

$(document).ready(function() {
  console.log("DOC READYYY");

  loadQueueData(queue);

  function loadQueueData(queue) {

    Object.keys(queue).forEach(function (key) {
      const queue_object = queue[key];
      console.log(key)
      console.log(queue_object);
      lambda_completed = queue_object.done;
      lambda_needed = queue_object.need;
    });
    const width = (lambda_completed/(lambda_needed + 1)) * 100;
    if (lambda_needed) $('small').text("Calculating metrics!");
    $('#metric-bar').css('width', width + "%");
  }

  $('#uploadForm').on('submit', function (e){
    e.preventDefault();
    let start = moment();
    const current_url = window.location.href;
    const id = current_url.split("/").pop();
    var files = $('.input-file').get(0).files;
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
        url: '/trace/' + id,
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
            $('small').text("Extracting file");
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
              $('#upload-bar').text(percentComplete + '%');
              $('#upload-bar').width(percentComplete + '%');

              // once the upload reaches 100%, set the progress bar text to done
              if (percentComplete === 100) {
                $('#upload-bar').html('Done');
                document.getElementById("uploadForm").reset();
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
  $('.reload_button').on('click', function (e){
    location.reload();
  });
  $('.test_anime').on('click', function(e){
    $('#new_data_alert').show();
    $('html, body').animate({ scrollTop: $('#new_data_alert').offset().top });
  });
  // $('.test-metric').on('click', function(e){
  //   console.log("this is the metric test");
  //   const width = (22/47)*100;
  //   console.log(width);
  //   $('#metric-bar').css('width', width + "%");
  // });

  $('.trace-rerun-button').on('click', function(e) {
    console.log('in trace rerun');
    
  });
});