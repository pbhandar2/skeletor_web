const path = require('path');
const fs = require("fs");

const current_location = path.resolve(__dirname).split("/library");
const app_dir = current_location[current_location.length - 2];
const aws_service = require(`${app_dir}/modules/aws.js`);
const ddb = aws_service.ddb();
const settings = fs.readFileSync(`${app_dir}/settings.json`);
const settings_json = JSON.parse(settings);
const block_size = settings_json.block_size;



function create_trace_object(trace_item) {
	var params = {
		Item: trace_item,
		TableName: "traces"
	};

	ddb.put(params, function(err, data) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(`Trace Item Created. ${JSON.stringify(trace_item)}`);
			const item_uploads_path = `${app_dir}/uploads/${trace_item.id}`;
			fs.mkdirSync(item_uploads_path);
		}
	}
}

function remove_trace_object(traceId) {

}

function update_trace_object(file) {

}

function remove_file_object(traceId, file) {

}

function remove_queue_object(traceId, file) {

}

module.exports = { create_trace_object, remove_trace_object, update_trace_object, remove_file_object, remove_queue_object };