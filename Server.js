import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import "./Settings";
import { Slingshot } from "meteor/edgee:slingshot";

Slingshot.createDirective("imageUpload", Slingshot.S3Storage, {
  bucket: Meteor.settings.S3Bucket,
  acl: "public-read",
  region: Meteor.settings.S3Region,
  authorize: () => {
    //Deny uploads if user is not logged in.
    // if (!this.userId) {
    //   var message = "Please login before posting files";
    //   throw new Meteor.Error("Login Required", message);
    // }
    return true;
  },
  key: file => {
    return Random.hexString(3) + "_" + file.name.replace(/\s/g, "-");
  }
});
