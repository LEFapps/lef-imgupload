import { Slingshot } from "meteor/edgee:slingshot";

Slingshot.fileRestrictions("imageUpload", {
  allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
  maxSize: 0.8 * 1024 * 1024 // 0.8 MB (use null for unlimited).
});
