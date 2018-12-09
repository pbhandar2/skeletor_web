
createLineChart();

function createLineChart() {
	const data = [[10, 100], [20, 120], [46, 200], [60, 350], [250, 300]];
	const data_banner = new DataBanner(data)
	const l1 = new LineChart("chart1", data);

	
	  // set up some code to be executed later, in 5 seconds (5000 milliseconds):
	  // setTimeout(function () {
	  //   l1.updateData();
	  // }, 5000);
}