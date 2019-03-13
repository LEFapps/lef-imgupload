import React, { Component } from 'react'
import {
  Button,
  FormGroup,
  CustomInput,
  FormText,
  Progress,
  Alert
} from 'reactstrap'
import PropTypes from 'prop-types'
import { Slingshot } from 'meteor/edgee:slingshot'
import { last, cloneDeep, sortBy } from 'lodash'

import ImageTools from './imageTools'
import './Settings'

const initState = {
  localImage: null,
  thumbsProcessed: false,
  image: null,
  name: '',
  uploaded: false,
  thumbnails: [],
  thumbsUploaded: [],
  started: false,
  progress: null,
  done: null,
  error: undefined
}

const generateThumbnail = (image, size, callback) => {
  ImageTools.resize(
    image,
    {
      width: size, // maximum width
      height: size // maximum height
    },
    callback
  )
}

const uploader = new Slingshot.Upload('imageUpload')
const fileUploader = new Slingshot.Upload('fileUpload')

class ImageUpload extends Component {
  constructor (props) {
    super(props)
    this.state = cloneDeep(initState)
    this.onChange = this.onChange.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.uploader = props.fileUploader ? fileUploader : uploader
  }
  updateProgress () {
    setInterval(() => {
      if (this.state.started) {
        this.setState({
          progress: this.uploader.progress() * 100,
          done: this.uploader.progress() >= 1
        })
      }
    }, 16)
  }
  onChange (e) {
    this.setState(cloneDeep(initState))
    if (e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0])
      this.setState({
        localImage: url,
        image: e.target.files[0],
        name: e.target.files[0].name
      })
      if (this.props.sizes && this.props.sizes.length) {
        this.props.sizes.forEach(size => this.addThumb(e.target.files[0], size))
      } else this.setState({ thumbsProcessed: true })
    }
  }
  addThumb (image, size) {
    generateThumbnail(image, size, (file, success, failure) => {
      this.setState(prevState => {
        const key = this.props.sizes.indexOf(size)
        const thumbnails = prevState.thumbnails
        thumbnails[key] = success ? file : false
        const thumbsProcessed = thumbnails.length == this.props.sizes.length
        return { thumbnails: thumbnails, thumbsProcessed: thumbsProcessed }
      })
    })
  }
  handleUpload (e) {
    this.state.started = true
    this.updateProgress()

    this.uploader.send(this.state.image, (error, url) => {
      if (error) {
        this.setState({ error: error.message })
        console.error(error)
      } else this.setState({ uploaded: url })

      this.uploadThumb(0)
    })
  }
  uploadThumb (index) {
    const image = this.state.thumbnails[index]
    const size = this.props.sizes[index]
    if (typeof image === 'undefined') this.finishUpload()
    else {
      if (image) {
        this.uploader.send(image, (error, url) => {
          if (error) {
            console.error(`Thumbnail ${size} could not be uploaded`, error)
          }
          const thumb = {
            size: size,
            url: url
          }
          this.setState(prevState => {
            thumbsUploaded: prevState.thumbsUploaded.push(thumb)
          })
          this.uploadThumb(++index)
        })
      } else {
        const thumb = {
          size: size,
          url: this.state.uploaded
        }
        this.setState(prevState => {
          thumbsUploaded: prevState.thumbsUploaded.push(thumb)
        })
        this.uploadThumb(++index)
      }
    }
  }
  finishUpload () {
    if (!this.state.error) {
      const url = this.state.uploaded
      const thumbnails = this.state.thumbsUploaded
      if (url && thumbnails.length == this.props.sizes.length) {
        this.setState(cloneDeep(initState))
        this.props.onSubmit(url, sortBy(thumbnails, 'size'))
      }
    }
  }
  render () {
    return (
      <div id={'imgUpload'}>
        <FormGroup>
          <CustomInput
            type={'file'}
            id={this.props.key || 'imageUploadFile'}
            name={this.props.name || 'file'}
            label={this.props.placeholder || this.props.label || undefined}
            onChange={this.onChange}
            invalid={this.props.invalid}
          />
          <FormText color='muted' className={'localImage'}>
            <figure>
              {this.state.localImage ? (
                <img src={this.state.localImage} className={'img-fluid'} />
              ) : null}
              <figcaption>{this.state.name}</figcaption>
            </figure>
            {this.state.progress ? (
              <div id={'progressContainer'}>
                <div className='text-center'>
                  {Math.round(this.state.progress)} %
                </div>
                <Progress
                  value={this.state.progress}
                  color={this.state.done ? 'success' : 'primary'}
                />
              </div>
            ) : null}
          </FormText>
        </FormGroup>
        {this.state.error ? (
          <Alert color='danger'>{this.state.error}</Alert>
        ) : null}
        <Button
          onClick={this.handleUpload}
          disabled={!(this.state.localImage && this.state.thumbsProcessed)}
        >
          {this.state.localImage && !this.state.thumbsProcessed
            ? 'Verwerken…'
            : this.props.submitText || 'Upload'}
        </Button>
      </div>
    )
  }
}
/*
 * Converts the uploaded url to a Markdown formatted string.
 */
class MarkdownImageUpload extends Component {
  constructor (props) {
    super(props)
    this.convertToMd = this.convertToMd.bind(this)
  }
  convertToMd (url, thumbs) {
    const { sizes } = this.props
    filename = last(url.split('/'))
    if (sizes && thumbs) {
      let result = false
      while (!result && sizes.length) {
        const size = sizes.pop()
        result = thumbs.find(t => t.size === size)
      }
      if (result) this.props.onSubmit(`\n![${filename}](${result.url})`)
    } else this.props.onSubmit(`\n![${filename}](${url})`)
  }
  render () {
    return <ImageUpload {...this.props} onSubmit={this.convertToMd} />
  }
}

ImageUpload.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  sizes: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  fileUploader: PropTypes.bool
}

ImageUpload.defaultProps = {
  sizes: []
}

export default ImageUpload
export { MarkdownImageUpload }
