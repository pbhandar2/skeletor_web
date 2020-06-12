const path = require('path');
const fs = require("fs");

const current_location = path.resolve(__dirname).split("/library");
const app_dir = current_location[current_location.length - 2];
const aws_service = require(`${app_dir}/modules/aws.js`);
const ddb = aws_service.ddb();

async function add_trace(user, traceObject) {
	return await new Promise((resolve, reject) => {
		const update_user_params = {
			Key: {
				id: user.id,
				email: user.email
			},
			ExpressionAttributeValues: {
				":trace": [traceObject],
			},
	        ExpressionAttributeNames: {
	            '#t': 'traces'
	        },
	        UpdateExpression: "set #t = list_append(#t, :trace)",
			TableName: "users"
		};

		ddb.update(update_user_params, function(err, data) {
			if (err) {
				reject(err);
			}
			else {
				resolve(1);
			}
		});
	});

}

module.exports = { add_trace }