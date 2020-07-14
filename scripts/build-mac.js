#!/usr/bin/env node
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const run = require('@sbspk/run');
const { version } = require('../package.json');
const { appleDeveloperId, appleDeveloperUsername, appleDeveloperPassword } = require('../build.config.js');

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.resolve(rootDir, 'build');

function wait(time) {
  return new Promise(resolve=> setTimeout(resolve, time));
}

async function copyElectron() {
  const spinner = ora('Copying electron').start();
  const src = path.resolve(buildDir, 'electron/Scratch Console.app');
  const dest = path.resolve(buildDir, 'Scratch Console.app');
  await fs.remove(dest);
  await fs.copy(src, dest);
  spinner.succeed();
}

async function copyResources() {
  const spinner = ora('Copying resources').start();
  const resources = path.resolve(buildDir, 'Scratch Console.app/Contents/Resources');
  await fs.copy(path.resolve(buildDir, 'app.asar'), path.resolve(resources, 'app.asar'));
  spinner.succeed();
}

async function codeSign() {
  const spinner = ora('Signing Scratch Console.app').start();
  const entitlements = path.resolve(__dirname, '../static/entitlements.plist');

  const files = [
    'Scratch Console.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libEGL.dylib',
    'Scratch Console.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib',
    'Scratch Console.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib',
    'Scratch Console.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libEGL.dylib',
    'Scratch Console.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libGLESv2.dylib',
    'Scratch Console.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib',
    'Scratch Console.app/Contents/Frameworks/Squirrel.framework/Versions/A/Resources/ShipIt',
    'Scratch Console.app'
  ];

  for(const file of files) {
    await run(`codesign --deep --force --verbose --timestamp --options runtime --entitlements "${entitlements}" --sign "${appleDeveloperId}" "${file}"`, {
      cwd: buildDir
    });
  }

  spinner.succeed();
}

async function createZip() {
  const spinner = ora('Zipping Scratch Console.app').start();
  await run(`zip -r -q -y "Scratch Console-${version}.zip" "Scratch Console.app"`, {
    cwd: buildDir
  });
  spinner.succeed();
}

async function notarize() {
  const spinner = ora('Uploading Zip for Notarization').start();
  const result = await run(`xcrun altool --notarize-app --file "Scratch Console-${version}.zip" --primary-bundle-id com.subashpathak.scratch-console --username "${appleDeveloperUsername}" --password "${appleDeveloperPassword}"`, {
    cwd: buildDir
  });
  const uuid = result.split('\n').find(line=> line.includes('RequestUUID')).split('=')[1].trim();
  await fs.writeJson(path.resolve(buildDir, 'notarization.json'), { version, uuid });
  spinner.succeed();
}

async function checkNotarization() {
  const { uuid } = await fs.readJson(path.resolve(buildDir, 'notarization.json'));

  try {
    console.log('Checking Notarization Status');
    const result = await run(`xcrun altool --notarization-info "${uuid}" --username "${appleDeveloperUsername}" --password "${appleDeveloperPassword}"`, {
      cwd: buildDir
    });

    if(result.includes('Status: in progress')) {
      console.log('Notarization In Progress, Waiting for a Minute');
      await wait(60 * 1000);
      return await checkNotarization();
    }

    if(result.includes('Status: success')) {
      return console.log('Notarization Complete');
    }

    console.log('Notarization Failed');
    console.log(result);
    process.exit(1);

  } catch (err) {
    console.log('Notarization Check Failed');
    console.log(err.message);
    console.log('Waiting for a Minute');
    await wait(60 * 1000);
  }
}

async function staple() {
  const spinner = ora('Stapling Scratch Console.app').start();
  await run('xcrun stapler staple -v "Scratch Console.app"', { cwd: buildDir });
  spinner.succeed();
}

Promise.resolve()
  .then(copyElectron)
  .then(copyResources)
  .then(codeSign)
  .then(createZip)
  .then(notarize)
  .then(checkNotarization)
  .then(staple)
  .then(createZip) // zip the stapled app
  .catch((err)=> {
    console.error(err);
    process.exit(1);
  });
