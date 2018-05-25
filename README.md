# Image uploader and conversion to AWS S3

This package let's you upload images to Amazon AWS S3 using a simple user interface. `ImageUpload` returns an AWS S3 URL.

## Usage

```JSX
import ImageUpload from "meteor/lef:imgupload";

const doSomeThingWithTheUrl = (url) => {
  console.log(url);
}

<ImageUpload onSubmit={doSomeThingWithTheUrl} />
```

## Meteor settings

Your meteor settings should contain the following:

```
{
  "AWSAccessKeyId": "youraccesskey",
  "AWSSecretAccessKey": "yoursecret",
  "S3Bucket": "yourbucket",
  "S3Region": "yourregion
}
```

## Dependencies

The upload is transfered directly from the client to the AWS. This doesnt charge our server unnecessarely. Using: https://github.com/CulturalMe/meteor-slingshot/#aws-s3-slingshots3storage

## Installation

Create a symbolic link to this package in your meteor's package folder:

`ln -s ../../packages/lef-imgupload/ lef-imgupload`
