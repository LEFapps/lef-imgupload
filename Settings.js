import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/edgee:slingshot'

const uploads = Meteor.settings.public.uploads

if (uploads) {
  uploads.forEach(({ key, maxSize, allowedFileTypes, ...upload }) => {
    const restrictions = {
      allowedFileTypes: allowedFileTypes || [
        'image/png',
        'image/jpeg',
        'image/gif'
      ],
      maxSize: maxSize || 12582912
    }
    Slingshot.fileRestrictions(key, restrictions)
  })
}
