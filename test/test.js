const assert = require('assert');
const fs = require('fs');
const appDir = JSON.parse(fs.readFileSync("settings.json")).dev_app_dir;

const traceProcessor = require("../library/traceProcessor");
const startup = require("../library/startup");
const aws = require("../library/aws");

describe('Startup', function() {

	describe('#start()', function() {
	    it('should return 1 when test files are available locally', function() {
	      assert.equal(startup.start(), 1);
	    })
	});
	
});

describe('TraceProcessor', function() {

	describe('#getTraceStartDate()', function() {
	    it('should not return null for the file t1.gz', function(done) {
	    	const start_date_promise = traceProcessor.getTraceStartDate(`${appDir}/uploads/test/t1.gz_12345/t1.gz`);
	    	start_date_promise.then((date) => {
	    		console.log(date);
	    		assert.notEqual(date, 0);
	    	}).catch((err) => {
	    		console.log(err);
	    	}).then(done, done);
	    });

	    it('should not return null for the file t2.gz', function(done) {
	    	const start_date_promise = traceProcessor.getTraceStartDate(`${appDir}/uploads/test/t2.gz_12345/t2.gz`);
	    	start_date_promise.then((date) => {
	    		console.log(date);
	    		assert.notEqual(date, 0);
	    	}).catch((err) => {
	    		console.log(err);
	    	}).then(done, done);
	    });

	    it('should return null for the file tx.gz', function(done) {
	    	const start_date_promise = traceProcessor.getTraceStartDate(`${appDir}/uploads/test/tx.gz_12345/tx.gz`);
	    	start_date_promise.then((date) => {
	    		assert.equal(date, 0);
	    	}).catch((err) => {
	    		console.log(err);
    		}).then(done, done);
	    });
	});

});

describe('#createTrace()', function() {
    it('should return 1 if the trace is added to the db', function(done) {
    	const trace_object = {
    		id: "test",
    		name: "testing mocha",
    		description: "test mocha",
    		display: "false",
    		ownerId: "fd2c5760-ab38-11e8-9382-a94f714d54e3",
    		ownerEmail: "test@test.com",
    		uploadedOn: new Date().toString(),
    		files: [],
    		queue: {}
    	}

    	const create_trace_promise = aws.create_trace(trace_object);
    	create_trace_promise.then((flag) => {
    		assert.equal(flag, 1);
    	}).catch((err) => {
    		console.log(err);
    	}).then(done, done);
    });

    it('should return 1 if the file is added to the queue', function(done) {
    	const file = {
    		name: "t1.gz",
    		size: 421592945,
            timestamp: 12345,
    		path: "/uploads/test/t1.gz_12345/t1.gz"
    	}

    	const add_file_promise = aws.add_file(file, "test");
    	add_file_promise.then((flag) => {
    		assert.equal(flag, 1);
    	}).catch((err) => {
    		console.log(err);
    	}).then(done, done);
    });

    it('should return 1 if the file is added to the queue', function(done) {
        const file = {
            name: "t2.gz",
            size: 242079728,
            timestamp: 12345,
            path: "/uploads/test/t2.gz_12345/t2.gz"
        }

        const add_file_promise = aws.add_file(file, "test");
        add_file_promise.then((flag) => {
            assert.equal(flag, 1);
        }).catch((err) => {
            console.log(err);
        }).then(done, done);
    });

//     // it('should return 1 if the trace is deleted', function(done) {
//     // 	const remove_trace_promise = aws.remove_trace("0");
//     // 	remove_trace_promise.then((flag) => {
//     // 		assert.equal(flag, 1);
//     // 	}).catch((err) => {
//     // 		console.log(err);
//     // 	}).then(done, done);
//     // });

    it('should return 1 if the trace is sucessfully processed', function(done) {
    	this.timeout(0);
    	const file_name = 't1.gz';
        const file = {
            name: "t1.gz",
            size: 421592945,
            timestamp: 12345,
            path: "/uploads/test/t1.gz_12345/t1.gz"
        }
    	const process_trace_file_promise = traceProcessor.processTraceFile(file, "test");
    	process_trace_file_promise.then((flag) => {
    		assert.equal(flag, 1);
    	}).catch((err) => {
    		console.log(err);
    	}).then(done, done);
    });

    // it('should return 1 if the trace is sucessfully broken', function(done) {
    //     this.timeout(0);
    //     const file_name = 't2.gz';
    //     const process_trace_file_promise = traceProcessor.processTraceFile(file, "test");
    //     process_trace_file_promise.then((flag) => {
    //         assert.equal(flag, 1);
    //     }).catch((err) => {
    //         console.log(err);
    //     }).then(done, done);
    // });

});


