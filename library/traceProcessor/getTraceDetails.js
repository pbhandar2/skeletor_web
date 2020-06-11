const fs = require('fs');
const path = require('path');
const moment = require('moment');
const readlines = require('readline');
const zlib = require('zlib');

const current_location = path.resolve(__dirname).split("/library");
const app_dir = current_location[current_location.length - 2];

// AWS MODULE
const aws_service = require(`${app_dir}/modules/aws.js`);
const lambda = aws_service.lambda();
const s3 = aws_service.s3();

/*
	This function get the start data from the trace file. 

	This is done because the file is going to be fragmented into multiple pieces and the data in the file is relative time. So only the first piece of the trace will have information regarding the date. 

	Also different formats have date expressed differently in different places. 

	One assumptiont that it makes is that it is within the first 10 lines. If not, it will not process further. 

	Params:
		file_loc: location of the file to be processed 

*/
async function get_trace_start_date(file_loc) {

	return await new Promise((resolve, reject) => {

		// the variable to keep track of line so that we don't read more than 10 lines
		let line_count = 0;

		// creating a read stream and piping the result to Gunzip to extract and get the text
		const gzip_read_stream = fs.createReadStream(file_loc)
			.pipe(zlib.Gunzip());

		// pipe the extracted files stream to readline to read it line by line
		const lineReader = require('readline').createInterface({
		    input: gzip_read_stream
		}).on('line', (line) => {
			if (line.includes("begins:")) { // for format T1
				const date_string = line.split("begins:")[1];
				const date_obj = moment(date_string, " ddd MMM  D HH:mm:ss YYYY");
				const start_date_string = date_obj.format("YYYY-MM-DD-HH-mm-ss");
				gzip_read_stream.destroy();
				resolve(start_date_string);
			} else if (line.includes("all streams included")) { // for format T2
				const split_line = line.split(" ").filter(String);
				const date_string = split_line.slice(3, 8).join(" ");
				const date_obj = moment(date_string, "ddd MMM D HH:mm:ss.SSS YYYY");
				const start_date_string = date_obj.format("YYYY-MM-DD-HH-mm-ss");
				gzip_read_stream.destroy();
				resolve(start_date_string);
			}

			// if the line count is more than 10 then destroy the stream and send null back
			if (line_count > 10) {
				gzip_read_stream.destroy();
				lineReader.close();
				resolve(0);
			}

			line_count++;
		});
	});
}

/*
	This function upload a piece of the file and calls lambda to process it.  

	Params:
		output_file_name: location of the file to be uploaded and processed  
		key: the key of the file in S3
		io: io object to make socket events happen 
		id: id of the trace the file belongs to 
		timestamp: the timestamp associated with this file
		file_name: the name of the file 
		start_date_string: the start date of the file 
*/
async function upload_and_process(output_file_loc, key, io, id, timestamp, file_name, start_date_string, size, file_completed) {
	return await new Promise((resolve, reject) => {
		// upload the current file 
		const upload_file_promise = upload_file(output_file_loc, key);

		// once the file is uploaded
		upload_file_promise.then((file_loc) => {

			// once the file is uploaded now you can remove it 
			fs.unlinkSync(file_loc);

			// get the file number so that we can tell the lambda function which file to process 
			const split_file_name = file_loc.split("/");
			const file_number = split_file_name[split_file_name.length-1];

			// create a payload for the lambda function 
			const payload = {
			  "key": `${id}/${file_name}_${timestamp}/parts/${file_number}`,
			  "id": id,
			  "file": file_name,
			  "part": `${file_number}`,
			  "start_date": start_date_string,
			  "date": start_date_string, // THIS IS REDUNDANT NEED TO CHECK WHY THIS IS HERE 
			  "timestamp": timestamp
			};

			// call the lambda function with the above payload 
			const lambda_promise = call_lambda(payload, "arn:aws:lambda:us-east-2:722606526443:function:GPFS_IBM_process");

			// once the lambda is completed 
			lambda_promise.then((flag) => {


				resolve(1);

			});

		}).catch((err) => {
			console.log("Error from function upload_file");
			console.log(err);
			reject(err);
		});

	});
}


/*
	This function processes the trace file. 
	1. Break the file into 50MB pieces and upload to S3. 
	2. Call Lambda function in order to process each of the files. 
	Once all the files have been processed. 
	Call a lambda function that combines all the files. 

	Params:
		file_object: the file object contains information like the name of the file, path of the file and the timestamp that differentiates files with the same name 
		id: the id of the trace that the file it belongs to 
		io: 

*/
async function process_trace(file_object, id, io) {

	const file_name = file_object.name;
	const path = file_object.path;
	const timestamp = file_object.timestamp;
	const size = file_object.size;

	// This is the promise in order to process the file. 
	return await new Promise((resolve, reject) => {
		try {

			// get the start date of the file so that we get the idea of when the trace begins 
			const get_start_date_promise = get_trace_start_date(`${app_dir}/uploads/${id}/${file_name}_${timestamp}/${file_name}`);

			// once the start date has been extracted 
			get_start_date_promise.then((start_date_string) => {

				let line_count = 0;
				let file_count = 0;
				let file_completed = 0;
				let done = 0;
				let output_file_name = `${app_dir}/uploads/${id}/${file_name}_${timestamp}/${file_count}`;
				let outStream = fs.createWriteStream(output_file_name);

				console.log(`The start date is ${start_date_string}`);

				// read the gz file and pipe the output to gunzip which gives the extracted output
				var gzip_read_stream = fs.createReadStream(`${app_dir}/uploads/${id}/${file_name}_${timestamp}/${file_name}`)
					.pipe(zlib.Gunzip());

				// pipe the extracted files stream to readline to read it line by line
				var lineReader = require('readline').createInterface({
				    input: gzip_read_stream
				});

				// each line is placed on its proper part file
				lineReader.on('line', function(line) {

					// incrementing the line count and writing the line to the output stream which is the current piece of the file being created
					line_count++;
					outStream.write(line + '\n');

					// if the number of lines in the file reaches a certain threshold then break and move on to the next file 
					if (line_count > 400000) {

						outStream.end(); // end the current outstream 

						line_count = 0; // reset the line count 

						// the key to upload file to S3
						key = `${id}/${file_name}_${timestamp}/parts/${file_count}`

						console.log(key);

						// Call the upload file main function which handles uploading file to S3 and calling lambda 
						upload_and_process_promise = upload_and_process(output_file_name, key, io, id, timestamp, file_name, start_date_string, size, file_completed);

						file_count += 1; // update the count of the number of pieces of the given file 
						
						// new output file name and the output stream for it 
						output_file_name = `${app_dir}/uploads/${id}/${file_name}_${timestamp}/` + file_count;
						outStream = fs.createWriteStream(output_file_name);

						// once the file is uploaded and processed 
						upload_and_process_promise.then((file_loc) => {

							console.log(`file_completed: ${file_completed}, file_count: ${file_count}, done: ${done}`);

							file_completed++; // update the count of the number of files that have been processed 

							// sending the update to the client side where it will increase the progress bar 
							if (io) {
								//console.log(`Socket: lambda_${id}`);
								io.emit(`lambda_${id}`, file_name, timestamp, size, file_completed);
							}

							// if the file completed is equal to the file count and the done flag is set which signifies that we are at the end of the file meaning the whole file has been read 
							if (file_completed == file_count && done) {
								done = 0; // just covering for race conditions, once it is in here it shouldn't be here again 

								console.log("COMPLETED UPLOADING ALL FILE!");

								// payload for the combine json lambda call 
								const get_final_json_payload = {
									"id": id,
									"file": file_name,
									"timestamp": timestamp
								}

								// calling lambda that combines all the metrics from different pieces 
								const get_final_json_promise = call_lambda(get_final_json_payload, "arn:aws:lambda:us-east-2:722606526443:function:get_file_metrics");
								get_final_json_promise.then((flag) => {
									console.log("COMPLETED METRIC CALCULATION!")
									if (io) {
										io.emit(`calculation_done_${id}`);
									}
									fs.unlinkSync(`${app_dir}/uploads/${id}/${file_name}_${timestamp}/${file_name}`);
									resolve(1);
								}).catch((err) => {
									console.log("Error from function call_lambda when combining the individual traces.")
									console.log(err);
									reject(err);
								});
							}

						}).catch((err) => {
							console.log(`Error from function upload_and_process`);
							console.log(err);
							reject(err);
						});

					}
				});

				// this means that the whole file has been read 
				lineReader.on('close', function() {
					
					gzip_read_stream.close(); // close the stream once the whole file has been read 
					outStream.end();
					done = 1;
					
					// uploading the processing the last piece 
					key = `${id}/${file_name}_${timestamp}/parts/${file_count}`
					upload_and_process_promise = upload_and_process(output_file_name, key, io, id, timestamp, file_name, start_date_string, size, file_completed);
					file_count += 1;
					upload_and_process_promise.then((file_loc) => {

						console.log(`file_completed: ${file_completed}, file_count: ${file_count}, done: ${done}`);

						file_completed++; // update the count of the number of files that have been processed 

						if (file_completed == file_count && done) {

							done = 0; 

							console.log("COMPLETED UPLOADING ALL FILE!");

							// payload for the lambda file to combine different traces 
							const get_final_json_payload = {
								"id": id,
								"file": file_name,
								"timestamp": timestamp
							}

							// calling lambda that combines all the metrics from different pieces 
							const get_final_json_promise = call_lambda(get_final_json_payload, "arn:aws:lambda:us-east-2:722606526443:function:get_file_metrics");
							get_final_json_promise.then((flag) => {
								console.log("COMPLETED METRIC CALCULATION!")
								if (io) {
									io.emit(`calculation_done_${id}`, file_name, timestamp);
								}
								fs.unlinkSync(`${app_dir}/uploads/${id}/${file_name}_${timestamp}/${file_name}`);
								resolve(1);
							}).catch((err) => {
								console.log("Error from function call_lambda when combining the individual traces.")
								console.log(err);
								reject(err);
							});
						}
					});

					resolve(1);
				});
			}).catch((err) => {
				console.log(`Error in function get_trace_start_date`);
				console.log(err);
				reject(err);
			});
		}
		catch(err) {
			console.log(err);
			console.log("Error in function process_trace");
			reject(err);
		}
	});

}

/*
	This function uploads the file in a given location to S3 with the given key. 

	Params:
		file_loc: the location of the file to be uploaded
		key: the key for the file in S3

*/
async function upload_file(file_loc, key) {

	return await new Promise((resolve, reject) => {

		let uploadParams = { Bucket: 'fstraces', Key: key , Body: ''};

		// create a filestream for upload to S3
		const fileStream = fs.createReadStream(file_loc);
		fileStream.on('error', function(err) {
			reject(err);
		});
		uploadParams.Body = fileStream;
		s3.upload (uploadParams, function (err, data) {
			if (err) reject(err);
			else resolve(file_loc);
		});
	});

}


/*
	This function calls the lambda function with a given payload and funciton arn. 

	Params:
		payload: the parameters to be sent to the lambda function
		function_arn: the arn of the function to be called 

*/
async function call_lambda(payload, function_arn) {

	console.log(`calling arn: ${function_arn}`);
	console.log(payload);

	return await new Promise((resolve, reject) => {
		var lambda_params = {
			FunctionName: function_arn,
			Payload: JSON.stringify(payload),
		};

		lambda.invoke(lambda_params, function(err, data) {
			if (err) reject(err);
			else {
				resolve(1);
			}
		});
	});

}



module.exports = { get_trace_start_date, process_trace };
