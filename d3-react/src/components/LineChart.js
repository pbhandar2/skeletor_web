import * as d3 from "d3";
import React, { Component } from 'react'
import "../App.css";

class LineChart extends Component {

  constructor(props){
    super(props);

    this.state = {
      xy : [],
      metric : this.props.metric
    }

    // need to bind local methods to component
    this.parseTime = this.parseTime.bind(this);
    this.drawChart = this.drawChart.bind(this);

  }

  parseTime(date){
    return d3.timeParse("%Y-%m-%d-%H-%M-%S")(date);
  }

  // redraws chart upon mounting and upon updating
  // this can be further decomposed
  drawChart(){

    document.getElementById('canvas').innerHTML = "";
    document.getElementById('label').innerHTML = this.props.metric;

    var margin = {top: 20, right: 100, bottom: 30, left: 100},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var xy = [];

    // need to alias "this" keyword when entering a block
    var self = this;

    d3.csv("final.csv", function(data){
      return data
    }).then(function(rows){
      console.log(self.props.metric);
      rows.forEach(function(row){
        xy.push({
          x: self.parseTime(row.date),
          y:      parseFloat(row[self.props.metric])
        });
      });

      // self.setState({
      //   xy: xy
      // }, ()=>{
      //   console.log(self.state.xy);
      // });

    var xScale = d3.scaleTime()
        .domain(d3.extent(xy, function(d) { return d.x; }))
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(xy, function(d){ return d.y; })])
        .range([height, 0]);

    var valueline = d3.line()
                      .x(function(d) {return xScale(d.x); })
                      .y(function(d) {return yScale(d.y); })


    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);


    var svg = d3.select("#canvas")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("path")
        .data([xy])
        .attr("class", "line")
        .attr("d", valueline);
    });
  }

  // runs before component is updated
  componentWillReceiveProps(nextProps){
    if(this.props.metric !== nextProps.metric)
      this.drawChart();
  }

  // runs after component is rendered
  componentDidMount(){
    this.drawChart();
  }

  render() {
    return (
      <div>
        <div id="canvas"></div>
        <div id="label"></div>
      </div>
    )
  }
}
export default LineChart;
