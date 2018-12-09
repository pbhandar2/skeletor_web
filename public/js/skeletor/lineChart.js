

class LineChart {

	constructor(name, data) {
		this.parseTime = d3.timeParse("%Y-%m-%d-%H-%M-%S");
		this.data = data;
		this.name = name;
		this.width = 1100;
		this.height = 700;
		this.x_scale = null;
		this.y_scale = null;
		this.x_axis = null;
		this.y_axis = null;
		this.line_chart = null;
		this.line = null;
		this.init();
	}

	init() {
		/*
			Initiates the visualization.  
		*/

		// get the main node holding all the visualizations
		const main_div = document.getElementById("display-container");

		// this div wraps the svg element making it a block element which occupies the entire row 
		const svg_wrapper = document.createElement("div");
		svg_wrapper.setAttribute("class", "row");
		svg_wrapper.setAttribute("id", `${this.name}-container`);

		// append the wrapper to the div containing all the visualizations 
		main_div.appendChild(svg_wrapper);
		this.createGraph();

	}

	createGraph() {
		/*
			Create the graph.
		*/

		// append the svg element to this newly created container referened by svg_wrapper
		const svg_main = d3.select(`#${this.name}-container`)
			.append("svg")
			.attr("id", this.name)
			.attr("width", this.width)
			.attr("height", this.height);

		// creatin scales for the axes 
		//this.x_scale = d3.scaleTime().range([0, this.width]);
		this.x_scale = d3.scaleLinear().range([0, this.width]);
		this.y_scale = d3.scaleLinear().range([this.height, 0]);

		// creating the axes and assigning the scales to it 
		this.x_axis = d3.axisBottom(this.x_scale);
		this.y_axis = d3.axisLeft(this.y_scale);

		// creating and appending the line_chart to the svg
		this.line_chart = svg_main.append("g")
			.attr("class", "focus")
			.attr("transform", "translate(50, 50)")

		// getting the domain values from the data 
		this.y_scale.domain([0, 200]).clamp(true);
		this.x_scale.domain([0, 200]).clamp(true);

		// appending the x-axis and y-axis to the graph 
		this.line_chart.append("g")
			.attr("class", "axis axis--y")
			.attr("id", "y-axis")
			.call(this.y_axis);

		this.line_chart.append("g")
			.attr("class", "axis axis--x")
			.attr("id", "x-axis")
			.attr("transform", "translate(0, 630)")
			.call(this.x_axis);

		// this is undefined inside d3.line().x(funcc...) so I am using temp variables
		const x_temp = this.x_scale;
		const y_temp = this.y_scale;

		this.line = d3.line().x(function(d) { 
			return x_temp(d[0]); 
		}).y(function(d) {
			return y_temp(d[1]);
		});

		// append a line to the line chart 
		this.line_chart.append("path")
			.datum([[1,50], [100, 150]])
			.attr("class", "line")
			.style("stroke", "black")
			.style("fill", "none")
			.attr("d", this.line);

		this.zoom_handler = d3.zoom()
			.on("zoom", this.zoomed.bind(this));
		this.zoom_handler(svg_main)

	}

	updateData() {

		const data = this.data;

		this.x_scale.domain([0, 700])
		this.y_scale.domain([0, 600])

		const svg_main = d3.select(`#${this.name}-container`).transition();

		svg_main.select(".line")
			.attr("d", this.line(data));

		svg_main.select("#x-axis")
			.call(this.x_axis)

		svg_main.select("#y-axis")
			.call(this.y_axis)

	}

	zoom() {
		console.log(this.width)
		console.log(this.zoomed)
		d3.zoom()
			.scaleExtent([1, Infinity])
			.translateExtent([[0, 0], [this.width, this.height]])
			.extent([[0, 0], [this.width, this.height]])
			.on("zoom", this.zoomed.bind(this))
	}

	zoomed() {

		// console.log(`applying transformation ${d3.event.transform.toString()}`);

		this.x_scale.domain(d3.event.transform.rescaleX(d3.scaleLinear().range([0, this.width])).domain())

		const svg_main = d3.select(`#${this.name}-container`);
		this.line_chart.select(".line").attr("d", this.line);
		svg_main.select("#x-axis")
			.call(this.x_axis)

	}

}