const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const root = process.cwd();
const backendDir = path.join(root, 'modules', 'minimarket', 'backend');
const frontendDir = path.join(root, 'modules', 'minimarket', 'frontend');

const runSync = (cmd, args, cwd) => {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const runAsync = (cmd, args, cwd) => {
  return spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
};

console.log('== Minimarket: starting database (docker) ==');
runSync('docker', ['compose', 'up', '-d'], backendDir);

console.log('== Minimarket: build frontend ==');
runSync('npm', ['run', 'build'], frontendDir);

console.log('== Minimarket: start backend ==');
const backend = runAsync('mvn', ['-q', '-DskipTests', 'spring-boot:run'], backendDir);

console.log('== Minimarket: start frontend preview ==');
const frontend = runAsync('npm', ['run', 'preview', '--', '--port', '5176'], frontendDir);

const shutdown = () => {
  if (!backend.killed) backend.kill('SIGINT');
  if (!frontend.killed) frontend.kill('SIGINT');
};

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});
