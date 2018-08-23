# Image uploader and conversion to AWS S3

This package let's you upload images to Amazon AWS S3 using a simple user interface. `ImageUpload` returns an AWS S3 URL.

## Usage

```JSX
import ImageUpload from "meteor/lef:imgupload";

const doSomeThingWithTheUrl = (url[, thumbs]) => {
  console.log(url, thumbs);
  // thumbs is an array of objects: {size: 256, url: "URL"}
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

> **maxSize** in bytes: 12 _ 1024 _ 1024 ~ 12582912 ~ 12 MB

## Client side image resizing

You can specify an array of sizes for which a thumbnail should be created. These are uploaded together with the original file. The onSubmit handler is called once when all images are uploaded. Proposal for saving thumbnails:

```JSON
{
  "url" : "<original image url>",
  "thumbnails" : {
    "<size>" : "<thumbnail url>"
  }
}
```

```JSX
const ImageBox = picture => {
  const url =
    picture.thumbnails && picture.thumbnails["512"]
      ? picture.thumbnails["512"]
      : picture.url;
  return <div style={{backgroundImage: `url(${url})`}} />;
}
```

or just use the original thumbnails parameter:

```JSON
{
  "url" : "<original image url>",
  "thumbnails" : [
    {
      "size" : "<size>",
      "url" : "<thumbnail url>"
    },
    {
      "size" : "<size>",
      "url" : "<thumbnail url>"
    }
  ]
}
```

## Dependencies

The upload is transferred directly from the client to the AWS. This doesn't charge our server unnecessarely. Using: https://github.com/CulturalMe/meteor-slingshot/#aws-s3-slingshots3storage

## Installation

Create a symbolic link to this package in your meteor's package folder:

`ln -s ../../packages/lef-imgupload/ lef-imgupload`
