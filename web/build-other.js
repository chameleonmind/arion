const path = require('path')
const fs = require('fs')
const pckgVersion = require(path.resolve(__dirname, 'package.json')).version
const buildPckg = require(path.resolve(__dirname, 'package-build.json'))

buildPckg.version = pckgVersion

fs.writeFileSync(path.resolve(__dirname, './dist/package.json'), JSON.stringify(buildPckg, null, 2))


