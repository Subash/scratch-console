const path = require('path');

module.exports = {
  appleDeveloperId: 'abc',
  appleDeveloperUsername: 'abc',
  appleDeveloperPassword: 'abc',
  windowsCodesignCertificate: path.resolve(__dirname, 'codesign.p12'),
  windowsCodesignCertificatePassword: 'hunter2'
};
