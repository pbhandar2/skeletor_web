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
const ses = aws_service.ses();

// Mailer
const Mailer = require('./modules/mailer.js');

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

<<<<<<< HEAD

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var http_server = http.Server(app);
var https_server = https.createServer(app);
var io = require('socket.io').listen(http_server);
http_server.listen(80, function(){
  console.log("Listening at :80");
});
https_server.listen(443, function(){
  console.log("Listening at :443");
});
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
const mailer = new Mailer(ses);

io.on('connection', function(socket){

});
=======
function done(params) {
  console.log("it is done");
  console.log(params);
}
>>>>>>> b6ed680e042984c2e979d06470185a7b34faa121


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

app.get('/traceprofile/:traceId', (req, res) => {
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
      if (data.Items[0]) res.render('trace_profile/home', { 'trace': data.Items[0], 'userId': (req.session) ? req.session.key : null  })
      else res.render('error', { 'userId': (req.session) ? req.session.key : null, 'errorMessage': 'The trace does not exist in the database.' })
    }
  });
});

app.post('/traceprofile/:traceId', (req, res) => {

  const start = moment();
  const timestamp = new Date().valueOf();

  // create an incoming form object
  let form = new formidable.IncomingForm({
    uploadDir: __dirname + '/uploads',  // don't forget the __dirname here
    keepExtensions: true
  });
  form.parse(req);

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  form.maxFileSize = 2097314290000;

  // when a file is detected
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

        const aws = require("./library/aws"); // get the aws object
        const add_file_promise = aws.add_file(file_object, req.params.traceId, io, timestamp); // add the file to the trace db object 

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
          });

        }).catch((err) => {
          console.log(err);
        });

      }
    });


  });

  // when the file is uploaded
  form.on('end', function(field, file) {
    console.log("File upload sucessfull.");
    res.send("done");
  });

  // when there is an error
  form.on('error', function(field, file) {
    console.log("Error during file upload.");
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

<<<<<<< HEAD
		// move the file to the proper directory
		fs.rename(file.path, path.join(form.uploadDir, file.name), (error) => {
			if (error) console.log("An error occured while renaming and moving the file." + error);
			else {



			    console.log(req.params.traceId);


				const zlib = require('zlib');
				const id = req.params.traceId;
				var file_count = 0; // the count for the file name
				var count = 0; // counting the number of lines for the current file
				var output_file_name; // the output file name that changes everytime
				var outStream; // the outstream that will change when the line limit is hit
				createNewWriteStream(id); // create the initial write stream
				const data_location = form.uploadDir;
				var start_date_string = "0";
				var num_files = 0;
				var read_done = 0;

				const file_name = file.name;
				const file_size = file.size;
				const original_file_location = `${data_location}/${file_name}`;

				console.log(file_size);

				const num_blocks = Math.ceil(file_size/50000000) * 10;

				console.log(num_blocks);

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
			          'need': num_blocks,
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
					//console.log("this is the start date string here")
					//console.log(start_date_string);
					outStream.write(line + '\n');
					if (start_date_string == "0") {
						if (line.includes("begins:")) {
				          var date_string = line.split("begins:")[1];
				          const date_obj = moment(date_string, " ddd MMM  D HH:mm:ss YYYY");
				          start_date_string = date_obj.format("YYYY-MM-DD-HH-mm-ss");
				          console.log("The trace begins on " + start_date_string);
						}
					}
					if (count > 400000) {
						uploadAndProcess(`${id}/${file_name}/parts/${file_count}`, output_file_name, file_count, original_file_location);
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
				    //console.log('Done');
				    read_done = file_count + 1
				    uploadAndProcess(`${id}/${file_name}/parts/${file_count}`, output_file_name, file_count, original_file_location);
		          	// send message to client that the extraction has completed and the required number of blocks
		          	//io.emit(`extract_${id}`, { 'file': file.name, 'num_blocks': file_count });
		          	io.emit(id, "Read the entire file");
				});

				function createNewWriteStream(id) {
					output_file_name = path.join(__dirname, `/uploads/${id}/` + file_count);
					outStream = fs.createWriteStream(output_file_name);
					count = 0;
				}

				function uploadAndProcess(key, file_path, file_count, original_file_location) {
					// console.log("processed");
					// console.log(key);
					// console.log(file_path);
					var uploadParams = { Bucket: 'fstraces', Key: key , Body: ''};
			        var fileStream = fs.createReadStream(file_path);
			        fileStream.on('error', function(err) {
			          console.log('File Error', err);
			        });
			        uploadParams.Body = fileStream;
			        console.log("going to upload this");
			        s3.upload (uploadParams, function (err, data) {
			        	console.log("inside upload");
						if (err) {
							console.log("Error", err);
						}
						else {
				            console.log("Upload Success", data.Location);

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
				              "test": "test",
				              "date": start_date_string
				            };

				            //console.log("this is my payload" + JSON.stringify(payload))

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
									console.log('lambda done')
									// fs.unlink(file_path, function(err) {
									// 	if (err) console.log(" error in deletion " + err);
									// 	else console.log(` deleted ${file_path}`);
									// });
									//console.log(original_file_location);
									num_files = num_files + 1;
									//var fs = require('fs');
									// console.log(file_path);
									// if (fs.existsSync(file_path)) {
									// 	console.log("IT EXISTS");
									// 	console.log(file_path);
									//     // Do something
									// }
									// io.emit(`lambda_${m.traceId}`);
									// process.send({ msg: "lambda" });
									// when all the lambda function has finished processing
									// call a socket to tell the page that new data is
									// avaialble
									//console.log("num files is " + num_files);
									//console.log("read_count is " + file_count);
									if (read_done && num_files == read_done) {
										//console.log("read done is " + read_done);
										//console.log(original_file_location);

							            const combine_json_payload = {
							              "id": id,
							              "file": file_name,
							              "size": file_size
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

							            		uploadParams = { Bucket: 'fstraces', Key: `${id}/file/${file_name}` , Body: ''};
							            		fileStream = fs.createReadStream(original_file_location);
		            					        fileStream.on('error', function(err) {
										          console.log('File Error', err);
										        });
										        uploadParams.Body = fileStream;
										        s3.upload (uploadParams, function (err, data) {
										        	if (err) console.log(" cannot upload the main file " + err);
										        	else {
										        		console.log("MAIN FILE UPLOADED");
			        						            fs.unlink(original_file_location, function(e) {
											              if (e) console.log(e);
											            });
										        	}
										        });
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
=======
    try {
        fs.mkdirSync(`./uploads/${req.params.traceId}/${file.name}_${timestamp}`);
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
>>>>>>> b6ed680e042984c2e979d06470185a7b34faa121

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

    res.send({"done": 1});

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

app.post('/testup', function(req, res) {
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
		console.log(file);
		console.log(field);
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

<<<<<<< HEAD
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
=======
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
>>>>>>> b6ed680e042984c2e979d06470185a7b34faa121

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

<<<<<<< HEAD
// app.get("/nodata", (req, res) => {
// 	res.render
// });


// TODO: enable and verify an origin email address in ses and request spending limit increase
app.get('/emailtest', (req, res) => {
  mailer.send_notification(["safa.tinaztepe@gmail.com"], "hello", "banana");
  res.render('emailtest');
});


app.get("/testing", (req, res) => {
	res.render("skeletor")
});
=======
const traceProcessor = require("./library/traceProcessor");
>>>>>>> b6ed680e042984c2e979d06470185a7b34faa121
