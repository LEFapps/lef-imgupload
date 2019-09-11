import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/edgee:slingshot'

import setRestrictions from './settings'

const uploaders = Meteor.settings.public.uploads
const uploaderSettings = Meteor.settings.uploads

Meteor.methods({
  createDirective: uploadKey => {
    const uploader = uploaders[uploadKey]
    const uploaderSetting = uploaderSettings[uploadKey]
    if (!uploader) {
      throw new Meteor.Error('not-found', 'This uploader is not available')
    }
    const key = uploadKey
    if (Slingshot.getDirective(key)) return true
    setRestrictions(key)
    Slingshot.createDirective(key, Slingshot.S3Storage, {
      bucket: uploaderSetting.bucket || Meteor.settings.S3Bucket,
      region: uploaderSetting.region || Meteor.settings.S3Region,
      acl: uploader.acl || 'public-read',
      cacheControl: uploader.cacheControl || 'max-age=3153600',
      authorize: () => true,
      key: ({ name }) => {
        const res =
          uploadKey +
          '/' +
          ((name || '').indexOf('/') >= 0
            ? name
            : (uploader.defaultPrefix || '') + name)
        return res
      }
    })
    if (Slingshot.getDirective(key)) return true
  }
})
