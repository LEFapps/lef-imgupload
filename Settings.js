import { Meteor } from "meteor/meteor";
import { Slingshot } from "meteor/edgee:slingshot";

const createSlingShot = (name, options) => {
  const { allowedFileTypes, maxSize } = options;
  return Slingshot.fileRestrictions(name, {
    allowedFileTypes: allowedFileTypes || [
      "image/jpeg",
      "image/png",
      "image/gif",
    ],
    maxSize: maxSize || 2 * 1024 * 1024, // in bytes, use null for unlimited
  });
};

export default createSlingShot;
