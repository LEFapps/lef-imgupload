import React, { Component } from "react";
import {
  Button,
  FormGroup,
  Label,
  Input,
  FormText,
  Progress,
  Alert
} from "reactstrap";
import PropTypes from "prop-types";
import { Slingshot } from "meteor/edgee:slingshot";
import { Meteor } from "meteor/meteor";
import { last } from "lodash";

import "./Settings";

const uploader = new Slingshot.Upload("imageUpload");

const initState = {
  localImage: null,
  image: null,
  progress: null,
  started: false,
  uploaded: false,
  error: undefined
};

class ImageUpload extends Component {
  constructor(props) {
    super(props);
    this.state = initState;
    this.onChange = this.onChange.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
  }
  updateProgress() {
    setInterval(() => {
      if (this.state.started) {
        this.setState({
          progress: Math.round(uploader.progress() * 100),
          uploaded: uploader.progress() == 1 ? true : false
        });
      }
    }, 200);
  }
  onChange(e) {
    this.setState({ error: undefined });
    if (e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      this.setState({ localImage: url, image: e.target.files[0] });
    }
  }
  handleUpload(e) {
    this.state.started = true;
    uploader.send(this.state.image, (error, url) => {
      if (error) {
        this.setState({ error: error.message });
        console.error(error);
      } else {
        this.setState(initState);
        this.props.onSubmit(url);
      }
    });
  }
  render() {
    return (
      <div>
        {this.state.localImage ? (
          <img src={this.state.localImage} className="img-fluid" width="50px" />
        ) : null}
        <FormGroup>
          <Label for="exampleFile">Image upload</Label>
          <Input type="file" name="file" onChange={this.onChange} />
          <FormText color="muted">{this.state.name}</FormText>
        </FormGroup>
        {this.state.progress ? (
          <div>
            <div className="text-center">{this.state.progress}%</div>
            <Progress
              value={this.state.progress}
              color={this.state.uploaded ? "success" : "primary"}
            />
          </div>
        ) : null}
        {this.state.error ? (
          <Alert color="danger">{this.state.error}</Alert>
        ) : null}
        <Button
          onClick={this.handleUpload}
          disabled={this.state.localImage ? false : true}
        >
          Upload
        </Button>
      </div>
    );
  }
}
/*
 * Converts the uploaded url to a Markdown formatted string.
 */
class MarkdownImageUpload extends Component {
  constructor(props) {
    super(props);
    this.convertToMd = this.convertToMd.bind(this);
  }
  convertToMd(url) {
    filename = last( url.split('/') );
    this.props.onSubmit(`\n![${filename}](${url})`);
  }
  render() {
    return <ImageUpload onSubmit={this.convertToMd} />
  }
}

ImageUpload.propTypes = {
  onSubmit: PropTypes.func.isRequired
};

export default ImageUpload;
export { MarkdownImageUpload };
