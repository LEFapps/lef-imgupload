Package.describe({
  name: 'lef:imgupload',
  version: '2.0.1',
  summary: 'Upload directly to S3'
})

Package.onUse(function (api) {
  api.use(['ecmascript', 'edgee:slingshot'])
  Npm.depends({
    lodash: '4.17.15',
    '@lefapps/uploader': '0.0.5'
  })
  api.addFiles('server.js', 'server')
  api.mainModule('Component.js', 'client')
})
