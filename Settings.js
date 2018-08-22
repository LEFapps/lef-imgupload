import { Meteor } from "meteor/meteor";
import { Slingshot } from "meteor/edgee:slingshot";

Slingshot.fileRestrictions("imageUpload", {
  allowedFileTypes: Meteor.settings.public.imgupload.allowedFileTypes,
  maxSize: Meteor.settings.public.imgupload.maxSize, // in bytes, use null for unlimited
});
