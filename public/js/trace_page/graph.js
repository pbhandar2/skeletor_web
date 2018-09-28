// data is a dict which holds the data for each file that is loaded where the 
// key is the name of the file 
let data = {}; 

//const colorScale = d3.scaleSequential(d3.interpolateWarm).domain([0, 20]);
let colors = generateRandomColors(getTotalMetrics());
function colorScale(i) {
  return colors[i];
}

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
function loadData(id, file_name, metric) {
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
    add_line(file_name, metric);
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
  //console.log(`appending line for ${file_name} and the metric is ${metric}`);
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
    //console.log(all_selected_metrics);
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
        //console.log(document.getElementById(`${selection}-${metric}`));
        //document.getElementById(`${selection}-${metric}`).style.color= colorScale(getColorIndex(selection, metric));
        document.getElementById(`${selection}-${metric}`).style.backgroundColor= colorScale(getColorIndex(selection, metric));
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



function generateRandomColors(number){
/*
This generates colors using the following algorithm:
Each time you create a color:
  Create a random, but attractive, color{
    Red, Green, and Blue are set to random luminosity.
    One random value is reduced significantly to prevent grayscale.
    Another is increased by a random amount up to 100%.
    They are mapped to a random total luminosity in a medium-high range (bright but not white).
  }
  Check for similarity to other colors{
    Check if the colors are very close together in value.
    Check if the colors are of similar hue and saturation.
    Check if the colors are of similar luminosity.
    If the random color is too similar to another,
    and there is still a good opportunity to change it:
      Change the hue of the random color and try again.
  }
  Output array of all colors generated
*/
  //if we've passed preloaded colors and they're in hex format
  if(typeof(arguments[1])!='undefined'&&arguments[1].constructor==Array&&arguments[1][0]&&arguments[1][0].constructor!=Array){
    for(var i=0;i<arguments[1].length;i++){ //for all the passed colors
      var vals = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(arguments[1][i]); //get RGB values
      arguments[1][i]=[parseInt(vals[1], 16),parseInt(vals[2], 16),parseInt(vals[3], 16)]; //and convert them to base 10
    }
  }
  var loadedColors=typeof(arguments[1])=='undefined'?[]:arguments[1],//predefine colors in the set
    number=number+loadedColors.length,//reset number to include the colors already passed
    lastLoadedReduction=Math.floor(Math.random()*3),//set a random value to be the first to decrease
    rgbToHSL=function(rgb){//converts [r,g,b] into [h,s,l]
      var r=rgb[0],g=rgb[1],b=rgb[2],cMax=Math.max(r,g,b),cMin=Math.min(r,g,b),delta=cMax-cMin,l=(cMax+cMin)/2,h=0,s=0;if(delta==0)h=0;else if(cMax==r)h=60*((g-b)/delta%6);else if(cMax==g)h=60*((b-r)/delta+2);else h=60*((r-g)/delta+4);if(delta==0)s=0;else s=delta/(1-Math.abs(2*l-1));return[h,s,l]
    },hslToRGB=function(hsl){//converts [h,s,l] into [r,g,b]
      var h=hsl[0],s=hsl[1],l=hsl[2],c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2,r,g,b;if(h<60){r=c;g=x;b=0}else if(h<120){r=x;g=c;b=0}else if(h<180){r=0;g=c;b=x}else if(h<240){r=0;g=x;b=c}else if(h<300){r=x;g=0;b=c}else{r=c;g=0;b=x}return[r,g,b]
    },shiftHue=function(rgb,degree){//shifts [r,g,b] by a number of degrees
      var hsl=rgbToHSL(rgb); //convert to hue/saturation/luminosity to modify hue
      hsl[0]+=degree; //increment the hue
      if(hsl[0]>360){ //if it's too high
        hsl[0]-=360 //decrease it mod 360
      }else if(hsl[0]<0){ //if it's too low
        hsl[0]+=360 //increase it mod 360
      }
      return hslToRGB(hsl); //convert back to rgb
    },differenceRecursions={//stores recursion data, so if all else fails we can use one of the hues already generated
      differences:[],//used to calculate the most distant hue
      values:[]//used to store the actual colors
    },fixDifference=function(color){//recursively asserts that the current color is distinctive
      if(differenceRecursions.values.length>23){//first, check if this is the 25th recursion or higher. (can we try any more unique hues?)
        //if so, get the biggest value in differences that we have and its corresponding value
        var ret=differenceRecursions.values[differenceRecursions.differences.indexOf(Math.max.apply(null,differenceRecursions.differences))];
        differenceRecursions={differences:[],values:[]}; //then reset the recursions array, because we're done now
        return ret; //and then return up the recursion chain
      } //okay, so we still have some hues to try.
      var differences=[]; //an array of the "difference" numbers we're going to generate.
      for(var i=0;i<loadedColors.length;i++){ //for all the colors we've generated so far
        var difference=loadedColors[i].map(function(value,index){ //for each value (red,green,blue)
          return Math.abs(value-color[index]) //replace it with the difference in that value between the two colors
        }),sumFunction=function(sum,value){ //function for adding up arrays
          return sum+value
        },sumDifference=difference.reduce(sumFunction), //add up the difference array
        loadedColorLuminosity=loadedColors[i].reduce(sumFunction), //get the total luminosity of the already generated color
        currentColorLuminosity=color.reduce(sumFunction), //get the total luminosity of the current color
        lumDifference=Math.abs(loadedColorLuminosity-currentColorLuminosity), //get the difference in luminosity between the two
        //how close are these two colors to being the same luminosity and saturation?
        differenceRange=Math.max.apply(null,difference)-Math.min.apply(null,difference),
        luminosityFactor=50, //how much difference in luminosity the human eye should be able to detect easily
        rangeFactor=75; //how much difference in luminosity and saturation the human eye should be able to dect easily
        if(luminosityFactor/(lumDifference+1)*rangeFactor/(differenceRange+1)>1){ //if there's a problem with range or luminosity
          //set the biggest difference for these colors to be whatever is most significant
          differences.push(Math.min(differenceRange+lumDifference,sumDifference));
        }
        differences.push(sumDifference); //otherwise output the raw difference in RGB values
      }
      var breakdownAt=64, //if you're generating this many colors or more, don't try so hard to make unique hues, because you might fail.
      breakdownFactor=25, //how much should additional colors decrease the acceptable difference
      shiftByDegrees=15, //how many degrees of hue should we iterate through if this fails
      acceptableDifference=250, //how much difference is unacceptable between colors
      breakVal=loadedColors.length/number*(number-breakdownAt), //break down progressively (if it's the second color, you can still make it a unique hue)
      totalDifference=Math.min.apply(null,differences); //get the color closest to the current color
      if(totalDifference>acceptableDifference-(breakVal<0?0:breakVal)*breakdownFactor){ //if the current color is acceptable
        differenceRecursions={differences:[],values:[]} //reset the recursions object, because we're done
        return color; //and return that color
      } //otherwise the current color is too much like another
      //start by adding this recursion's data into the recursions object
      differenceRecursions.differences.push(totalDifference);
      differenceRecursions.values.push(color);
      color=shiftHue(color,shiftByDegrees); //then increment the color's hue
      return fixDifference(color); //and try again
    },color=function(){ //generate a random color
      var scale=function(x){ //maps [0,1] to [300,510]
        return x*210+300 //(no brighter than #ff0 or #0ff or #f0f, but still pretty bright)
      },randVal=function(){ //random value between 300 and 510
        return Math.floor(scale(Math.random()))
      },luminosity=randVal(), //random luminosity
        red=randVal(), //random color values
        green=randVal(), //these could be any random integer but we'll use the same function as for luminosity
        blue=randVal(),
        rescale, //we'll define this later
        thisColor=[red,green,blue], //an array of the random values
        /*
        #ff0 and #9e0 are not the same colors, but they are on the same range of the spectrum, namely without blue.
        Try to choose colors such that consecutive colors are on different ranges of the spectrum.
        This shouldn't always happen, but it should happen more often then not.
        Using a factor of 2.3, we'll only get the same range of spectrum 15% of the time.
        */
        valueToReduce=Math.floor(lastLoadedReduction+1+Math.random()*2.3)%3, //which value to reduce
        /*
        Because 300 and 510 are fairly close in reference to zero,
        increase one of the remaining values by some arbitrary percent betweeen 0% and 100%,
        so that our remaining two values can be somewhat different.
        */
        valueToIncrease=Math.floor(valueToIncrease+1+Math.random()*2)%3, //which value to increase (not the one we reduced)
        increaseBy=Math.random()+1; //how much to increase it by
      lastLoadedReduction=valueToReduce; //next time we make a color, try not to reduce the same one
      thisColor[valueToReduce]=Math.floor(thisColor[valueToReduce]/16); //reduce one of the values
      thisColor[valueToIncrease]=Math.ceil(thisColor[valueToIncrease]*increaseBy) //increase one of the values
      rescale=function(x){ //now, rescale the random numbers so that our output color has the luminosity we want
        return x*luminosity/thisColor.reduce(function(a,b){return a+b}) //sum red, green, and blue to get the total luminosity
      };
      thisColor=fixDifference(thisColor.map(function(a){return rescale(a)})); //fix the hue so that our color is recognizable
      if(Math.max.apply(null,thisColor)>255){ //if any values are too large
        rescale=function(x){ //rescale the numbers to legitimate hex values
          return x*255/Math.max.apply(null,thisColor)
        }
        thisColor=thisColor.map(function(a){return rescale(a)});
      }
      return thisColor;
    };
  for(var i=loadedColors.length;i<number;i++){ //Start with our predefined colors or 0, and generate the correct number of colors.
    loadedColors.push(color().map(function(value){ //for each new color
      return Math.round(value) //round RGB values to integers
    }));
  }
  //then, after you've made all your colors, convert them to hex codes and return them.
  return loadedColors.map(function(color){
    var hx=function(c){ //for each value
      var h=c.toString(16);//then convert it to a hex code
      return h.length<2?'0'+h:h//and assert that it's two digits
    }
    return "#"+hx(color[0])+hx(color[1])+hx(color[2]); //then return the hex code
  });
}