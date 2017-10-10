import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Button from 'material-ui/Button';
import Dialog, { DialogActions, DialogContent, DialogTitle } from 'material-ui/Dialog';
import Slide from 'material-ui/transitions/Slide';
import { LinearProgress } from 'material-ui/Progress';
import Tooltip from 'material-ui/Tooltip';
import { cntk, tensorflow } from './lib';
import './Image.css';

class Image extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: true,
      labels: props.labels,
      url: props.url,
      isLoading: false,
      errorOccured: false,
    };
  }

  componentDidMount() {
    this.updateCanvas();
  }

  componentDidUpdate() {
    this.updateCanvas();
  }

  handleRequestClose = () => {
    this.setState({ open: false }, () => {
      this.props.onClose();
    });
  };

  handleOpen = () => {
    this.setState({ open: true });
  };

  downloadJson = () => {
    // Blob string to download
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(this.state.labels),
    )}`;

    // Create fake download element and click
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'labels.json');
    dlAnchorElem.click();
    dlAnchorElem.remove();
  };

  downloadImage = () => {
    this.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);

      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute('href', url);
      dlAnchorElem.setAttribute('download', this.props.filename);
      dlAnchorElem.click();
      dlAnchorElem.remove();
    });
  };

  runCNTK = async () => {
    try {
      this.setState({ isLoading: true }, async () => {
        const labels = await cntk(this.props.filename);
        this.setState(
          {
            isLoading: false,
            labels: [...this.state.labels, ...labels],
          },
          () => {
            this.updateCanvas();
          },
        );
      });
    } catch (err) {
      this.setState({
        errorOccured: true,
      });
      console.error(err);
    }
  };

  runTensorFlow = async () => {
    this.setState({ isLoading: true }, async () => {
      try {
        const labels = await tensorflow(this.props.url);
        this.setState(
          {
            isLoading: false,
            labels: [...this.state.labels, ...labels],
          },
          () => {
            this.updateCanvas();
          },
        );
      } catch (err) {
        this.setState({
          errorOccured: true,
        });
        console.error(err);
      }
    });
  };

  updateCanvas = () => {
    const image = document.createElement('img');
    image.setAttribute('crossOrigin', 'Anonymous');
    image.onload = () => {
      if (this.canvas) {
        const canvasWidth = 850;
        const scale = canvasWidth / image.width;
        const canvasHeight = image.height * scale;
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        const ctx = this.canvas.getContext('2d');

        // render image on convas and draw the square labels
        ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
        ctx.lineWidth = 5;
        this.state.labels.forEach((label) => {
          ctx.strokeStyle = label.color || 'black';
          ctx.strokeRect(label.x, label.y, label.width, label.height);
        });
      }
    };
    image.src = this.state.url;
  };

  render() {
    return (
      <div className="Image" style={{ display: 'inline-flex' }}>
        <Dialog
          fullScreen
          open={this.state.open}
          onRequestClose={this.handleRequestClose}
          transition={<Slide direction="up" />}
        >
          <DialogTitle>
            <a href={this.props.url}>{this.props.url}</a>
          </DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
              <Table style={{ width: document.documentElement.clientWidth - 950 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell numeric>Box</TableCell>
                    <TableCell numeric>Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {this.state.labels.length > 0 ? (
                    this.state.labels.map(label => (
                      <TableRow key={JSON.stringify(label)}>
                        <TableCell>{label.text}</TableCell>
                        <TableCell>
                          [{label.x}, {label.y}, {label.width}, {label.height}]
                        </TableCell>
                        <TableCell numeric>{label.score}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell>
                        {this.state.isLoading ? (
                          <LinearProgress mode="indeterminate" />
                        ) : (
                          'Label data unavailable or not yet loaded'
                        )}
                      </TableCell>
                      <TableCell numeric>---</TableCell>
                      <TableCell numeric>---</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <canvas
                style={{ width: '850px', height: '850px' }}
                ref={(ref) => {
                  this.canvas = ref;
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.runCNTK()}>CNTK</Button>
            <Button onClick={() => this.runTensorFlow()}>TensorFlow</Button>
            <Button onClick={() => this.downloadJson()}>Download JSON</Button>
            <Tooltip label="Download current image (including labels)" placement="top">
              <Button onClick={() => this.downloadImage()}>Download Image</Button>
            </Tooltip>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

Image.propTypes = {
  url: PropTypes.string.isRequired,
  filename: PropTypes.string.isRequired,
  labels: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
      text: PropTypes.string.isRequired,
      score: PropTypes.number.isRequired,
      color: PropTypes.string,
    }),
  ),
  onClose: PropTypes.func,
};

Image.defaultProps = {
  labels: [],
  onClose: () => {},
};

export default Image;
