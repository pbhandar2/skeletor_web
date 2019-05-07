console.log("init.js");

// initiating metadata
init_meta();

renderFileListContainer();

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
			"colorScale": d3.scaleSequential(d3.interpolateWarm).domain([0, 25]),
			"data": [],
			"content": []
		}
		file_meta[`${file.name}_${file.timestamp}`] = meta;
	});

}

