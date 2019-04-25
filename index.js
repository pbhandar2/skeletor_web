var path = require('path');
global.appRoot = path.resolve(__dirname);

const http = require('http');
const https = require('https');

var express = require('express');
var app = express();
var path = require('path');


var session = require('express-session');
var redisStore = require('connect-redis')(session);
var bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var http_server = http.Server(app);
var https_server = https.createServer(app);

http_server.listen(80);
https_server.listen(443);

const redisAdapter = require('socket.io-redis');

var io = require('socket.io').listen(http_server);
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
io.on('connection', function(socket){});

// var controllers = require("./controllers");
// controllers.set(app);

var fs = require('fs');
var redis   = require("redis");
var moment = require('moment');
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var formidable = require('formidable');

// FLASH MODULE
const flash = require('connect-flash');
app.use(flash());

// AWS MODULE
const aws_service = require('./modules/aws.js');
const ddb = aws_service.ddb();
const ddb_main = aws_service.ddb_main();
const lambda = aws_service.lambda();
const s3 = aws_service.s3();

var client  = redis.createClient();
const uuidv1 = require('uuid/v1');

app.use(session({
    secret: 'ssshhhhh',
    // create new redis store.
    store: new redisStore({ host: 'localhost', port: 6379, client: client, ttl: 60000 }),
    saveUninitialized: true,
    resave: true,
    cookie: {expires: new Date(253402300000000)}
}));

// PASSPORT MODULE
var passport = require('passport');
require('./modules/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

function done(params) {
  console.log("it is done");
  console.log(params);
}


const uploads_path = "./uploads";
if (fs.existsSync(uploads_path)) {
  console.log("./uploads already exists");
} else {
  fs.mkdirSync(uploads_path);
  console.log("./uploads created");
}

// Routes
app.get('/', (req, res) => {
  io.emit("d5051590-9ad2-11e8-b775-b50a9fb836bc", "ss");
  res.render('homepage', { 'userId': (req.session) ? req.session.key : null })
});

app.get('/traces', (req, res) => {
  var traces = [];
  if (req.session && req.session.key && req.session.key.accessCode == "ibm_emory") {
    const params = {
      TableName: "traces"
    }
    ddb.scan(params, function(err, data) {
      if (err) console.log(err)
      else {
        traces = data.Items;
        res.render('list_traces', { 'traces': (data.Items) ? data.Items : [], 'userId': (req.session) ? req.session.key : null });
      }
    });
  } else {
    const params = {
      ExpressionAttributeValues: {
        ":b": false
      },
      FilterExpression: "display = :b",
      TableName: "traces"
    }
    ddb.scan(params, function(err, data) {
      if (err) console.log(err)
      else {
        traces = data.Items;
        res.render('list_traces', { 'traces': (data.Items) ? data.Items : [], 'userId': (req.session) ? req.session.key : null });
      }
    });
  }
});

app.get('/traces/:traceId', (req, res) => {
  const params = {
    ExpressionAttributeValues: {
      ":id": req.params.traceId
    },
    KeyConditionExpression: "id = :id",
    TableName: "traces"
  }
  ddb.query(params, function(err, data) {
    if (err) res.render('error', { 'userId': (req.session) ? req.session.key : null, 'errorMessage': 'Error connecting to the database.' })
    else {
      if (data.Items[0]) res.render('upload', { 'trace': data.Items[0], 'userId': (req.session) ? req.session.key : null  })
      else res.render('error', { 'userId': (req.session) ? req.session.key : null, 'errorMessage': 'The trace does not exist in the database.' })
    }
  });
});

app.post('/traces/:traceId', function(req, res){

  const start = moment();
  const timestamp = new Date().valueOf();

  // create an incoming form object
  var form = new formidable.IncomingForm({
    uploadDir: __dirname + '/uploads',  // don't forget the __dirname here
    keepExtensions: true
  });
  form.parse(req);

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  form.maxFileSize = 2097314290000;

  // when the file is uploaded
  form.on('file', function(field, file) {

    form.uploadDir = path.join(__dirname, '/uploads/' + req.params.traceId + "/" + file.name + "_" + timestamp);

    // create the directory if it doesn't exist
    try {
        fs.mkdirSync(`./uploads/${req.params.traceId}`);
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }

    try {
        fs.mkdirSync(`./uploads/${req.params.traceId}/${file.name}_${timestamp}`);
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }

    fs.rename(file.path, path.join(form.uploadDir, file.name), (error) => {

          if (error) console.log("An error occured while renaming and moving the file." + error);
          else {

          	// file object to be added to the trace database 
            const file_object = {
              "name": file.name,
              "size": file.size,
              "timestamp": timestamp,
              "path": `/uploads/${req.params.traceId}/${file.name}_${timestamp}/${file.name}`
            };

            // console.log("THIS IS THE FILE OBJECT.")
            // console.log(file_object)

            const aws = require("./library/aws"); // get the aws object
			const add_file_promise = aws.add_file(file_object, req.params.traceId, io); // add the file to the trace db object 

			// waiting for the file to be added to the database
			add_file_promise.then((flag) => {

				// creating the traceProcessor object 
				const traceProcessor = require("./library/traceProcessor");

				// passing the file to the trace processor for processing 
				const process_trace_file_promise = traceProcessor.processTraceFile(file_object, req.params.traceId, io);
				process_trace_file_promise.then((flag) => {
					let end = moment();
					let diff = end.diff(start);
					let f = moment.utc(diff).format("HH:mm:ss.SSS");
					console.log(f);
				}).catch((err) => {
					console.log(err);
				}).then(done, done);

			}).catch((err) => {
				console.log(err);
			}).then(done, done);
		}
    });

  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured during file upload: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
     console.log("file upload sucessfull");
  });

});

app.get('/signup', function(req, res) {
  res.render('signup', { message: req.flash('signupMessage'), 'userId': (req.session) ? req.session.key : null });
});

// process the signup form
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/traces', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.get('/login', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('login', { message: req.flash('loginMessage'), 'userId': (req.session) ? req.session.key : null });
});

// process the login form
app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.get('/logout',function(req,res){
    if(req.session.key) {
      req.session.destroy(function(){
        res.redirect('/');
      });
    } else {
        res.redirect('/');
    }
});

// creating a trace in the database and redirecting the user to the
// trace page

app.post('/add', (req, res) => {

  if (!req.session.key) {
    req.flash('loginMessage', "You need to be logged in to add a trace.")
    res.render('login', { message: req.flash('loginMessage'), 'userId': req.session.key });
    return;
  }

  const item_object = {
    id: uuidv1(),
    name: req.body.name,
    description: req.body.description,
    display: (req.body.trace_display == "on") ? true : false,
      queue: {},
      files: [],
      type: "IBM GPFS",
      ownerId: req.session.key.id,
      ownerEmail: req.session.key.email,
      uploadedOn: new Date().toString()
  }

  const item_uploads_path = "./uploads/" + item_object.id;
  fs.mkdirSync(item_uploads_path);

  const create_trace_promise = require("./library/aws").create_trace(item_object);
  create_trace_promise.then((flag) => {
    const link = `/traces/${item_object.id}`;
    res.redirect(link);
  });

});

app.get('/profile', (req, res) => {
  if (req.session && req.session.key) {

    var user_object = {}
    const params = {
      ExpressionAttributeValues: {
        ":email": req.session.key.email
      },
      KeyConditionExpression: "email = :email",
      TableName: "users"
    }

    console.log('in profile')

    ddb.query(params, function(err, data) {
      if (err) console.log(err)
      else {
        console.log("in here ")
        user_object = data.Items[0]
        if (req.session.key.accessCode == "ibm_emory") {
          const queue_params = {
            TableName: "queue"
          }
          ddb.scan(queue_params, function(err, data) {
            if (err) console.log(err)
            else {
              queue = data.Items;
              res.render('profile', { 'queue': data.Items, 'user': user_object, 'userId': req.session.key });
            }
          });
        } else {
          res.render('profile', { 'queue': [], 'user': user_object, 'userId': req.session.key });
        }
        //res.render('profile', { 'queue': [], 'user': data.Items[0], 'userId': req.session.key });
      }
    });


  }
  else res.render('login', { message: '', 'userId': req.session.key });
});

app.get('/reset', (req, res) => {
  res.render('reset')
});

app.get('/metrics', (req, res) => {
  res.render('metrics', { 'userId': (req.session) ? req.session.key : null })
});

app.get('/contact', (req, res) => {
  if (req.session && req.session.key) res.render('contact', { message: '', 'userId': (req.session) ? req.session.key : null })
  else res.render('login', { message: '', 'userId': req.session.key });
});

app.post('/contact', (req, res) => {

  var query_object = req.body;
  const now = new Date();
  query_object.date = now.toString();
  query_object.status = "active";
  query_object.user = req.session;
  var params = {
    Item: query_object,
    TableName: "queue"
  }

  ddb.put(params, function(err, data) {
    if (err) {
      console.log(err);
      req.flash('contactMessage', "There was an error in submitting your query.");
      res.render('contact', { message: req.flash('contactMessage'), 'userId': req.session.key });
    }
    else {
      req.flash('contactMessage', "Your query has been submitted. We will get back to you as soon as we can.");
      res.render('contact', { message: req.flash('contactMessage'), 'userId': req.session.key });
    }
  });

});


app.post('/deletetrace/:traceId', (req, res) => {

  const traceId = req.params.traceId;
  const params = {
    Key: {
      "id": traceId
    },
    ConditionExpression: "attribute_exists(id)",
    TableName: "traces"
  }
  ddb.delete(params, function(err, data) {
    if (err) res.send(err);
    else res.send("done");
  });

  var user_object = {}
  var user_params = {
    ExpressionAttributeValues: {
      ":email": req.session.key.email
    },
    KeyConditionExpression: "email = :email",
    TableName: "users"
  }

  ddb.query(user_params, function(err, data) {
    if (err) console.log(err)
    else {
      user_object = data.Items[0];
      var index = 0;
      user_object.traces.forEach(function(trace) {
        if (trace.id == traceId) {
          const delete_expression = "REMOVE traces[" + index + "]"
          user_params = {
            Key: {
              "email": req.session.key.email,
              "id": req.session.key.id,
            },
            UpdateExpression: delete_expression,
            TableName: "users"
          }
          ddb.update(user_params, function(err, data) {
            if (err) console.log(err)
            else {
              console.log("sucessfull!")
            }
          });
        }
        index = index + 1
      });
    }
  });



});

app.post('/toggledisplay/:traceId/:toggleValue', (req, res) => {

  const toggleValue = (req.params.toggleValue == "true" || req.params.toggleValue == true) ? true : false
  const traceId = req.params.traceId;

  const params = {
    Key: {
      "id": traceId
    },
    ExpressionAttributeValues: {
      ":toggleValue": toggleValue
    },
        UpdateExpression: "set display = :toggleValue",
        ConditionExpression: "attribute_exists(id)",
    TableName: "traces"
  }

  ddb.update(params, function(err, data) {
    if (err) res.send(err)
    else res.send("done")
  });

});

const traceProcessor = require("./library/traceProcessor");
