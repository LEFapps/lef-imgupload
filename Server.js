import { Meteor } from 'meteor/meteor'
import './Settings'
import { Slingshot } from 'meteor/edgee:slingshot'

Slingshot.createDirective('imageUpload', Slingshot.S3Storage, {
  bucket: Meteor.settings.S3Bucket,
  acl: 'public-read',
  cacheControl: 'max-age=3153600',
  region: Meteor.settings.S3Region,
  authorize: () => true,
  key: ({ name }) => `images/${name.indexOf('/') ? name : 'original/' + name}`
})

Slingshot.createDirective('fileUpload', Slingshot.S3Storage, {
  bucket: Meteor.settings.S3Bucket,
  acl: 'public-read',
  cacheControl: 'max-age=3153600',
  region: Meteor.settings.S3Region,
  authorize: () => true,
  key: ({ name }) => `files/${name.indexOf('/') ? name : 'original/' + name}`
})
