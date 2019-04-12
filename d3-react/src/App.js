import React, { Component } from 'react';
import './App.css';
import LineChart from './components/LineChart.js';


class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      metrics : [
        "gpfs_f_open",
        "gpfs_f_rdwr",
        "gpfs_f_release",
        "gpfs_i_create",
        "gpfs_i_lookup",
        "gpfs_i_mkdir",
        "gpfs_s_read_inode2"
      ],
      options: [],
      selected_metric:'gpfs_f_open'
    }

    var i = 0;
    for(var m of this.state.metrics){
      this.state.options.push(<option value={m} key={i++}>{m}</option>);
    }
    this.handleSelection = this.handleSelection.bind(this);

  }

  handleSelection(e){

    this.setState({
      selected_metric: e.target.value
    });

  }

  render() {
    return (
      <div className="App">

        <select id="metric" onChange={this.handleSelection}>
          {this.state.options}
        </select>

        {/* parameters get passed through "props" */}
        <LineChart metric={this.state.selected_metric} />

      </div>
    );
  }
}

export default App;
