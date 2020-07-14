#!/usr/bin/env node
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const run = require('@sbspk/run');
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.resolve(rootDir, 'build');

async function clean() {
  const spinner = ora('Cleaning build directory').start();
  await fs.remove(buildDir);
  await fs.ensureDir(buildDir);
  spinner.succeed();
}

async function prepareElectron() {
  const prepareScript = path.resolve(__dirname, 'prepare-electron.js');
  await run('node', [ prepareScript ], { cwd: rootDir, stdio: 'inherit' });
}

async function buildApp() {
  const buildScript = path.resolve(__dirname, 'build-app.js');
  await run('node', [ buildScript ], { stdio: 'inherit' });
}

async function createInstaller() {
  const os = { win32: 'windows', darwin: 'mac' }[process.platform];
  if(!os) throw new Error(`Only macOS and Windows are supported at the moment.`);
  const buildScript = path.resolve(__dirname, `build-${os}.js`);
  await run('node', [ buildScript ], { stdio: 'inherit' });
}

Promise.resolve()
  .then(clean)
  .then(prepareElectron)
  .then(buildApp)
  .then(createInstaller)
  .catch((err)=> {
    console.error(err);
    process.exit(1);
  });
