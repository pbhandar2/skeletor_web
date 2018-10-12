const fs = require('fs');
const path = require('path');
const testFiles = JSON.parse(fs.readFileSync("settings.json")).test_files;
const appDir = JSON.parse(fs.readFileSync("settings.json")).dev_app_dir;
const s3 = require(`${appDir}/modules/aws.js`).s3();

function check() {
	const testFilesPath = "./uploads/test/";
	for (let i = 0; i < testFiles.length; i++) {
		//console.log(`${testFilesPath}${testFiles[i]}_12345/${testFiles[i]}`);
		if (!fs.existsSync(`${testFilesPath}${testFiles[i]}_12345/${testFiles[i]}`)) {
			return 0;
		}
	}
	return 1;
}

/*
	UNDER CONSTRUCTION
*/
function setup() {

	// first check if the uploads/test directory exists 
	const uploads_dir = `${appDir}/uploads`;
	if (!fs.existsSync(uploads_dir)) fs.mkdirSync(uploads_dir);

	const test_dir = `${uploads_dir}/test`;
	if (!fs.existsSync(test_dir)) fs.mkdirSync(test_dir);

	let error = 0;

	testFiles.forEach((file) => {
		const params = {
			Bucket: "fstraces",
			Key: `test/${file}`
		}
		s3.getObject(params, function(err, data) {
			if (err) {
				console.log(error);
				error = 1;
			}
		})
	});

	return error;
}

module.exports = { check }