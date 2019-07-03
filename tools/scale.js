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
  static resize (file, maxDimensions, compression = 0.6, callback) {
    if (typeof maxDimensions === 'function') {
      callback = maxDimensions
      maxDimensions = {
        width: 1920,
        height: 1280
      }
    }

    // allowed range: .25 .. 1
    const comp =
      compression > 100
        ? 0.6 // default 60 %
        : compression > 1
          ? Math.min(1, compression / 100) // max 100 %
          : Math.max(0.25, compression) // min 25 %

    let maxWidth = maxDimensions.width
    let maxHeight = maxDimensions.height

    if (!ImageTools.isSupported() || !file.type.match(/image.*/)) {
      console.log('!supported || !image')
      callback(file, false, 'unsupported')
      return false
    }

    if (file.type.match(/image\/gif/)) {
      console.log('gif')
      // Not attempting, could be an animated gif
      callback(file, false, 'gif')
      // TODO: use https://github.com/antimatter15/whammy to convert gif to webm
      return false
    }

    const image = document.createElement('img')

    image.onload = imgEvt => {
      getOrientation(file, orientation => {
        let width = image.width
        let height = image.height
        let isTooLarge = false

        if (width >= height && width > maxWidth) {
          // width is the largest dimension, and it's too big.
          height *= maxWidth / width
          width = maxWidth
          isTooLarge = true
        } else if (height > maxHeight) {
          // either width wasn't over-size or height is the largest dimension
          // and the height is over-size
          width *= maxHeight / height
          height = maxHeight
          isTooLarge = true
        }

        if (!isTooLarge) {
          // early exit; no need to resize
          callback(file, false, 'tooSmall')
          return
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
        ctx.drawImage(image, 0, 0, width, height)
        ctx.restore()

        const name = `${Math.round(width)}-${Math.round(height)}-${file.name}`

        if (hasToBlobSupport) {
          canvas.toBlob(
            blob => {
              blob.name = name
              callback(blob, true)
            },
            file.type,
            comp
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
