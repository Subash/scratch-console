#!/usr/bin/env node
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const winstaller = require('electron-winstaller');
const { version } = require('../package.json');
const { windowsCodesignCertificate, windowsCodesignCertificatePassword } = require('../build.config.js');

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.resolve(rootDir, 'build');

async function copyElectron() {
  const spinner = ora('Copying electron').start();
  const src = path.resolve(buildDir, 'electron');
  const dest = path.resolve(buildDir, 'Scratch Console');
  await fs.remove(dest);
  await fs.copy(src, dest);
  spinner.succeed();
}

async function copyResources() {
  const spinner = ora('Copying resources').start();
  const resources = path.resolve(buildDir, 'Scratch Console/resources');
  await fs.copy(path.resolve(buildDir, 'app.asar'), path.resolve(resources, 'app.asar'));
  spinner.succeed();
}

async function createInstaller() {
  const spinner = ora('Creating installer').start();
  await winstaller.createWindowsInstaller({
    appDirectory: path.resolve(buildDir, 'Scratch Console'),
    outputDirectory: buildDir,
    exe: 'Scratch Console.exe',
    loadingGif: path.resolve(rootDir, 'static/installing.gif'),
    setupIcon: path.resolve(rootDir, 'static/icon.ico'),
    setupExe: `Scratch Console-Setup-${version}.exe`,
    noMsi: true,
    version: version,
    authors: 'Subash Pathak',
    description: 'Scratch Console',
    title: 'Scratch Console',
    signWithParams: `/a /t http://timestamp.globalsign.com/scripts/timestamp.dll /f "${windowsCodesignCertificate}" /p "${windowsCodesignCertificatePassword}"`
  });
  spinner.succeed();
}

Promise.resolve()
  .then(copyElectron)
  .then(copyResources)
  .then(createInstaller)
  .catch((err)=> {
    console.error(err);
    process.exit(1);
  });
