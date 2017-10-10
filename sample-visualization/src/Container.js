import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Card, { CardContent, CardHeader } from 'material-ui/Card';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Button from 'material-ui/Button';
import Image from './Image';
import { cntk, getBlobs, generateAzureBlobURL } from './lib';

class Container extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blobs: [],
      loadingBlobs: [], // blob names
      labels: {}, // dictionary of file URL -> label array
      maxConcurrency: 4,
      search: '',
      currentBlob: null, // blob name
      runningCNTK: false,
      searchedBlobs: [], // blob objects
    };
  }

  componentDidMount() {
    this.getBlobs().then((blobs) => {
      this.setState({
        blobs,
      });
    });
  }

  getBlobs = async () => getBlobs(this.props.name);

  runCNTK = async () => {
    this.setState(
      {
        runningCNTK: true,
      },
      () => {
        let loadingBlobs = [...this.state.loadingBlobs];
        const blobs = this.state.search ? [...this.state.searchedBlobs] : [...this.state.blobs];
        const cntkPromise = () => {
          if (blobs.length <= 0) {
            return Promise.resolve();
          }
          const blob = blobs.shift();
          loadingBlobs.push(blob.name);
          this.setState({ loadingBlobs });
          return cntk(blob.name)
            .then((blobLabels) => {
              const labels = { ...this.state.labels };
              labels[blob.name] = blobLabels;
              loadingBlobs = this.state.loadingBlobs.filter(
                loadingBlobName => loadingBlobName !== blob.name,
              );
              this.setState({ labels, loadingBlobs });
            })
            .then(() => cntkPromise())
            .catch((err) => {
              console.error(err);
              loadingBlobs = this.state.loadingBlobs.filter(
                loadingBlob => loadingBlob.name !== blob.name,
              );
              this.setState({ loadingBlobs });
            });
        };

        // Run a max of maxConcurrency
        Promise.all(
          Array(this.state.maxConcurrency)
            .fill(null)
            .map(() => cntkPromise()),
        )
          .then(() => this.setState({ runningCNTK: false }))
          .catch((err) => {
            console.error(err);
            this.setState({ runningCNTK: false });
          });
      },
    );
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

  openDialog = (blob) => {
    this.setState({
      currentBlob: blob.name,
    });
  };

  closeDialog = () => {
    this.setState({
      currentBlob: null,
    });
  };

  runSearch = (searchString) => {
    const search = new RegExp(searchString, 'i');
    const searchedBlobs = this.state.blobs.filter(blob => search.exec(blob.name));
    this.setState({ searchedBlobs, search: searchString });
  };

  render() {
    const blobs = this.state.search ? this.state.searchedBlobs : this.state.blobs;

    return (
      <div className="Container">
        <Card>
          <CardHeader title={this.props.name} subheader={this.props.lastModified} />
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Filename</TableCell>
                  <TableCell numeric>Size (Bytes)</TableCell>
                  <TableCell numeric>Operations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blobs.map(blob => (
                  <TableRow key={blob.name}>
                    <TableCell>{blob.name}</TableCell>
                    <TableCell numeric>{blob.contentLength}</TableCell>
                    <TableCell>
                      <Button onClick={() => this.openDialog(blob)}>View</Button>
                      {this.state.currentBlob === blob.name ? (
                        <Image
                          url={generateAzureBlobURL(this.props.name, blob.name)}
                          filename={blob.name}
                          labels={this.state.labels[blob.name] || []}
                          onClose={() => {
                            this.setState({ currentBlob: null });
                          }}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }
}

Container.propTypes = {
  name: PropTypes.string.isRequired,
  lastModified: PropTypes.string,
};

Container.defaultProps = {
  lastModified: '',
};

export default Container;
