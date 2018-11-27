Package.describe({
  name: 'lef:imgupload',
  version: '1.3.2',
  summary: 'File image upload to S3'
})

Package.onUse(function (api) {
  api.use(['ecmascript', 'edgee:slingshot'])
  Npm.depends({
    lodash: '4.17.5',
    react: '16.5.0',
    reactstrap: '6.4.0'
  })
  api.addFiles('Server.js', 'server')
  api.mainModule('Component.js', 'client')
})
