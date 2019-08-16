import getOrientation from './orientation'

let hasBlobConstructor =
  typeof Blob !== 'undefined' &&
  (function () {
    try {
      return Boolean(new Blob())
    } catch (e) {
      return false
    }
  })()

let hasArrayBufferViewSupport =
  hasBlobConstructor &&
  typeof Uint8Array !== 'undefined' &&
  (function () {
    try {
      return new Blob([new Uint8Array(100)]).size === 100
    } catch (e) {
      return false
    }
  })()

let hasToBlobSupport =
  typeof HTMLCanvasElement !== 'undefined'
    ? HTMLCanvasElement.prototype.toBlob
    : false

let hasBlobSupport =
  hasToBlobSupport ||
  (typeof Uint8Array !== 'undefined' &&
    typeof ArrayBuffer !== 'undefined' &&
    typeof atob !== 'undefined')

let hasReaderSupport =
  typeof FileReader !== 'undefined' || typeof URL !== 'undefined'

export default class ImageTools {
  static resize (
    file,
    fileName,
    { label, quality, crop, ...modifier },
    callback
  ) {
    // Implementation not supported
    if (!ImageTools.isSupported()) {
      console.warn('[Image Uploader] Resizing not supported')
      return callback(file, false, 'unsupported')
    }

    if (!file.type.match(/image.*/)) {
      console.warn(`[Image Uploader] Image type ${file.type} not resizable`)
      return callback(file, false, 'unsupported')
    }

    // Not attempting, could be an animated gif
    // TODO: use https://github.com/antimatter15/whammy to convert gif to webm
    if (file.type.match(/image\/gif/)) {
      console.debug('[Image Uploader] Image type gif not resizable')
      return callback(file, false, 'gif')
    }

    quality =
      quality > 100
        ? 0.6 // default 60 %
        : quality > 1
          ? Math.min(1, quality / 100) // max 100 %
          : Math.max(0.25, quality) // min 25 %

    const image = document.createElement('img')
    image.onload = imgEvt => {
      getOrientation(file, orientation => {
        let width = image.width
        let height = image.height
        let drawWidth = modifier.width
        let drawHeight = modifier.height
        let offsetX = 0
        let offsetY = 0

        if (!modifier.width) modifier.width = width
        if (!modifier.height) modifier.height = height

        if (crop) {
          if (width / height < modifier.width / modifier.height) {
            // top-bottom falloff
            drawHeight = (modifier.width / width) * height
            offsetY = (modifier.height - drawHeight) / 2
          } else {
            // left-right falloff
            drawWidth = (modifier.height / height) * width
            offsetX = (modifier.width - drawWidth) / 2
          }
          width = modifier.width
          height = modifier.height
        } else {
          if (width >= height && width > modifier.width) {
            // width is the largest dimension, and it's too big.
            height *= modifier.width / width
            width = modifier.width
          } else if (height > modifier.height) {
            // either width wasn't over-size or height is the largest dimension
            // and the height is over-size
            width *= modifier.height / height
            height = modifier.height
          }
        }

        const canvas = document.createElement('canvas')
        if ([5, 6, 7, 8].includes(orientation)) {
          // 90° rotated
          canvas.width = height
          canvas.height = width
        } else {
          canvas.width = width
          canvas.height = height
        }

        let ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.save()
        switch (orientation) {
          case 2:
            ctx.transform(-1, 0, 0, 1, width, 0)
            break
          case 3:
            ctx.transform(-1, 0, 0, -1, width, height)
            break
          case 4:
            ctx.transform(1, 0, 0, -1, 0, height)
            break
          case 5:
            ctx.transform(-1, 0, 0, 1, 0, 0)
            ctx.rotate(Math.PI / 2)
            break
          case 6:
            ctx.transform(1, 0, 0, 1, height, 0)
            ctx.rotate(Math.PI / 2)
            break
          case 7:
            ctx.transform(-1, 0, 0, 1, height, width)
            ctx.rotate((-1 * Math.PI) / 2)
            break
          case 8:
            ctx.transform(1, 0, 0, 1, 0, width)
            ctx.rotate((-1 * Math.PI) / 2)
            break
          default:
            ctx.transform(1, 0, 0, 1, 0, 0)
            break
        }
        if (crop) ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
        else ctx.drawImage(image, 0, 0, width, height)
        ctx.restore()

        const name = `${label}/${fileName}`

        if (hasToBlobSupport) {
          canvas.toBlob(
            blob => {
              blob.name = name
              callback(blob, true)
            },
            file.type,
            quality
          )
        } else {
          let blob = ImageTools._toBlob(canvas, file.type)
          blob.name = name
          callback(blob, true)
        }
      })
    }

    ImageTools._loadImage(image, file)

    return true
  }

  static _toBlob (canvas, type) {
    let dataURI = canvas.toDataURL(type)
    let dataURIParts = dataURI.split(',')
    let byteString
    if (dataURIParts[0].indexOf('base64') >= 0) {
      // Convert base64 to raw binary data held in a string:
      byteString = atob(dataURIParts[1])
    } else {
      // Convert base64/URLEncoded data component to raw binary data:
      byteString = decodeURIComponent(dataURIParts[1])
    }
    let arrayBuffer = new ArrayBuffer(byteString.length)
    let intArray = new Uint8Array(arrayBuffer)

    for (let i = 0; i < byteString.length; i += 1) {
      intArray[i] = byteString.charCodeAt(i)
    }

    let mimeString = dataURIParts[0].split(':')[1].split(';')[0]
    let blob = null

    if (hasBlobConstructor) {
      blob = new Blob([hasArrayBufferViewSupport ? intArray : arrayBuffer], {
        type: mimeString
      })
    } else {
      let bb = new BlobBuilder()
      bb.append(arrayBuffer)
      blob = bb.getBlob(mimeString)
    }

    return blob
  }

  static _loadImage (image, file, callback) {
    if (typeof URL === 'undefined') {
      let reader = new FileReader()
      reader.onload = function (evt) {
        image.src = evt.target.result
        if (callback) {
          callback()
        }
      }
      reader.readAsDataURL(file)
    } else {
      image.src = URL.createObjectURL(file)
      if (callback) {
        callback()
      }
    }
  }

  static isSupported () {
    return (
      typeof HTMLCanvasElement !== 'undefined' &&
      hasBlobSupport &&
      hasReaderSupport
    )
  }
}
