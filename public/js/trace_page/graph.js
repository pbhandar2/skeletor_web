// data is a dict which holds the data for each file that is loaded where the 
// key is the name of the file 
let data = {}; 

// metric_value_range is a dict that holds the maximum value for each metric
// of a file so that we know what to scale the y-axis to when a metric is added
let metric_value_range = {};

// tracking the max value to change the y-axis when needed 
let global_y_max = 0;

// function that parses the data to one that d3.js can use
const parseDate = d3.timeParse("%Y-%m-%d-%H-%M-%S");

let line, line2, gX, gY;
let lines1 = {};
let lines2 = {};
let line_array = [];

/*
  This function loads the data into the variables for later use in the chart.
  @params:
    id: the trace id to which the file belongs
    file_name: the name of the file
*/
function loadData(id, file_name) {
  const url = `https://s3.us-east-2.amazonaws.com/fstraces/${id}/${file_name}/final.json`;
  const file_object = getFileObject(file_name);
  const fields = file_object.fields;

  d3.json(url, function (error, d) {
    if (error) throw error;
    const local_data = [];
    const local_metric_value_range = {};

    d.forEach(function(data_object) {
      let to_push = {
        Date: parseDate(data_object.date),
      }
      fields.forEach(function(select_value) {
        const current_value = (data_object[select_value]) ? parseInt(data_object[select_value]) : 0;
        const current_max = (local_metric_value_range[select_value]) ? parseInt(local_metric_value_range[select_value]) : 0;
        if (current_value > current_max) local_metric_value_range[select_value] = current_value;
        to_push[select_value] = (data_object[select_value]) ? current_value : 0;
      });
      local_data.push(to_push);
    });

    data[file_name] = local_data;
    metric_value_range[file_name] = local_metric_value_range;
    lines1[file_name] = {};
    lines2[file_name] = {};
  });
}



function getFileObject(file_name) {
  return files.find((file_object) => file_object.name == file_name);
}

function add_line(file_name, metric) {
  

  // setting up the graph if it has not been set
  if (!document.getElementById("x-axis")) {
    setUpGraph();
  } 

  rescale_graph();

  // const local_data = data[file_name];

  // // now check if x-axis or y-axis needs rescaling 
  // const local_y_max = metric_value_range[file_name][metric];
  // const x_axis_range = getXAxisRange();
  // const current_x_axis = x.domain();

  // console.log(x_axis_range);
  // console.log(current_x_axis);
  // console.log(moment(x_axis_range[0]).isSame(current_x_axis[0]));

  // const y_axis_rescale_needed = (local_y_max > global_y_max);
  // const x_axis_rescale_needed = !(moment(x_axis_range[0]).isSame(current_x_axis[0]) && moment(x_axis_range[1]).isSame(current_x_axis[1]));

  // if (x_axis_rescale_needed || y_axis_rescale_needed) {
  //   console.log("rescale graph");
  //   if (y_axis_rescale_needed) global_y_max = local_y_max;
  //   rescale_graph();
  // } else {
  //   console.log("don't rescale graph");
  //   line = d3.line().x(function (d) { return x(d.Date); }).y(function (d) { return y(d[metric]); });
  //   line2 = d3.line().x(function (d) { return x2(d.Date); }).y(function (d) { return y2(d[metric]); });
  //   Line_chart.append("path")
  //       .datum(data[file_name])
  //       .attr("class", "line")
  //       .attr("id", `linechart_${file_name}_${metric}_main`)
  //       .style("stroke", colorScale(getColorIndex(file_name, metric)))
  //       .attr("d", line);
  //   context.append("path")
  //       .datum(data[file_name])
  //       .attr("class", "line")
  //       .attr("id", `context_${file_name}_${metric}_main`)
  //       .style("stroke", colorScale(getColorIndex(file_name, metric)))
  //       .attr("d", line2);
  //   lines1[file_name][metric] = line;
  //   lines2[file_name][metric] = line2;
  // }

}

function line_count() {
  let line_count = 0;
  for (let selected_file in all_selected_metrics) {
    const array_selected_metrics = all_selected_metrics[selected_file];
    line_count += array_selected_metrics.length;
  }
  return line_count;
}

function append_line(file_name, metric) {
  console.log(`appending line for ${file_name} and the metric is ${metric}`);
  const local_y_max = metric_value_range[file_name][metric];
  if (local_y_max > global_y_max) {
    global_y_max = local_y_max;
    rescale_y_axis(global_y_max);
  }

  line = d3.line()
      .x(function (d) { return x(d.Date); })
      .y(function (d) { return y(d[metric]); });
  line2 = d3.line()
      .x(function (d) { return x2(d.Date); })
      .y(function (d) { return y2(d[metric]); });
  Line_chart.append("path")
      .datum(data[file_name])
      .attr("class", "line")
      .attr("d", line);
  context.append("path")
      .datum(data[file_name])
      .attr("class", "line")
      .attr("d", line2);
}

function rescale_y_axis(y_max) {
  y.domain([0, y_max]);
  y2.domain(y.domain());
  focus.select("#y-axis").transition().duration(500).call(yAxis);
  //focus.select(".axis, .axis--y").transition().call(yAxis);
  // context.select(".axis, .axis--y").transition().call(yAxis);
  //yAxis.scale(y);
}

function rescale_x_axis() {
  let date_collection = [];
  for (var data_file in data) {
    date_collection = date_collection.concat(d3.extent(data[data_file], function(d) { return d.Date; }));
  }

  x.domain(d3.extent(date_collection));
}

function getXAxisRange() {
  let date_collection = [];
  for (var data_file in data) {
    date_collection = date_collection.concat(d3.extent(data[data_file], function(d) { return d.Date; }));
  }
  return d3.extent(date_collection);
}

function getYAxisRange() {
  let local_y_max = 0;
  for (var file_name in all_selected_metrics) {
    console.log(all_selected_metrics);
    if (all_selected_metrics[file_name]) {
      all_selected_metrics[file_name].forEach((metric) => {
        if (metric_value_range[file_name][metric] > local_y_max) {
          local_y_max = metric_value_range[file_name][metric];
        }
      });
    }
  }
  return [0, local_y_max]
}

function setUpGraph() {

  x.domain(getXAxisRange());
  //y.domain([0, d3.max(local_data, function (d) { return d[select_value]; })]);
  x2.domain(x.domain());
  //y2.domain(y.domain());


  focus.append("g")
      .attr("class", "axis axis--x")
      .attr("id", "x-axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  focus.append("g")
      .attr("class", "axis axis--y")
      .attr("id", "y-axis")
      .call(yAxis);

  // Line_chart.append("path")
  //     .datum(local_data)
  //     .attr("class", "line")
  //     .attr("d", line);

  // context.append("path")
  //     .datum(local_data)
  //     .attr("class", "line")
  //     .attr("d", line2);

  context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

  context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

  svg.append("rect")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoom);
}

function remove_line(metric, file_name) {
  rescale_graph();
  // if(document.getElementById(`linechart_${metric}_main`)) document.getElementById(`linechart_${metric}_main`).remove();
  // if(document.getElementById(`context_${metric}_main`)) document.getElementById(`context_${metric}_main`).remove();
}

function rescale_graph() {

  // remove both the axes
  if (document.getElementById(`x-axis`)) document.getElementById(`x-axis`).remove();
  if (document.getElementById(`y-axis`)) document.getElementById(`y-axis`).remove();

  d3.selectAll('.line').remove();
  x.domain(getXAxisRange());
  x2.domain(x.domain())
  focus.append("g")
    .attr("class", "axis axis--x")
    .attr("id", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
  
  y.domain(getYAxisRange());
  y2.domain(y.domain());
  focus.append("g")
    .attr("class", "axis axis--y")
    .attr("id", "y-axis")
    .call(yAxis);

  for (var selection in all_selected_metrics) {
    //console.log(selection);
    const current_selection = all_selected_metrics[selection];
    //console.log(current_selection);
    // current_selection.forEach((metric) => {
    //   if(document.getElementById(`linechart_${metric}_main`)) remove_line(metric, selection)
    // });
    if (current_selection) {
      current_selection.forEach((metric) => {
        //console.log("trying for metirc");
        //console.log(selection);
        line = d3.line().x(function (d) { return x(d.Date); }).y(function (d) { return y(d[metric]); });
        line2 = d3.line().x(function (d) { return x2(d.Date); }).y(function (d) { return y2(d[metric]); });
        Line_chart.append("path")
            .datum(data[selection])
            .attr("class", "line")
            .attr("id", `linechart_${metric}_main`)
            .style("stroke", colorScale(getColorIndex(selection, metric)))
            .attr("d", line);
        context.append("path")
            .datum(data[selection])
            .attr("class", "line")
            .attr("id", `context_${metric}_main`)
            .style("stroke", colorScale(getColorIndex(selection, metric)))
            .attr("d", line2);
        lines1[selection][metric] = line;
        lines2[selection][metric] = line2;
      });
    }
  }

}

var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

var zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);
    
function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
  d3.selectAll(".line").remove();
  //Line_chart.select(".line").attr("d", line);
  for (var file in all_selected_metrics) {
    const selected_metrics = all_selected_metrics[file];
    selected_metrics.forEach((metric) => {
      //console.log(metric);
      const id = `#linechart_${metric}_main`;
      //console.log(id);
      const line = lines1[file][metric];
      //console.log(line);
      Line_chart.append("path")
          .datum(data[file])
          .attr("class", "line")
          .attr("id", `linechart_${metric}_main`)
          .style("stroke", colorScale(getColorIndex(file, metric)))
          .attr("d", line);
    });
  }
  focus.select(".axis--x").call(xAxis);
  svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
      .scale(width / (s[1] - s[0]))
      .translate(-s[0], 0));
}

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(x2).domain());
  //console.log(all_selected_metrics);
  //console.log(lines1);

  // for (var file in lines1) {
  //   const metrics = lines1[file];
  //   for (var metric in metrics) {
  //     const cur_id = `#linechart_${file}_${metric}_main`;
  //     const cur_line = lines1[file][metric];
  //     Line_chart.select(cur_id).attr("d", cur_line);
  //   }
  // }
  // console.log(Line_chart.select("#linechart_gpfs_f_llseek_main"));
  // console.log(Line_chart.select(".line"));
  // console.log(Line_chart.selectAll('.line'));

  // line_array.forEach((line_main) => {
  //   const id="linechart_t1.gz_gpfs_f_llseek_main";
  //   Line_chart.select(".line").attr("d", line_main);
  // });

  // const id_array = ["#linechart_gpfs_i_lookup_main", "#linechart_gpfs_f_llseek_main"]
  // Line_chart.select(id_array[1]).attr("d", line_array[0]);
  // Line_chart.select(id_array[0]).attr("d", line_array[1]);
  //Line_chart.select('.line').attr("d", line_array[1]);

  d3.selectAll(".line").remove();
  //Line_chart.select(".line").attr("d", line);
  for (var file in all_selected_metrics) {
    const selected_metrics = all_selected_metrics[file];
    selected_metrics.forEach((metric) => {
      //console.log(metric);
      const id = `#linechart_${metric}_main`;
      //console.log(id);
      const line = lines1[file][metric];
      const line2 = lines2[file][metric];
      //console.log(line);
      //console.log(line);
      Line_chart.append("path")
          .datum(data[file])
          .attr("class", "line")
          .attr("id", `linechart_${metric}_main`)
          .style("stroke", colorScale(getColorIndex(file, metric)))
          .attr("d", line);
      context.append("path")
          .datum(data[file])
          .attr("class", "line")
          .attr("id", `context_${metric}_main`)
          .style("stroke", colorScale(getColorIndex(file, metric)))
          .attr("d", line2);
    });
  }
  focus.select(".axis--x").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

function getTotalMetrics() {
  let total_metrics = 0;
  files.forEach((file) => {
    total_metrics += file.fields.length;
  });
  return total_metrics;
}

function getColorIndex(file_name, metric) {
  let index = 0;

  for (var file_index in files) {
    let file = files[file_index];
    if (file.name == file_name) {
      index = index + file.fields.indexOf(metric);
      break;
    } else {
      index = index + file.fields.length - 1;
    }
  };

  return index;
}