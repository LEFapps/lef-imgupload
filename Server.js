import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import './Settings'
import { Slingshot } from 'meteor/edgee:slingshot'

Slingshot.createDirective('imageUpload', Slingshot.S3Storage, {
  bucket: Meteor.settings.S3Bucket,
  acl: 'public-read',
  region: Meteor.settings.S3Region,
  authorize: () => {
    // Deny uploads if user is not logged in.
    // if (!this.userId) {
    //   var message = "Please login before posting files";
    //   throw new Meteor.Error("Login Required", message);
    // }
    return true
  },
  key: file => {
    const name = file.name || file.type.split('/')[0] || ''
    const extension = file.name
      ? name.split('.').pop()
      : file.type.split('/').pop()
    return 'imageUpload/' + Random.hexString(12) + '.' + extension
  }
})

Slingshot.createDirective('fileUpload', Slingshot.S3Storage, {
  bucket: Meteor.settings.S3Bucket,
  acl: 'public-read',
  region: Meteor.settings.S3Region,
  authorize: () => {
    // Deny uploads if user is not logged in.
    // if (!this.userId) {
    //   var message = "Please login before posting files";
    //   throw new Meteor.Error("Login Required", message);
    // }
    return true
  },
  key: file => {
    const name = file.name || file.type.split('/')[0] || ''
    const extension = file.name
      ? name.split('.').pop()
      : file.type.split('/').pop()
    return 'fileUpload/' + Random.hexString(12) + '.' + extension
  }
})
