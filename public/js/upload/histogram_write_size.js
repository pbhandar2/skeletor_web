// the svg for histrogram of write sizes
const svg_hist_write = d3.select("#svg2");



// var x_hist_write = d3.scale.ordinal().rangeRoundBands([0, width], .05);
// var y_hist_write = d3.scale.linear().range([height, 0]);

const test_file = "";
// set the ranges



// var dataset = [80, 100, 56, 120, 180, 30, 40, 120, 160];

// // I need to load the JSON but need to filter based on the current value of the zoom 
// function load_write_distribution() {
// 	d3.json(test_file, function (error, d) {

// 	});
// }

// Now what I have to do is write a function that processes the data 

function load_write_dist_data() {

	var dataset = [80, 100, 56, 120, 180, 30, 40, 120, 160];
	var max = d3.max(dataset)

	var barPadding = 5;
	var barWidth = (width / dataset.length);

	var options = ["x", "a", "b", "c", "d", "e", "f", "g", "h"]

	var x_scale_hist_write = d3.scalePoint().range([0, width])

	var y_scale_hist_write = d3.scaleLinear()
		.domain(dataset).range([0, height])

	svg_hist_write.append("g")
		.attr("class", "y_axis_hist_write")
		.call(d3.axisLeft(y_scale_hist_write))

	svg_hist_write.append("g")
		.attr("transform","translate(5," + height + ")")
		.attr("class", "axis")
		.call(d3.axisBottom(x_scale_hist_write))


	svg_hist_write.selectAll("rect")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("y", function(d) {
			return height - d -10
		})
		.attr("height", function(d) {
			return d
		})
		.attr("x", function(d, i) {
			console.log(d.x0)
			return i * (barWidth + barPadding) + barPadding
		})
		.attr("width", barWidth)

}



function remove_write_dist_data() {
	while(document.getElementById("hist_write_rect")){
		document.getElementById("hist_write_rect").remove()
	}
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
  console.log('Taking a break...');
  load_write_dist_data();
  await sleep(5000);
  remove_write_dist_data();
  console.log('Two seconds later');
  await sleep(5000);
  console.log('back at it');
  load_write_dist_data();
}

//demo();

load_write_dist_data();