import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import './Settings'
import { Slingshot } from 'meteor/edgee:slingshot'
import { kebabCase, deburr, padStart } from 'lodash'

const safeName = name => kebabCase(deburr(name))

const timestamp = () => {
  date = new Date()
  return `${padStart(date.getFullYear(), 4, '0')}${padStart(
    date.getMonth()+1,
    2,
    '0'
  )}${padStart(date.getDate(), 2, '0')}T${padStart(
    date.getHours(),
    2,
    '0'
  )}${padStart(date.getMinutes(), 2, '0')}${padStart(
    date.getSeconds(),
    2,
    '0'
  )}`
}

Slingshot.createDirective('imageUpload', Slingshot.S3Storage, {
  bucket: Meteor.settings.S3Bucket,
  acl: 'public-read',
  cacheControl: 'max-age=3153600',
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
? name.split(".").pop()
: file.type.split("/").pop();
const prefix = Meteor.settings.public.imgupload.prefix || "imgUpload";
return `${prefix}/${timestamp()}-${Random.hexString(4)}-${safeName(name)}.${extension}`
  }
})

Slingshot.createDirective('fileUpload', Slingshot.S3Storage, {
  bucket: Meteor.settings.S3Bucket,
  acl: 'public-read',
  cacheControl: 'max-age=3153600',
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
      const prefix = Meteor.settings.public.fileupload.prefix || "fileUpload";
    return `${prefix}/${timestamp()}-${safeName(name)}.${extension}`
  }
})
