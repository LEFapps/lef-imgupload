import React, { Component } from "react";
import {
  Button,
  FormGroup,
  Label,
  Input,
  FormText,
  Progress,
  Alert,
} from "reactstrap";
import PropTypes from "prop-types";
import { Slingshot } from "meteor/edgee:slingshot";
import { Meteor } from "meteor/meteor";
import { last } from "lodash";

import ImageTools from "./imageTools";
import "./Settings";

const uploader = new Slingshot.Upload("imageUpload");

const initState = {
  localImage: null,
  image: null,
  thumbnails: [],
  thumbsProcessed: false,
  progress: null,
  started: false,
  uploaded: false,
  error: undefined,
};

generateThumbnail = (image, size, callback) => {
  ImageTools.resize(
    image,
    {
      width: size, // maximum width
      height: size, // maximum height
    },
    callback,
  );
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
          uploaded: uploader.progress() == 1 ? true : false,
        });
      }
    }, 200);
  }
  onChange(e) {
    this.setState({ error: undefined });
    if (e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      this.setState({ localImage: url, image: e.target.files[0] });
      if (this.props.sizes)
        this.props.sizes.forEach(size =>
          this.addThumb(e.target.files[0], size),
        );
      else this.setState({ thumbsProcessed: true });
    }
  }
  handleUpload(e) {
    this.state.started = true;
    this.state.thumbnails.forEach(
      (thumbnail, sizeIndex) =>
        thumbnail
          ? uploader.send(thumbnail, (error, url) => {
              console.log(thumbnail, this.props.sizes[sizeIndex]);
              if (error)
                console.error("Thumbnail could not be uploaded", error);
              else this.props.onSubmit(url, this.props.sizes[sizeIndex]);
            })
          : false,
    );
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
  addThumb(image, size) {
    generateThumbnail(image, size, (file, success, failure) => {
      this.setState(prevState => {
        const key = this.props.sizes.indexOf(size);
        const thumbnails = prevState.thumbnails;
        thumbnails[key] = success ? file : false;
        const thumbsProcessed = thumbnails.length == this.props.sizes.length;
        return { thumbnails: thumbnails, thumbsProcessed: thumbsProcessed };
      });
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
          disabled={
            this.state.localImage && this.state.thumbsProcessed ? false : true
          }
        >
          {this.state.localImage && !this.state.thumbsProcessed
            ? "Processing…"
            : this.props.submitText || "Upload"}
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
    filename = last(url.split("/"));
    this.props.onSubmit(`\n![${filename}](${url})`);
  }
  render() {
    return <ImageUpload onSubmit={this.convertToMd} />;
  }
}

ImageUpload.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  sizes: PropTypes.array,
};

export default ImageUpload;
export { MarkdownImageUpload };
