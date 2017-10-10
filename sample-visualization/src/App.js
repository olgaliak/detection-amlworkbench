import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Drawer from './Drawer';
import { getContainers } from './lib';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      containers: [],
    };
    this.state = { ...props };
  }

  componentDidMount() {
    getContainers().then((containers) => {
      this.setState({ containers });
    });
  }

  render() {
    return (
      <Router>
        <Drawer containers={this.state.containers} />
      </Router>
    );
  }
}

export default App;
