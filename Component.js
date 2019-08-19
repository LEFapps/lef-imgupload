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
import { cloneDeep, isInteger } from 'lodash'

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

const retinaSize = ({ width, height, quality = 0.6, ...size }) =>
  Object.assign(size, {
    width: width * 2,
    height: height * 2,
    quality: quality * 0.8
  })

const retinaName = name =>
  name
    .split('.')
    .map((n, i, { length }) => (i === length - 2 ? n + '@2x' : n))
    .join('.')

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

const uploader = key => new Slingshot.Upload(key)

class ImageUpload extends Component {
  constructor (props) {
    super(props)
    this.state = cloneDeep(initState)
    this.progressor = false
    this.addImage = this.addImage.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.uploader = uploader(props.uploader || 'images')
  }

  updateProgress () {
    this.progressor = setInterval(() => {
      const { started, thumbnails, thumbsUploaded, uploaded } = this.state
      const progressed =
        ((thumbsUploaded + (uploaded ? 1 : 0)) / (thumbnails.length + 1)) * 100
      const progress =
        (this.uploader.progress() / (thumbnails.length + 1)) * 100 + progressed
      if (started) {
        const done = uploaded && thumbsUploaded >= thumbnails.length
        this.setState({ progress, done }, () => {
          if (this.state.done) {
            clearInterval(this.progressor)
            this.finishUpload()
          }
        })
      }
    }, 128)
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
    const callback = (file, success, error) => {
      this.setState(({ thumbnails }) => {
        success ? thumbnails.push(file) : console.error(error)
        const thumbsProcessed =
          thumbnails.filter(v => v).length >=
          this.props.sizes.length +
            this.props.sizes.filter(({ retina }) => retina).length
        return { thumbnails, thumbsProcessed }
      })
    }
    generateThumbnail(image, name, size, callback)
    if (size.retina) {
      generateThumbnail(image, retinaName(name), retinaSize(size), callback)
    }
  }

  handleUpload () {
    this.state.started = true
    this.updateProgress()
    this.uploader.send(this.state.image, (error, url) => {
      if (error) {
        console.error(error)
        this.setState({ error: error.message })
      } else this.setState({ uploaded: url }, () => this.uploadThumb())
    })
  }

  uploadThumb () {
    const { thumbsUploaded } = this.state
    const image = this.state.thumbnails[thumbsUploaded]
    const callback = () =>
      this.setState({ thumbsUploaded: thumbsUploaded + 1 }, () =>
        this.uploadThumb()
      )
    if (typeof image !== 'undefined') {
      if (image) {
        this.uploader.send(image, error => {
          if (error) {
            console.error(
              `Thumbnail ${image.name} could not be uploaded`,
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
      this.props.onSubmit(
        this.props._getUrl ? this.state.uploaded : this.state.name
      )
      this.setState(cloneDeep(initState))
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
const MarkdownImageUpload = props => {
  const convertToMd = url =>
    props.onSubmit(`\n![${url.split('/').pop()}](${url})`)
  return <ImageUpload {...props} onSubmit={convertToMd} _getUrl />
}

ImageUpload.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  sizes: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      width: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        .isRequired,
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        .isRequired,
      crop: PropTypes.bool,
      quality: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  placeholder: PropTypes.string,
  uploader: PropTypes.string,
  _getUrl: PropTypes.bool
}

ImageUpload.defaultProps = {
  sizes: []
}

export default ImageUpload
export { MarkdownImageUpload }
