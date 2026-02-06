const { spawn } = require('node:child_process');
const path = require('node:path');

const root = process.cwd();

const runAsync = (cmd, args, cwd) => {
  return spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
};

console.log('== Preview: core app ==');
const core = runAsync('npm', ['run', 'preview:core'], root);

console.log('== Preview: minimarket stack ==');
const minimarket = runAsync('node', ['scripts/minimarket/preview.cjs'], root);

const shutdown = () => {
  if (!core.killed) core.kill('SIGINT');
  if (!minimarket.killed) minimarket.kill('SIGINT');
};

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});
