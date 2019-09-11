import { Meteor } from 'meteor/meteor'

const defaultRestrictions = {
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/gif'],
  maxSize: 12582912
}

export default uploadKey => {
  const uploader = Meteor.settings.public.uploads[uploadKey]
  const { allowedFileTypes, maxSize } = uploader
  return Slingshot.fileRestrictions(uploadKey, {
    allowedFileTypes: allowedFileTypes || defaultRestrictions.allowedFileTypes,
    maxSize: maxSize || defaultRestrictions.maxSize
    // in bytes, use null for unlimited
  })
}
