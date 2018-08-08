const http = require('http');
const https = require('https');

var express = require('express');
var app = express();

var redis   = require("redis");
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var bodyParser = require('body-parser');

// PASSPORT MODULE
var passport = require('passport');
require('./modules/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// FLASH MODULE
const flash = require('connect-flash');
app.use(flash());

// AWS MODULE
const aws_service = require('./modules/aws.js');
const ddb = aws_service.ddb();
const lambda = aws_service.lambda();
const s3 = aws_service.s3();

var client  = redis.createClient();
const uuidv1 = require('uuid/v1');
var fs = require('fs');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

app.use(session({
    secret: 'ssshhhhh',
    // create new redis store.
    store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl :  260}),
    saveUninitialized: false,
    resave: false
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var http_server = http.createServer(app).listen(80);

const uploads_path = "./uploads";
if (fs.existsSync(uploads_path)) {
	console.log("./uploads already exists");
} else {
	fs.mkdirSync(uploads_path);
	console.log("./uploads created");
}

// Routes
app.get('/', (req, res) => {
	res.render('homepage', { 'userId': req.session.key })
});

app.get('/traces', (req, res) => {
	console.log(req.session.key);
	var traces = [];
	if (req.session.key && req.session.key.accessCode == "ibm_emory") {
		const params = {
			TableName: "traces"
		}
		ddb.scan(params, function(err, data) {
			if (err) console.log(err)
			else {
				traces = data.Items;
				res.render('list_traces', { 'traces': data.Items, 'userId': req.session.key });
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
				res.render('list_traces', { 'traces': data.Items, 'userId': req.session.key });
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
		if (err) console.log(err)
		else res.render('trace_page', { 'trace': data.Items[0], 'userId': req.session.key  })
	});
});

app.get('/signup', function(req, res) {
	res.render('signup', { message: req.flash('signupMessage') });
});

// process the signup form
app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/traces', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
}));

app.get('/login', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('login', { message: req.flash('loginMessage'), 'userId': req.user });
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
    	type: "IBM GPFS"
	}

	var params = {
		Item: item_object,
		TableName: "traces"
	}

	ddb.put(params, function(err, data) {
		if (err) console.log(err)
		else {

			// create directories that we need to process files for this trace set

			const item_uploads_path = "./uploads/" + item_object.id;
			// const item_tmp_path = "./tmp/" + item_object.id;
			// const item_metrics_path = "./metrics/" + item_object.id;
			fs.mkdirSync(item_uploads_path);
			// fs.mkdirSync(item_tmp_path);
			// fs.mkdirSync(item_metrics_path);

			const query_params = {
				ExpressionAttributeValues: {
					":id": item_object.id
				},
				KeyConditionExpression: "id = :id",
				TableName: "traces"
			}

			console.log("The email is " + req.session.key.email);

			// udpating the user obejct 
			const update_user_params = {
				Key: {
					id: req.session.key.id,
					email: req.session.key.email
				},
				ExpressionAttributeValues: {
					":traceId": [item_object],
				},
		        ExpressionAttributeNames: {
		            '#t': 'traces'
		        },
		        UpdateExpression: "set #t = list_append(#t, :traceId)",
				TableName: "users"
			}

			ddb.update(update_user_params, function(err, data) {
				if (err) console.log(err)
				else console.log(data)
			});

			// find the link and redirect to it 
			ddb.query(query_params, function(err, data) {
				if (err) {
					throw(err);
				}
				else {
					const link = "/traces/" + item_object.id;
					res.redirect(link);
				}
			});

		}
	});

});