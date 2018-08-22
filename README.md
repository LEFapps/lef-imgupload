# Image uploader and conversion to AWS S3

This package let's you upload images to Amazon AWS S3 using a simple user interface. `ImageUpload` returns an AWS S3 URL.

## Usage

```JSX
import ImageUpload from "meteor/lef:imgupload";

const doSomeThingWithTheUrl = (url[, size]) => {
  console.log(size, url);
}

<ImageUpload onSubmit={doSomeThingWithTheUrl} sizes={[256,512]} />
```

Alternatively, use the `MarkdownImageUpload` to get a Markdown formatted image string instead of the url through the `onSubmit` callback.

## Meteor settings

Your meteor settings should contain the following:

```JSON
{
  "AWSAccessKeyId": "youraccesskey",
  "AWSSecretAccessKey": "yoursecret",
  "S3Bucket": "yourbucket",
  "S3Region": "yourregion",
  "public": {
    "imgupload": {
      "allowedFileTypes": ["image/png", "image/jpeg", "image/gif"],
      "maxSize": 12582912
    }
  }
}
```

## Client side image resizing

You can specify an array of sizes for which a thumbnail should be created. These are uploaded together with the original file. You should take care saving the thumbnail urls in the onSubmit handler.

The onSubmit handler is called for each thumbnail with the size as a second parameter. Proposal for saving thumbnails:

```JSON
{
  "url" : "<original image url>",
  "thumbnails" : {
    "size" : "<thumbnail url>"
  }
}
```

## Dependencies

The upload is transfered directly from the client to the AWS. This doesn't charge our server unnecessarely. Using: https://github.com/CulturalMe/meteor-slingshot/#aws-s3-slingshots3storage

## Installation

Create a symbolic link to this package in your meteor's package folder:

`ln -s ../../packages/lef-imgupload/ lef-imgupload`
