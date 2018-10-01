$(document).ready(function() {  
  $('#deleteTrace').on('click', function (e){

    const delete_bool = confirm('Are you sure you want to delete the trace?');
    if (delete_bool == true)  
      $.post(`/deletetrace/${id}`, function(data) { 
        if (data == "done") $(location).attr('href', '/traces') 
      });

  });

  $('#toggleDisplay').on('click', function (e){

    var toggleValue;
    if ($('#toggleDisplay').html() == "Make Private") {
      const private_bool = confirm('Are you sure you want to make this trace private?');
      if (private_bool == true) toggleValue = true;
    } else {
      const public_bool = confirm('Are you sure you want to make this trace public?');
      if (public_bool == true) toggleValue = false;
    }

    if(typeof(toggleValue) === "boolean"){
      // variable is a boolean
      $.post(`/toggleDisplay/${id}/${toggleValue}`, function(data){
        if (data == "done") {
          if (toggleValue) {
            $('#message').text("The trace is now private.");
            $('#toggleDisplay').text("Make Public");
          }
          else {
            $('#message').text("The trace is now public.")
            $('#toggleDisplay').text("Make Private");
          }
          $('#message-container').attr("class", "alert alert-success").toggle(true);
        } else {
          if (toggleValue) $('#message').text("The trace could not be set to private. Try again later or report this.");
          else $('#message').text("The trace could not be set to public. Try again later or report this.");
          $('#message-container').attr("class", "alert alert-danger").toggle(true);
        }
      });
    } else {
      $('#message').text("The public/private switch could not be made. Try again later or report this.");
      $('#message-container').attr("class", "alert alert-danger").toggle(true);
    }

  });

  
});