#!/usr/bin/env node
const ora = require('ora');
const path = require('path');
const asar = require('asar');
const fs = require('fs-extra');

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.resolve(rootDir, 'build');
const appDir = path.resolve(buildDir, 'app');

async function clean() {
  const spinner = ora('Cleaning app directory').start();
  await fs.remove(appDir);
  await fs.remove(`${appDir}.asar`);
  spinner.succeed();
}

async function createApp() {
  const spinner = ora('Creating app').start();
  await fs.ensureDir(appDir);
  await fs.copy(path.resolve(rootDir, 'src'), path.resolve(appDir, 'src'));
  await fs.copy(path.resolve(rootDir, 'static'), path.resolve(appDir, 'static'));
  await fs.copy(path.resolve(rootDir, 'package.json'), path.resolve(appDir, 'package.json'));
  spinner.succeed();
}

async function createAsar() {
  const spinner = ora('Creating app.asar').start();
  await asar.createPackageWithOptions(appDir, `${appDir}.asar`, {});
  spinner.succeed();
}

Promise.resolve()
  .then(clean)
  .then(createApp)
  .then(createAsar)
  .catch((err)=> {
    console.error(err);
    process.exit(1);
  });
