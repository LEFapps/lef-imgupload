import React from 'react'
import PropTypes from 'prop-types'
import { Slingshot } from 'meteor/edgee:slingshot'
import Uploader, { Preview } from '@lefapps/uploader'

import setRestrictions from './settings'

class UploadComponent extends React.Component {
  _isMounted = false
  constructor (props) {
    super(props)
    this.state = { updateHandler: false }
  }
  componentDidMount () {
    this._isMounted = true
    this._loadUploader(
      this.props.uploader || this.props.fileUploader ? 'files' : 'images'
    )
  }
  componentWillUnmount () {
    this._isMounted = false
  }
  _loadUploader (uploader) {
    Meteor.call('createDirective', uploader, (e, r) => {
      if (r && this._isMounted) {
        setRestrictions(uploader)
        this.setState({ uploadHandler: new Slingshot.Upload(uploader) })
      }
    })
  }
  onSubmit = file =>
    this.props._getMeta
      ? this.props.onSubmit(file)
      : this.props.onSubmit(file.url)
  render () {
    const { uploadHandler } = this.state
    if (!uploadHandler) return null
    return (
      <Uploader
        uploader={uploadHandler}
        sizes={this.props.sizes || []}
        name={this.props.name || 'file'}
        label={this.props.placeholder || this.props.label || undefined}
        invalid={this.props.invalid}
        onChange={this.onSubmit}
        multiple={this.props.multiple}
        placeholder={this.props.placeholder}
        id={this.props.id}
        className={this.props.className}
      >
        {this.props.children}
      </Uploader>
    )
  }
}

/*
 * Converts the uploaded url to a Markdown formatted string.
 */

const MarkdownImageUpload = ({ sizes, picture, onSubmit, ...props }) => {
  sizes = sizes || []
  const convertToMd = ({ name, url }) => {
    const sources = [url]
    if (picture) {
      sizes.forEach(({ label, width, height, ...size }) => {
        sources.push(
          `${url.replace('/original/', `/${label || 'original'}/`)} "${label ||
            'fit within'} ${width || size}×${height || size}"`
        )
      })
    }
    onSubmit(`\n![${name}](${sources.join(')(')})`)
  }
  return (
    <UploadComponent sizes={sizes} {...props} onSubmit={convertToMd} _getMeta />
  )
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
  // uploader: PropTypes.string,
  // uploader: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  _getUrl: PropTypes.bool
}

ImageUpload.defaultProps = {
  sizes: []
}

MarkdownImageUpload.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  picture: PropTypes.bool,
  sizes: PropTypes.array
}

export default UploadComponent
export { Preview as UploadPreview, MarkdownImageUpload }
