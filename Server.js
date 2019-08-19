import { Meteor } from 'meteor/meteor'
import './Settings'
import { Slingshot } from 'meteor/edgee:slingshot'

Meteor.settings.public.uploads.forEach(({ key, defaultPrefix }) => {
  const server = Meteor.settings.uploads.find(p => p.key === key) || {}
  Slingshot.createDirective(key, Slingshot.S3Storage, {
    bucket: server.S3Bucket || Meteor.settings.S3Bucket,
    acl: 'public-read',
    cacheControl: 'max-age=3153600',
    region: server.S3Region || Meteor.settings.S3Region,
    authorize: () => true,
    key: ({ name }) =>
      key + '/' + (name.indexOf('/') ? name : (defaultPrefix || '') + name)
  })
})
