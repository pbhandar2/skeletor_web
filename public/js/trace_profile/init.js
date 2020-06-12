// constants 
const margin = {top: 20, right: 20, bottom: 110, left: 60},
	margin2 = {top: 530, right: 20, bottom: 30, left: 40}
	id = trace.id,
	queue = trace.queue,
	files = trace.files

// this object holds all the metadata necessary for a file 
var file_meta = {}

// initiating metadata
init_meta();

// render the graph conatiners
renderGraphContainer();

function init_meta() {

	// initiating the metadata for each file 
	files.forEach((file) => {
		meta = {
			"graph": {
				"svg": null,
				"x": null,
				"y": null,
				"x2": null,
				"y2": null,
				"xAxis": null,
				"xAxis2": null,
				"yAxis": null,
				"focus": null,
				"lineChart": null
			},
			"metrics": [],
			"lines": [],
			"colorScale": d3.scaleSequential(d3.interpolateWarm).domain([0, 25]), // NOT SURE FIX THIS
			"data": []
		}
		file_meta[`${file.name}_${file.timestamp}`] = meta;
	});

}

