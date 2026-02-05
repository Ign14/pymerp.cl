const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = process.cwd();
const backendDir = path.join(root, 'modules', 'minimarket', 'backend');
const frontendDir = path.join(root, 'modules', 'minimarket', 'frontend');

const run = (cmd, args, cwd) => {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

console.log('== Minimarket: build backend ==');
run('mvn', ['-q', '-DskipTests', 'package'], backendDir);

console.log('== Minimarket: build frontend ==');
run('npm', ['run', 'build'], frontendDir);
