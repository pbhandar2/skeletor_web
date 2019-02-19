const aws_service = require('../aws.js');
const fs = require('fs');

const ses = aws_service.ses();

// Usage: node create_template.js <template name with extension>
//        Uploads a template html doc to aws.  On error, updates the existing template instead
//        interpolate parameters with {{ }} inside document and fill as shown below


// Read html template by
var htm;
fs.readFile(`./${process.argv[2]}.html`, "utf-8", function(err, data){
  htm = data;
});

// Create createTemplate params
var params = {
  Template: {
    TemplateName: process.argv[2], /* required */
    HtmlPart: htm,
    SubjectPart: 'Your trace is complete',
    TextPart: 'User id = {{userid}} traceid = {{traceid}}'
  }
};

// Create the promise and SES service object
var templatePromise = ses.createTemplate(params).promise();

// Handle promise's fulfilled/rejected states
templatePromise.then(
  function(data) {
    console.log(data);
  }).catch(
    ses.updateTemplate(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  });
