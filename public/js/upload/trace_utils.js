$(document).ready(function() {  
  $('#deleteTrace').on('click', function (e){

    const delete_bool = confirm('Are you sure you want to delete the trace?');
    if (delete_bool == true)  
      $.post(`/deletetrace/${id}`, function(data) { 
        if (data == "done") $(location).attr('href', '/traces') 
      });

  });
});