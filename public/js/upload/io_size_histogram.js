document.getElementById("io-size-hist-container").hidden = true;
let io_size_hist_data = [];
let io_size_hist_data_files = []
let data_dict = {}

const io_size_hist_svg = d3.select("#svg2"),
	io_hist_margin = {top: 0, right: 20, bottom: 20, left: 20},
	io_hist_width =+ io_size_hist_svg.attr("width") - io_hist_margin.left - io_hist_margin.right,
	io_hist_height =+ io_size_hist_svg.attr("height") - io_hist_margin.top - io_hist_margin.bottom

io_hist_data = [1,2,3,4,5,6]
// const bar_width = io_hist_width/io_hist_data.length
// console.log(bar_width)

//const io_hist_y = d3.scaleLinear().range([io_hist_height, 0])
// io_hist_y.domain([0, d3.max(io_hist_data)])
// const io_hist_y_axis = d3.axisLeft(io_hist_y).ticks(2)

// const io_hist_x = d3.scaleBand().range([0, io_hist_width]).paddingOuter(0.1)
// io_hist_x.domain(io_hist_data)
// const io_hist_x_axis = d3.axisBottom(d3.scaleBand().domain(['Apples','Oranges','Pears','Plums','Banana','Grapes']).range([0, io_hist_width]))

$(document).ready(function() {
  /*
    The function fired when the io_size distribution button.
  */
	$('.io_size_dist_button').on('click', function (e){
		e.preventDefault();
    const file_name = this.id.split(`-IO_SIZE_DIST`)[0];
    const current_class = this.className;
    const file_obj = files.find((file_obj) => file_obj["name"] == file_name);
    const timestamp = file_obj["timestamp"];
		if (current_class.includes("btn-light")) {
			this.className = "btn btn-success io_size_dist_button";
      document.getElementById("io-size-hist-container").hidden = false;
      io_size_hist_data_files.push({
        "name": file_name,
        "timestamp": timestamp
      });
      io_size_hist_init()
		} else {
			this.className = "btn btn-light io_size_dist_button";
      document.getElementById("io-size-hist-container").hidden = true;
      let new_file_list = []
      io_size_hist_data_files.forEach((file_obj) => {
        if (file_obj.name != "file_name") {
          new_file_list.push(file_obj)
        }
      });
      io_size_hist_data_files = new_file_list;
      io_size_hist_init()
		}
  });
});
count = 0
function io_size_hist_init() {
  if (check_io_size_histogram_exists()) {
    remove_io_size_histogram();
  }
  // if (count %2 == 0) {
    data_dict = {}
    io_size_hist_data_files.forEach((file_obj) => {
      io_size_histogram_setup(id, `${file_obj.name}_${file_obj.timestamp}`);
    });
  // }
  // count++;
}

/*
  Check if the histogram is already created
*/
function check_io_size_histogram_exists() {
  if (document.getElementById("io_size_hist_y_axis")) {
    return true;
  }
  return false;
}

/*
  Remove the io_size histogram
*/
function remove_io_size_histogram() {
  console.log("IN HIST Y AXIS")
  //io_size_hist_svg.axis.outerTickSize(0)
  document.getElementById("io_size_hist_y_axis").remove();
  document.getElementById("io_size_hist_x_axis").remove();
  while(document.getElementById("io_size_hist_rect")) {
    document.getElementById("io_size_hist_rect").remove();
  }
}

/*
  Setup the histogram. It checks if the histogram is already created if so
  removes the existing histogram and then goes on to create a new one again.
*/
function io_size_histogram_setup(id, file_name) {
  load_io_size_data(id, file_name);
}

/*
  Once the data is loaded setup the basic histogram
*/
function setup_io_size_histogram() {
  io_size_hist_svg.append("g")
    .attr("class", "io_hist_y_axis")
    .attr("id", "io_size_hist_y_axis")
    .attr("transform", "translate(50,0)")
    .call(io_hist_y_axis)

  io_size_hist_svg.append("g")
    .attr("class", "io_hist_x_axis")
    .attr("id", "io_size_hist_x_axis")
    .attr("transform", `translate(50, ${io_hist_height})`)
    .call(io_hist_x_axis)

  io_size_hist_svg.selectAll("rect")
    .data(io_hist_data)
    .enter()
    .append("rect")
    .attr("y", function(d) {
      return io_hist_height - (d/d3.max(io_hist_data))*io_hist_height
      return 0
    })
    .attr("x", function(d) {
      return 5
    })
    .attr("height", function(d) {
      return (d/d3.max(io_hist_data))*io_hist_height
    })
    .attr("width", bar_width)
    .attr("transform", function(d, i) {
      return `translate(${50+i*bar_width}, ${0})`
    })
    .attr("id", "io_size_hist_rect")
}

// how does the data look? It is a array of dict with date and each size that was accessed in that date. What we have to do is compute the bins and the counts and
// use it as io_hist_data which is the count and the array of names as x_axis value representing values
// How to decide what size of bins to use?
function load_io_size_data(id, file_name) {
  const url = `https://s3.us-east-2.amazonaws.com/fstraces/${id}/${file_name}/io_size.json`;
  d3.json(url, function (error, d) {
    if (error) throw error;
    const data_length = d.length;
    //console.log(`the start time is ${start_time} and end time is ${end_time}`)
    if (start_time) {
      //console.log("THE START TIME HAS BEEN SET.")
    } else {
      start_time = d[0]["date"]
      //console.log(`THE START TIME HAS BEEN SET FROM NULL ${start_time}`)
    }
    if (end_time) {
      //console.log("THE END TIME HAS BEEN SET.")
    } else {
      end_time = d[data_length-1]["date"]
      //console.log(d[data_length-1])
      //console.log(`THE START TIME HAS BEEN SET FROM NULL ${end_time}`)
    }

    start_time_obj = new Date(parseDate(moment(start_time, 'YYYY-MM-DD-HH-mm-ss').format('YYYY-MM-DD-HH-mm-ss'))).getTime();
    end_time_obj = new Date(parseDate(moment(end_time, 'YYYY-MM-DD-HH-mm-ss').format('YYYY-MM-DD-HH-mm-ss'))).getTime();

    let x_vals = []
    let y_vals = []
    // if (Object.keys(data_dict).length === 0 && data_dict.constructor === Object) {
    //   //console.log("DATA DICT EMPTUY")
    // }
    //console.log(data_dict)
    count_array = []
    //console.log(`the start time is ${start_time} and end time is ${end_time}`)
    d.forEach(function(data_obj) {
      date = new Date(parseDate(data_obj.date))
      date_time = date.getTime();
      if (date_time >= start_time_obj && date_time <= end_time_obj) {
        for (var key in data_obj) {
            if (data_obj.hasOwnProperty(key)) {
              if (key != "date" && key != 0) {
                count_array.push(data_obj[key])
                  //console.log(key + " -> " + data_obj[key]);
                  if (key in data_dict) {
                    data_dict[key] += data_obj[key]
                  } else {
                    data_dict[key] = data_obj[key]
                  }
                }
            }
        }
      }
    });

    //console.log(count_array.length)
    // console.log(d3.min(count_array))
    // console.log(d3.max(count_array))

    for (var key in data_dict) {
      x_vals.push(parseInt(key));
      y_vals.push(data_dict[key]);
    }

    //console.log(x_vals)
    //console.log(y_vals)

      let min = d3.min(x_vals)
      let max = d3.max(x_vals)
      let diff = max - min
      let num_bin = 10
      let bin_size = Math.ceil(diff/num_bin)

      //console.log(`min is ${min} and max is ${max}`)
      //console.log(diff)
      //console.log(bin_size)

      bin_values = []
      bin_labels = []

      for (var i=0; i<num_bin; i++) {
        bin_values[i] = 0
        bin_labels[i] = min + i*bin_size + bin_size/2
      }

      count = 0
      x_vals.forEach((x) => {
        cur_diff = x - min
        bin_num = Math.floor(cur_diff/bin_size)
        bin_values[bin_num] += y_vals[count]
        //bin_values.push(min + bin_num*bin_size + bin_size/2)
        //console.log(`adding ${y_vals[count]}`);
        count++;
      });

      //console.log(bin_values)
      //console.log(bin_labels)

      const bar_width = io_hist_width/num_bin
      const io_hist_y = d3.scaleLinear().range([io_hist_height, 0])
      io_hist_y.domain([0, d3.max(y_vals)])
      const io_hist_y_axis = d3.axisLeft(io_hist_y).ticks(4)

      const io_hist_x = d3.scaleBand().range([0, io_hist_width]).paddingOuter(0.1)
      io_hist_x.domain(y_vals)
      console.log(bin_labels)
      const domain_x = d3.scaleBand().domain(bin_labels).range([0, io_hist_width])
      const io_hist_x_axis = d3.axisBottom(domain_x)

      io_size_hist_svg.append("g")
        .attr("class", "io_hist_y_axis")
        .attr("id", "io_size_hist_y_axis")
        .attr("transform", "translate(50,0)")
        .call(io_hist_y_axis)

      io_size_hist_svg.append("g")
        //.attr("class", "io_hist_x_axis")
        .attr("id", "io_size_hist_x_axis")
        .attr("transform", `translate(50, ${io_hist_height})`)
        .call(io_hist_x_axis)

        io_size_hist_svg.selectAll("rect")
          .data(bin_values)
          .enter()
          .append("rect")
          .attr("y", function(d) {
            return io_hist_height - (d/d3.max(bin_values))*io_hist_height
            return 0
          })
          .attr("x", function(d) {
            return 5
          })
          .attr("height", function(d) {
            return (d/d3.max(bin_values))*io_hist_height
          })
          .attr("width", bar_width - 5)
          .attr("transform", function(d, i) {
            return `translate(${50+i*bar_width}, ${0})`
          })
          .attr("id", "io_size_hist_rect")
          .attr("fill", "blue");


  });
}
