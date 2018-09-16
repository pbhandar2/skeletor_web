function create_trace(trace_object) {
	return require("./trace.js").add_trace(trace_object);
}

function remove_trace(traceId) {
	return require("./trace.js").remove_trace(traceId);
}

function add_file(file, traceId) {
	return require("./trace.js").add_file(file, traceId);
}

module.exports = { create_trace, remove_trace, add_file };