const path = require('path');
const fs = require('fs-extra');
const { spawnSync } = require('child_process');
const dbo = require('ys-dbo');

exports.use = `{ enable: true, package: 'ys-pg-koa-router', agent: 'agent' }`;
exports.common = `{}`;

exports.installer = async ({ cwd, log }) => {
  const routerDir = path.resolve(cwd, 'app', 'router');
  const indexFilePath = path.resolve(routerDir, 'index.js');
  if (!fs.existsSync(routerDir)) {
    fs.mkdirSync(routerDir);
  }
  if (fs.existsSync(indexFilePath)) {
    throw new Error(`file '${indexFilePath}' is already exists.`);
  }
  const data = `module.exports = (app, router) => {
  router.get('/', app.controller.index);
}`;
  fs.writeFileSync(indexFilePath, data, 'utf8');
  log.success(`写入初始路由文件成功 - '${indexFilePath}'`);
}

exports.uninstaller = async ({ cwd }) => {
  const code = spawnSync('rm', ['-rf', 'app/router'], {
    stdio: 'inherit',
    cwd
  });
  if (!code) {
    throw new Error('Run command catch error');
  }
}

exports.command = ({ app, log, root }) => {
  app.command('router <name>')
    .describe('创建一个新的路由')
    .action(name => {
      new dbo().until(async thread => {
        const relativePath = path.relative(root, process.cwd());
        const routerPath = path.resolve(root, 'app/router');
        const isInRouterDir = relativePath.indexOf('app/router') === 0;
        if (isInRouterDir) {
          return exports.addFile(process.cwd(), name, log);
        }
        await exports.addFile(routerPath, name, log);
      }, {
        error(e) {
          log.error(e.message);
          process.exit(1);
        }
      });
    });
}

exports.addFile = async (cwd, name, log) => {
  name = name.replace(/\.js$/i, '');
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error('模块命名不规范');
  }
  const filePath = path.resolve(cwd, name + '.js');
  const dir = path.dirname(filePath);
  fs.ensureDirSync(dir);
  if (fs.existsSync(filePath)) {
    throw new Error(`file '${filePath}' is already exists.`);
  }
  const data = `module.exports = (app, router) => {}`;
  fs.writeFileSync(filePath, data, 'utf8');
  log.success(`写入路由文件成功 - '${filePath}'`);
}