class Mailer {

  constructor(ses){
    this.source = 'admin@stacktrace.awsapps.com';
    this.ses = ses;
  }

  send_notification(recipients, subject, message) {
    var params = {
      Destination: {
        ToAddresses: recipients
      },
      Message: {
        Subject: {
         Charset: 'UTF-8',
         Data: subject
       },
      Body: {
        Html: {
         Charset: "UTF-8",
         Data: message
        },
        Text: {
         Charset: "UTF-8",
         Data: message
        }
       }
      },
      Source: this.source,
      ReplyToAddresses: [ this.source ]
    };

    // Maintain asynchronosity by creating a JS promise object to be fulfilled later
    var sendPromise = this.ses.sendEmail(params).promise();

    // Handle promise's fulfilled/rejected states
    sendPromise.then(
      function(data) {
        console.log(data.MessageId);
      }).catch(
        function(err) {
        console.error(err, err.stack);
      });
  }
};

module.exports = Mailer;
