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

async function process_trace(file_name, id, io) {

	return await new Promise((resolve, reject) => {
		try {
			const get_start_date_promise = get_trace_start_date(`${app_dir}/uploads/${id}/${file_name}/${file_name}`);

			get_start_date_promise.then((start_date_string) => {

				let line_count = 0;
				let file_count = 0;
				let file_completed = 0;
				let done = 0;
				let output_file_name = `${app_dir}/uploads/${id}/${file_name}/${file_count}`;
				let outStream = fs.createWriteStream(output_file_name);

				// read the gz file and pipe the output to gunzip which gives the extracted output 
				var gzip_read_stream = fs.createReadStream(`${app_dir}/uploads/${id}/${file_name}/${file_name}`)
					.pipe(zlib.Gunzip());

				// pipe the extracted files stream to readline to read it line by line
				var lineReader = require('readline').createInterface({
				    input: gzip_read_stream
				});

				// each line is placed on its proper part file 
				lineReader.on('line', function(line) {
					line_count++;
					outStream.write(line + '\n');
					if (line_count > 400000) {
						outStream.end();
						const upload_file_promise = upload_file(output_file_name, `${id}/${file_name}/parts/${file_count}`);
						line_count = 0;
						file_count++;
						output_file_name = `${app_dir}/uploads/${id}/${file_name}/` + file_count;
						outStream = fs.createWriteStream(output_file_name);
						
						upload_file_promise.then((file_loc) => {

							fs.unlinkSync(file_loc);
							const split_file_name = file_loc.split("/");
							const file_number = split_file_name[split_file_name.length-1];

							const payload = {
							  "key": `${id}/${file_name}/parts/${file_number}`,
							  "id": id,
							  "file": file_name,
							  "part": `${file_number}`,
							  "start_date": start_date_string,
							  "date": start_date_string
							};

							const lambda_promise = call_lambda(payload, "arn:aws:lambda:us-east-2:722606526443:function:process_gpfs_trace");
							lambda_promise.then((flag) => {
								file_completed++;
								if (io) {
									console.log(`io is called so calling lambda_${id}`);
									io.emit(`lambda_${id}`, file_name);
								}
								console.log(`split: ${file_count}, completed: ${file_completed}, done: ${done}`);
								if (file_completed == file_count && done) {
									console.log("COMPLETED UPLOADING ALL FILE!");
									const get_final_json_payload = {
										"id": id,
										"file": file_name
									}
									const get_final_json_promise = call_lambda(get_final_json_payload, "arn:aws:lambda:us-east-2:722606526443:function:get_file_metrics");
									get_final_json_promise.then((flag) => {
										console.log("COMPLETED METRIC CALCULATION!")
										if (io) {
											io.emit(`calculation_done_${id}`);
										}
									}).catch((err) => {
										console.log(err);
									});
								}
							}).catch((err) => {
								console.log(`the error is from process_gpfs_trace`);
								console.log(err);
							});

						}).catch((err) => {
							console.log(`the error is from upload file`);
							console.log(err);
						});
						
					}
				});

				lineReader.on('close', function() {
					gzip_read_stream.close();
					outStream.end();
					done = 1;
					resolve(1);
				});
			}).catch((err) => {
				console.log(`this error is from getting trace start date`);
				console.log(err);
			});
		}
		catch(err) {
			console.log(err);
			console.log("try catch in process trace");
			reject();
		}
	});

}

async function upload_file(file_loc, key) {

	return await new Promise((resolve, reject) => {
		let uploadParams = { Bucket: 'fstraces', Key: key , Body: ''};
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

async function call_lambda(payload, function_arn) {

	console.log(`calling arn: ${function_arn}`);

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