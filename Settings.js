import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/mikkelking:slingshot'
import { get } from 'lodash'

const defaultRestrictions = {
  allowedFileTypes: get(Meteor.settings.public, 'imgupload.allowedFileTypes', [
    'image/png',
    'image/jpeg',
    'image/gif'
  ]),
  maxSize: get(Meteor.settings.public, 'imgupload.maxSize', 12582912)
}

Slingshot.fileRestrictions('imageUpload', defaultRestrictions)

Slingshot.fileRestrictions('fileUpload', {
  allowedFileTypes: get(
    Meteor.settings.public,
    'fileupload.allowedFileTypes',
    defaultRestrictions.allowedFileTypes
  ),
  maxSize: get(
    Meteor.settings.public,
    'fileupload.maxSize',
    defaultRestrictions.maxSize
  ) // in bytes, use null for unlimited
})
