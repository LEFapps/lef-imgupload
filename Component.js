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
import { last, cloneDeep, sortBy, isInteger } from 'lodash'

import ImageTools from './tools/scale'
import { safeName } from './tools/name'
import './Settings'

const initState = {
  localImage: null,
  thumbsProcessed: false,
  image: null,
  name: '',
  uploaded: false,
  thumbnails: [],
  thumbsUploaded: 0,
  started: false,
  progress: null,
  done: null,
  error: undefined
}

const retina = ({ label, width, height, crop = false, quality = 0.5 }) => ({
  label: label + '@2x',
  width: width * 2,
  height: height * 2,
  quality: quality * 0.8,
  crop
})

const generateThumbnail = (image, filename, modifier, callback) => {
  if (typeof modifier === 'function') {
    // original
    callback = modifier
    modifier = {
      label: 'original',
      crop: false,
      quality: 1
    }
  } else if (isInteger(modifier)) {
    // deprecated
    modifier = {
      label: `thumb-${modifier}`,
      width: modifier,
      height: modifier,
      crop: false,
      quality: 0.6
    }
  }
  ImageTools.resize(image, filename, modifier, callback)
}

const uploader = new Slingshot.Upload('imageUpload')
const fileUploader = new Slingshot.Upload('fileUpload')

class ImageUpload extends Component {
  constructor (props) {
    super(props)
    this.state = cloneDeep(initState)
    this.progressor = false
    this.addImage = this.addImage.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.uploader = props.fileUploader ? fileUploader : uploader
  }

  updateProgress () {
    this.progressor = setInterval(() => {
      const { started, thumbnails, thumbsUploaded, uploaded } = this.state
      const progress =
        (this.uploader.progress() / (thumbnails.length + 1) +
          (thumbsUploaded + (uploaded ? 1 : 0)) / (thumbnails.length + 1)) *
        100
      // console.log(
      //   this.uploader.progress(),
      //   thumbnails.length + 1,
      //   thumbsUploaded,
      //   uploaded,
      //   progress
      // )
      if (started) {
        this.setState(
          {
            progress,
            done:
              this.uploader.progress() >= 1 &&
              thumbsUploaded >= thumbnails.length
          },
          () => {
            if (this.state.done) {
              clearInterval(this.progressor)
              this.setState(cloneDeep(initState))
            }
          }
        )
      }
    }, 16)
  }

  addImage ({ target }) {
    if (!target) {
      this.setState(cloneDeep(initState))
      return false
    }
    this.setState(cloneDeep(initState), () => {
      const file = target.files[0]
      if (file) {
        const name = safeName(file.name)
        this.setState({ name }, () => {
          const localImage = URL.createObjectURL(target.files[0])
          generateThumbnail(file, name, (image, success, failure) => {
            this.setState({ localImage, image }, () => {
              if (this.props.sizes && this.props.sizes.length) {
                this.props.sizes.forEach(size =>
                  this.addThumb(target.files[0], size)
                )
              } else this.setState({ thumbsProcessed: true })
            })
          })
        })
      }
    })
  }

  addThumb (image, size) {
    const { name } = this.state
    const callback = retinised => {
      return (file, success, failure) => {
        this.setState(prevState => {
          const key =
            this.props.sizes.map(({ label }) => label).indexOf(size.label) +
            (retinised ? this.props.sizes.length : 0)
          const thumbnails = prevState.thumbnails
          thumbnails[key] = success ? file : false
          const thumbsProcessed =
            thumbnails.length === this.props.sizes.length * 2
          return { thumbnails, thumbsProcessed }
        })
      }
    }
    generateThumbnail(image, name, size, callback(false))
    generateThumbnail(image, name, retina(size), callback(true))
  }

  handleUpload (e) {
    this.state.started = true
    this.updateProgress()
    this.uploader.send(this.state.image, error => {
      if (error) {
        console.error(error)
        this.setState({ error: error.message })
      } else {
        this.setState({ uploaded: true }, () => {
          this.props.onSubmit(this.state.name)
          this.uploadThumb()
        })
      }
    })
  }

  uploadThumb () {
    const { thumbsUploaded } = this.state
    const image = this.state.thumbnails[thumbsUploaded]
    let size = this.props.sizes[thumbsUploaded]
    const callback = () =>
      this.setState({ thumbsUploaded: thumbsUploaded + 1 }, () =>
        this.uploadThumb()
      )
    if (typeof image === 'undefined') this.finishUpload()
    else {
      if (image) {
        this.uploader.send(image, error => {
          if (!size) {
            size = this.props.sizes[thumbsUploaded - this.props.sizes.length]
          }
          if (error) {
            console.error(
              `Thumbnail “${size.label}” could not be uploaded`,
              error
            )
          }
          callback()
        })
      } else callback()
    }
  }

  finishUpload () {
    if (!this.state.error) {
      if (
        this.state.name &&
        this.state.thumbsUploaded === this.props.sizes.length * 2
      ) {
        this.props.onSubmit(this.state.name)
      }
    }
  }

  render () {
    return (
      <div id={'imgUpload'}>
        <FormGroup>
          <CustomInput
            type={'file'}
            id={this.props.id || 'imageUploadFile'}
            name={this.props.name || 'file'}
            label={this.props.placeholder || this.props.label || undefined}
            onChange={this.addImage}
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
  sizes: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
      crop: PropTypes.bool,
      quality: PropTypes.number
    })
  ),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  fileUploader: PropTypes.bool
}

ImageUpload.defaultProps = {
  sizes: []
}

export default ImageUpload
export { MarkdownImageUpload }
