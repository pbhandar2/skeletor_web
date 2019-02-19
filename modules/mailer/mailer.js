class Mailer {

  constructor(ses){
    this.source = 'admin@stacktrace.awsapps.com';
    this.ses = ses;
  }

  error(recipients, userid, traceid, error){
    var params = {
      Destination: {
        ToAddresses: recipients
      },
      Template: 'error', /* required */
      TemplateData: `{ \"userid\":\"${userid}\", \"traceid\":\"${traceid}\", \"error\":\"${error_message}\" }`,
      Source: this.source,
      ReplyToAddresses: [ this.source ]
    };

    this.send_notification(params);
  }

  complete(recipients, userid, traceid){
    var params = {
      Destination: {
        ToAddresses: recipients
      },
      Template: 'complete', /* required */
      TemplateData: `{ \"userid\":\"${userid}\", \"traceid\":\"${traceid}\" }`,
      Source: this.source,
      ReplyToAddresses: [ this.source ]
    };

    this.send_notification(params);
  }

  welcome(recipients, userid){
    var params = {
      Destination: {
        ToAddresses: recipients
      },
      Template: 'welcome', /* required */
      TemplateData: `{ \"userid\":\"${userid}\" }`,
      Source: this.source,
      ReplyToAddresses: [ this.source ]
    };

    this.send_notification(params);
  }

  added(recipients, userid, traceid){
    var params = {
      Destination: {
        ToAddresses: recipients
      },
      Template: 'added', /* required */
      TemplateData: `{ \"userid\":\"${userid}\", \"traceid\":\"${traceid}\" }`,
      Source: this.source,
      ReplyToAddresses: [ this.source ]
    };

    this.send_notification(params);
  }

  send_notification(params) {

    // Maintain asynchronosity by creating a JS promise object to be fulfilled later
    var sendPromise = this.ses.sendTemplatedEmail(params).promise();

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
