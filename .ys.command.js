const fs = require('fs-extra');
const path = require('path');
const Commander = require('./command');

module.exports = class CommanderModule {
  constructor(thread, installer) {
    this.installer = installer;
    this.thread = thread;
  }

  static ['command:framework'](app, installer) {
    app.command('router <name>')
      .describe('创建一个新的路由')
      .action(installer.task(Commander));
  }

  ['options:plugin']() {
    return {
      enable: true,
      package: 'ys-pg-koa-router',
      agent: ['agent'],
      dependencies: []
    };
  }

  async ['life:created']({ cwd }) {
    const routerDir = path.resolve(cwd, 'app', 'router');
    const indexFilePath = path.resolve(routerDir, 'index.js');
    if (!fs.existsSync(routerDir)) {
      fs.ensureDirSync(routerDir);
      this.thread.on('beforeRollback', async () => {
        this.installer.spinner.debug('-', path.relative(process.cwd(), routerDir));
        fs.removeSync(routerDir);
        await this.installer.delay(50);
      });
    }
    if (fs.existsSync(indexFilePath)) {
      throw new Error(`file '${indexFilePath}' is already exists.`);
    }
    const data = `module.exports = (app, router) => {
    router.get('/', app.controller.index);
  }`;
    fs.writeFileSync(indexFilePath, data, 'utf8');
    this.thread.on('beforeRollback', async () => {
      this.installer.spinner.debug('-', path.relative(process.cwd(), indexFilePath));
      fs.unlinkSync(indexFilePath);
      await this.installer.delay(50);
    });
    this.installer.spinner.success('+', path.relative(process.cwd(), indexFilePath));
  }

  async ['life:destroyed']({ cwd }) {
    this.installer.spinner.warn('正在删除项目中的路由文件 ...');
    await this.installer.execScript(cwd, 'rm', '-rf', 'app/router');
    this.installer.spinner.warn('项目中的路由文件删除成功！');
    await this.installer.delay(50);
  }
}