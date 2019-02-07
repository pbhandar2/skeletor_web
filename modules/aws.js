var AWS = require('aws-sdk')
var fs = require('fs')
const path = require("path")

var contents = fs.readFileSync(path.resolve(__dirname, "../modules/settings.json"))
var settings = JSON.parse(contents)

var creds = new AWS.Credentials({
  accessKeyId: settings.aws.key,
  secretAccessKey: settings.aws.secret
})

AWS.config.update({
	"region": 'us-east-2',
	"credentials": creds
})

exports.ddb = function() {
  return new AWS.DynamoDB.DocumentClient({"apiVersion": '2012-10-08'});
}

exports.ddb_main = function() {
  return new AWS.DynamoDB({"apiVersion": '2012-10-08'});
}

exports.lambda = function() {
  return new AWS.Lambda();
}

exports.s3 = function() {
  return new AWS.S3({apiVersion: '2006-03-01'});
}

exports.ses = function() {
  return new AWS.SES({apiVersion: '2010-12-01'})
}
