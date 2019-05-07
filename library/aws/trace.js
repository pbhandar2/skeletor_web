const path = require("path");
const fs = require("fs");

// importing aws services
const current_location = path.resolve(__dirname).split("/library");
const app_dir = current_location[current_location.length - 2];
const aws_service = require(`${app_dir}/modules/aws.js`);
const ddb = aws_service.ddb();

// getting the block size from settings.json
const settings = fs.readFileSync(`${app_dir}/settings.json`);
const settings_json = JSON.parse(settings);
const blockSize = 50000000;


async function add_trace(traceObject) {
	return await new Promise((resolve, reject) => {

		const params = {
			Item: traceObject,
			TableName: "traces"
		};

		ddb.put(params, function(err, data) {
			if (err) reject(err);
			else {
				const userObject = {
					id: traceObject.ownerId,
					email: traceObject.ownerEmail
				}

				// adding the trace object to the user's list of traces
				const add_traceId_user_promise = require("./user.js").add_trace(userObject, traceObject);
				add_traceId_user_promise.then((flag) => {
					resolve(flag);
				}).then((err) => {
					reject(err);
				});
			}
		});

	});
}

async function remove_trace(traceId) {
	return await new Promise((resolve, reject) => {

		const params = {
			Key: {
				"id": traceId
			},
			TableName: "traces"
		}

		ddb.delete(params, function(err, data) {
			if (err) reject(err);
			else resolve(1);
		});

	});
}

async function add_file(file, traceId, io, timestamp) {
	return await new Promise((resolve, reject) => {

		/*
			the estimated number of blocks is needed to compute an estimated
			progress percentage to show to the user
		*/
		const fileSize = file.size;
		const estExtractedFileSize = fileSize * 15;
		const numBlocks = Math.ceil(estExtractedFileSize/blockSize);
		const fileName = `${file.name}_${file.timestamp}`;

		if (io) {
			//console.log(`io is called so calling extract_${traceId}`);
			io.emit(`extract_${traceId}`, file.name, file.timestamp, file.size, 0);
		}

		// console.log("we are in aws add file")
		// console.log(traceId)
		// console.log(file)
		// console.log("what is the error")

		const params = {
			TableName: "traces",
			Key: { "id": String(traceId) },
			ExpressionAttributeNames: {
				'#file_name': fileName,
				'#queue': 'queue'
			},
			//ConditionExpression: 'attribute_not_exists(#queue.#file_name)',
			ExpressionAttributeValues: {
				':file_object': {
					'name': String(fileName),
					'size': String(file.size),
					'done': 0,
					'need': numBlocks,
				}
			},
			UpdateExpression: 'set #queue.#file_name = :file_object'
		};

		ddb.update(params, function(err, data) {
			if (err) reject(err);
			else resolve(1);
		});

	});
}

module.exports = { add_trace, remove_trace, add_file }
