const testFilesSetup = require("./setupTestFiles.js");

function checkTestFiles() {
	return testFilesSetup.check();
}

function start() {
	return checkTestFiles();
}

module.exports = { start }