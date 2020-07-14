const { spawnSync } = require('child_process');
const path = require('path');
const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');

function getSquirrelCommand() {
  const arg = process.argv.find(arg=> arg.includes('--squirrel'));
  if(!arg) return;
  return arg.replace('--squirrel-', ''); // remove `--squirrel-` part from commands
}

function isFirstRun() {
  return getSquirrelCommand() === 'firstrun';
}

function shouldQuit() {
  const command = getSquirrelCommand();
  if(!command) return false;

  // quit app when these squirrel commands are run. https://git.io/fhtDJ
  return ['install', 'updated', 'obsolete', 'uninstall'].includes(command);
}

function handleSquirrelCommands() {
  const command = getSquirrelCommand();
  if(!command) return;

  switch(command) {
    case 'install':
      return spawnSync(updateExe, ['--createShortcut', 'Scratch Console.exe']);
    case 'uninstall':
      return spawnSync(updateExe, ['--removeShortcut', 'Scratch Console.exe']);
  }
}

module.exports = { getSquirrelCommand, isFirstRun, shouldQuit, handleSquirrelCommands };
