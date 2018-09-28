console.log("In File test.js");

$(document).ready(function() { 
  convertDate();
  function convertDate() {
    traces.forEach((trace) => {
      //console.log(trace.uploadedOn);
      const date_obj = new Date(trace.uploadedOn);
      const moment_obj = moment(date_obj).utcOffset(-7).format('YYYY-MM-DD HH:mm');
      console.log(document.getElementById(`date_${trace.id}`));
      document.getElementById(`date_${trace.id}`).innerHTML = moment_obj;
    });
  }
});
