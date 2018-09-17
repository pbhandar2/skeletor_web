function getTraceStartDate(file_loc) {
	return require('./getTraceDetails.js').get_trace_start_date(file_loc);
}

function processTraceFile(file_loc, id, io) {
	return require('./getTraceDetails.js').process_trace(file_loc, id, io);
}

module.exports = { getTraceStartDate, processTraceFile };