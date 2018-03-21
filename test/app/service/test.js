const framework = require('ys-fw-koa');

module.exports = class test extends framework.Base {
  constructor(ctx) {
    super(ctx);
  }

  value() {
    return 'world';
  }

  hello() {
    return `hello ${this.value()}`;
  }
}