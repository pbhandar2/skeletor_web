const http = require('http');
const https = require('https');

var express = require('express');
var app = express();
var path = require('path');
var moment = require('moment');
var redis   = require("redis");
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var bodyParser = require('body-parser');
var formidable = require('formidable');

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
const ddb_main = aws_service.ddb_main();
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
var https_server = https.createServer(app).listen(443);
var io = require('socket.io').listen(http_server);
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));

io.on('connection', function(socket){

});


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
				res.render('list_traces', { 'traces': data.Items, 'userId': (req.session) ? req.session.key : null });
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
				res.render('list_traces', { 'traces': data.Items, 'userId': (req.session) ? req.session.key : null });
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
		else res.render('trace_page', { 'trace': data.Items[0], 'userId': (req.session) ? req.session.key : null  })
	});
});

app.post('/trace/:traceId', function(req, res){

	// create an incoming form object
	var form = new formidable.IncomingForm();

	// specify that we want to allow the user to upload multiple files in a single request
	form.multiples = true;

	form.maxFileSize = 2097314290000;

	// store all uploads in the /uploads directory
	form.uploadDir = path.join(__dirname, '/uploads/' + req.params.traceId);

	const start = moment();

	// every time a file has been uploaded successfully,
	// rename it to it's orignal name
	form.on('file', function(field, file) {

		// move the file to the proper directory
		fs.rename(file.path, path.join(form.uploadDir, file.name), (error) => {
			if (error) console.log("An error occured while renaming and moving the file." + error);
			else {

			    // updating the file information to the queue in the database 
			    const ddb_res = ddb.update({
			      TableName: "traces",
			      Key: { id: req.params.traceId },
			      UpdateExpression: 'set #queue.#file_name = :file_object',
			      ExpressionAttributeNames: {
			        '#file_name': file.name,
			        '#queue': 'queue'
			      },
			      ConditionExpression: 'attribute_not_exists(#queue.#file_name)',
			      ExpressionAttributeValues: {
			        ':file_object': {
			          'name': file.name,
			          'size': file.size,
			          'done': 0,
			          'need': 1000000000000,
			        }
			      }
			      }, function(data, err) {
			        if (err.stack) console.log("Eroor in adding file information to the database " + JSON.stringify(err.stack));
			        else {
			          // send message to client that the extraction has completed and the required number of blocks
			          // io.emit(`extract_${req.params.traceId}`, { 'file': file.name, 'num_blocks': num_blocks });
			          console.log("done");
			        }
			    });

			    console.log(req.params.traceId);


				const zlib = require('zlib');
				const id = req.params.traceId;
				var file_count = 0; // the count for the file name
				var count = 0; // counting the number of lines for the current file 
				var output_file_name; // the output file name that changes everytime
				var outStream; // the outstream that will change when the line limit is hit 
				createNewWriteStream(id); // create the initial write stream 
				const data_location = form.uploadDir;
				var start_date_string;
				var num_files = 0;
				var read_done = 0;
				
				const file_name = file.name;
				const file_size = file.size;

				const num_blocks = Math.ceil(file_size/50000000) * 10;

				io.emit(`extract_${req.params.traceId}`, { 'file': file.name, 'num_blocks': num_blocks });

				// read the gz file and pipe the output to gunzip which gives the extracted output 
				var gzip_read_stream = fs.createReadStream(`${data_location}/${file_name}`)
					.pipe(zlib.Gunzip());

				// pipe the extracted files stream to readline to read it line by line
				var lineReader = require('readline').createInterface({
				    input: gzip_read_stream
				});

				// each line is placed on its proper part file 
				lineReader.on('line', function(line) {
					count++;
					outStream.write(line + '\n');
					if (!start_date_string) {
						if (line.includes("begins:")) {
				          var date_string = line.split("begins:")[1];
				          const date_obj = moment(date_string, " ddd MMM  D HH:mm:ss YYYY");
				          start_date_string = date_obj.format("YYYY-MM-DD-HH-mm-ss");
				          console.log("The trace begins on " + start_date_string);
						}
					}
					if (count > 400000) {
						uploadAndProcess(`${id}/${file_name}/parts/part${file_count}`, output_file_name, file_count);
						file_count++; // increase the file count so that the next file is created
						outStream.end();
						createNewWriteStream(id);
					}
				});

				lineReader.on('close', function() {
				    if (count > 0) {
				        console.log('Final close:', output_file_name, count);
				    }
				    gzip_read_stream.close();
				    outStream.end();
				    console.log('Done');
				    read_done = file_count + 1
				    uploadAndProcess(`${id}/${file_name}/parts/${file_count}`, output_file_name, file_count);
		          	// send message to client that the extraction has completed and the required number of blocks
		          	//io.emit(`extract_${id}`, { 'file': file.name, 'num_blocks': file_count });
		          	io.emit(id, "Read the entire file");
				});

				function createNewWriteStream(id) {
					output_file_name = path.join(__dirname, `/uploads/${id}/part` + file_count);
					outStream = fs.createWriteStream(output_file_name);
					count = 0;
				}

				function uploadAndProcess(key, file_path, file_count) {
					// console.log("processed");
					// console.log(key);
					// console.log(file_path);
					var uploadParams = { Bucket: 'fstraces', Key: key , Body: ''};
			        var fileStream = fs.createReadStream(file_path);
			        fileStream.on('error', function(err) {
			          console.log('File Error', err);
			        });
			        uploadParams.Body = fileStream;
			        //console.log("going to upload this");
			        s3.upload (uploadParams, function (err, data) {
			        	//console.log("inside upload");
						if (err) {
							console.log("Error", err);
						}
						else {
				            //console.log("Upload Success", data.Location);

				            fs.unlink(file_path, function(e) {
				              if (e) console.log(e);
				            });

				            // invoke lambda function to process the trace when the upload is a sucess

				            const payload = {
				              "key": key,
				              "id": id,
				              "file": file_name,
				              "part": `${file_count}`,
				              "start_date": start_date_string,
				              "size": file_size,
				              "lambda_needed": file_count
				            };

				            var lambda_params = {
				             FunctionName: "arn:aws:lambda:us-east-2:722606526443:function:process_gpfs_trace",
				             Payload: JSON.stringify(payload),
				            };

							lambda.invoke(lambda_params, function(err, data) {
								if (err) {
									console.log('lambda error');
									console.log(err, err.stack); 
								} else {
									io.emit(`lambda_${req.params.traceId}`);
									num_files = num_files + 1;
									// io.emit(`lambda_${m.traceId}`);
									// process.send({ msg: "lambda" });
									// when all the lambda function has finished processing 
									// call a socket to tell the page that new data is 
									// avaialble 
									//console.log("num files is " + num_files);
									//console.log("read_count is " + file_count);
									if (read_done && num_files == read_done) {
										console.log("read done is " + read_done);
										console.log(num_files);
										
							            const combine_json_payload = {
							              "id": id,
							              "file": file_name
							            };
							            lambda_params = {
							             FunctionName: "arn:aws:lambda:us-east-2:722606526443:function:combine_json",
							             Payload: JSON.stringify(combine_json_payload),
							            };
							            lambda.invoke(lambda_params, function(err, data) {
							            	if (err) console.log(err, err.stack);
							            	else {
												let end = moment();
												let diff = end.diff(start);
												let f = moment.utc(diff).format("HH:mm:ss.SSS");
												console.log(f);
							            		io.emit(`calculation_done_${req.params.traceId}`);
							            	}
							            });
										// params = {
										// 	ExpressionAttributeValues: {
										// 		":id": idnum_
										// 	},
										// 	KeyConditionExpression: "id = :id",
										// 	TableName: "traces"
										// }


										// 	ddb.query(params, function(err, data) {
										// 		if (err) console.log(err)
										// 		else {
										// 			console.log("DAKNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL")
										// 			//io.emit("metricChange", data.Items[0]);
										// 			//io.emit(`calculation_done_${req.params.traceId}`);
										// 			//process.send({ msg: "done" });
										// 		}
										// 	});

									}
								}
							});
						}
			        });
				}
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

	// parse the incoming request containing the form data
	form.parse(req);

	res.send('ok');
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
    	ownerEmail: req.session.key.email
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

app.get('/profile', (req, res) => {
	if (req.session && req.session.key) {
		// const params = {
		// 	ExpressionAttributeValues: {
		// 		":email": req.session.key.email
		// 	},
		// 	KeyConditionExpression: "email = :email",
		// 	TableName: "users"
		// }
		// ddb.query(params, function(err, data) {
		// 	if (err) console.log(err)
		// 	else res.render('profile', { 'user': data.Items[0], 'userId': req.session.key })
		// });

		if (req.session.key.accessCode == "ibm_emory") {
			const queue_params = {
				TableName: "queue"
			}
			ddb.scan(queue_params, function(err, data) {
				if (err) console.log(err)
				else {
					queue = data.Items;
					res.render('profile', { 'queue': data.Items, 'user': req.session.key, 'userId': req.session.key });
				}
			});
		} else {
			res.render('profile', { 'queue': [], 'user': req.session.key, 'userId': req.session.key });
		}
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

