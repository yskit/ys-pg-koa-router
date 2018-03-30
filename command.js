const fs = require('fs-extra');
const path = require('path');

module.exports = class CommanderModule {
  constructor(thread, installer) {
    this.installer = installer;
    this.thread = thread;
  }

  addFile(cwd, name) {
    name = name.replace(/\.js$/i, '');
    if (!/^[a-z][a-z0-9_/]*$/.test(name)) {
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
    this.thread.on('beforeRollback', async () => {
      this.installer.spinner.debug('-', path.relative(process.cwd(), filePath));
      fs.unlinkSync(filePath);
      await this.installer.delay(50);
    });
    this.installer.spinner.success('+', path.relative(process.cwd(), filePath));
  }

  async render(name) {
    const root = this.installer.root;
    const type = this.installer.type;
    if (!root || type !== 'framework') {
      throw new Error('非项目目录无法使用此命令');
    }
    const relativePath = path.relative(root, process.cwd());
    const routerPath = path.resolve(root, 'app/router');
    const isInRouterDir = relativePath.indexOf('app/router') === 0;
    if (isInRouterDir) {
      return this.addFile(process.cwd(), name);
    }
    this.addFile(routerPath, name);
  }
}