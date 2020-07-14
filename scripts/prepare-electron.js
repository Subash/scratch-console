#!/usr/bin/env node
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const rcedit = require('rcedit');
const { version: electronVersion } = require('electron/package.json');
const { version } = require('../package.json');

const rootDir = path.resolve(__dirname, '..');
const electronDir = path.resolve(rootDir, 'build/electron');

async function clean() {
  const spinner = ora('Cleaning directory').start();
  await fs.remove(electronDir);
  spinner.succeed();
}

async function copy() {
  const packageDir = path.dirname(require.resolve('electron/package.json'));
  const distDir = path.resolve(packageDir, 'dist');
  const spinner = ora('Copying electron').start();
  await fs.copy(distDir, electronDir);
  spinner.succeed();
}

async function prepareMac() {
  const oldApp = path.resolve(electronDir, 'Electron.app');
  const newApp = path.resolve(electronDir, 'Scratch Console.app');
  await fs.move(oldApp, newApp);

  const execDir = path.resolve(newApp, 'Contents/MacOS');
  await fs.rename(path.resolve(execDir, 'Electron'), path.resolve(execDir, 'Scratch Console'));

  await fs.copyFile(
    path.resolve(rootDir, 'static/icon.icns'),
    path.resolve(newApp, 'Contents/Resources/scratch console.icns')
  );

  const infoFile = path.resolve(newApp, 'Contents/Info.plist');
  let info = fs.readFileSync(infoFile, 'utf-8')
    .split(electronVersion).join(version)
    .replace('com.github.Electron', 'com.subashpathak.scratch-console')
    .replace(/electron/g, 'scratch console')
    .replace(/Electron/g, 'Scratch Console');

  await fs.writeFile(infoFile, info);
}

async function prepareWindows() {
  await fs.rename(
    path.resolve(electronDir, 'electron.exe'),
    path.resolve(electronDir, 'Scratch Console.exe')
  );

  // wait a few seconds before trying to change executable metadata
  // otherwise rcedit fails intermittently with `Unable to load file.` error.
  await new Promise(resolve=> setTimeout(resolve, 2000));

  await rcedit(path.resolve(electronDir, 'Scratch Console.exe'), {
    icon: path.resolve(rootDir, 'static/icon.ico'),
    'file-version': version,
    'product-version': version,
    'version-string': {
      LegalCopyright: 'Subash Pathak, All Rights Reserved.',
      CompanyName: 'Scratch Console',
      FileDescription: 'Scratch Console',
      OriginalFilename: 'Scratch Console.exe',
      ProductName: 'Scratch Console',
      InternalName: 'Scratch Console'
    }
  });
}

async function prepare() {
  const prepare = {
    win32: prepareWindows,
    darwin: prepareMac
  };

  const spinner = ora('Preparing electron').start();
  await prepare[process.platform]();
  spinner.succeed();
}

Promise.resolve()
  .then(clean)
  .then(copy)
  .then(prepare)
  .catch((err)=> {
    console.error(err);
    process.exit(1);
  });
