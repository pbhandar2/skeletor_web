var http = require('http');
var https = require('https');

http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('hey');
}).listen(process.env.PORT || 80, function() {
  console.log('App listening on port %d', server.address().port);
});

https.createServer(function(req, res) {
  res.writeHead(200);
  res.end('hey');
}).listen(process.env.HTTPSPORT || 443, function() {
  console.log('App listening on port %d', server.address().port);
});


