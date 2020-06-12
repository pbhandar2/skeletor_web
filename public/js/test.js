console.log("In File test.js");

$(document).ready(function() { 
  convertTraceDates();
  function convertTraceDates() {
    traces.forEach((trace) => {
      convertDate(trace.uploadedOn, trace.id);
    });
  }
});
