# Image uploader and conversion to AWS S3

This package let's you upload images to Amazon AWS S3 using a simple user interface. `ImageUpload` returns the name of the image file.

## Usage

```JSX
import ImageUpload from "meteor/lef:imgupload";

<ImageUpload
  onSubmit={console.log}
  sizes={[Object]}
  label={'Upload your picture'}
  placeholder={'min. 256 x 256 px, max 500 kB'}
  uploader={'images'} />
```

Alternatively, use the `MarkdownImageUpload` to get a Markdown formatted image string instead of the filename through the `onSubmit` callback. **Note**, this currently uses the original file which will be very large to download.

### Props

Prop | Required | Type | Description
--- | --- | --- | ---
`onSubmit` | yes | func | returns filename, it is up to you to construct the complete url
`sizes` | no | [Object] | configure [image thumbnails](#thumbnails)
`label` | no | String<br/>Component | Label for the upload input
`uploader` | no | String | key of the upload settings to use
`_getUrl` | no | Boolean | Return complete url instead of filename

## Meteor settings

Your meteor settings should contain the following:

```JSON
{
  "AWSAccessKeyId": "youraccesskey",
  "AWSSecretAccessKey": "yoursecret",
  "S3Bucket": "yourbucket",
  "S3Region": "yourregion",
  "public": {
    "uploads": [
      {
        "key": "images", // url-safe string
        "maxSize": 12582912, // max file size in bytes *
        "defaultPrefix": "original/", // prefix for default resizer
        "allowedFileTypes": [
          "image/png",
          "image/jpeg",
          "image/gif"
        ] // list of allowed MIME-types
      }, {
        "key": "files",
        "maxSize": 12582912,
        "allowedFileTypes": [
          "application/pdf"
        ]
      }
    ]
  }
}
```

If you want to use different Bucket for each uploader, you can add this to your settings:

```JSON
{
  "uploads": [
    {
      "key": "images", // matches key of public setting
      "S3Bucket": "bucket-name",
      "S3Region": "your-region-1",
    }
  ]
}
```

>  ***maxSize** in bytes: 12 x 1024 x 1024 ~ 12582912 ~ 12 MB

## Thumbnails

Thumbnails are created on the client to prevent the overload of our server.

You can specify how thumbnails should be created throug the `sizes` prop:

```JS
const sizes = [
  {
    label: 'thumb',
    width: 1024,
    height: 768,
    quality: 80,
    crop: true,
    retina: false
  }, { ... }
]

<ImageUpload {...props} sizes={sizes} />
```

Prop | Type | Default | Description
--- | --- | --- | ---
label | String | 'original' | name of your thumbnail which the filename is prefixed with<br/>`original/image.jpg`, `thumb/image.jpg`
width | Number | source&nbsp;width | target width of image in px
height | Number | source&nbsp;height | target height of image in px
quality | Number | 60% | value between 0.25..1 or 25..100
crop | Bool | false | crop or scale image to fit within width and height
retina | Boolean | false | creates a second thumbnail with double size and 80 % of specified quality<br/>stored as `filename@2x.ext`

#### Deprecation note

In earlier versions, sizes was an array of integers. In the current version, this is still allowed. `sizes={[256, 1024]}` would be equivalent to:

```JS
const sizes = [
  { label: 'thumb-256', width: 256, height: 256 },
  { label: 'thumb-512', width: 512, height: 512 }
]
```

## Dependencies

The selected file is transferred directly from the client to the AWS infrastructure. This doesn't charge our costly Galaxy server unnecessarely. Using: https://github.com/CulturalMe/meteor-slingshot/#aws-s3-slingshots3storage

## Installation

Add as a submodule in your meteor's package folder:

```SHELL
$ git submodule add https://github.com/LEFapps/lef-imgupload packages
```
