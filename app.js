const Router = require('koa-router');
const fs = require('fs');
const path = require('path');
const util = require('ys-utils');
const debug = require('debug')('pg-koa-router');

module.exports = (app, configs) => {
  app.on('serverRouterWrapped', () => {
    const routerPath = path.resolve(app.options.baseDir, 'app/router');
    if (!fs.existsSync(routerPath)) {
      throw new Error(`router of '${routerPath}' must be exists`);
    }
    app.router = loadRoutesModules(routerPath, app, configs);
    debug(`  - [${app.pid}]`, '[`ys-pg-koa-router`:app] Routers Loaded: ' + routerPath);
    app.koa.use(app.router.routes());
    app.koa.use(app.router.allowedMethods());
  });
};

function loadRoutesModules(dir, inject, configs) {
  return load(dir);

  function load(dir, name, route) {
    if (!fs.existsSync(dir)) return;
    const { files, dirs } = collectDirs(dir);
    const indexRouter = files['index.js'];
    const router = parse(inject, indexRouter, configs);
    for (const i in files) {
      if ('index.js' === i) continue;
      const _router = parse(inject, files[i], configs);
      router.use('/' + replacePrefix(i), _router.routes(), _router.allowedMethods());
    }
    for (const j in dirs) load(dirs[j], j, router);
    if (name) route.use('/' + name, router.routes(), router.allowedMethods());
    return router;
  }
}

function collectDirs(dir) {
  const files = fs.readdirSync(dir);
  const _files = {};
  const _dirs = {};

  files.forEach(file => {
    const _path = path.resolve(dir, file);
    if (fs.statSync(_path).isDirectory()) {
      _dirs[file] = _path;
    } else {
      _files[file] = _path;
    }
  });

  return {
    files: _files,
    dirs: _dirs
  }
}

function parse(inject, file, configs) {
  if (!file) return new Router(configs);
  const modal = util.file.load(file);
  const router = new Router(configs);
  modal(inject, router);
  return router;
}

function replacePrefix(d) {
  return d.replace(/\.js$/, '');
}