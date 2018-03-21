module.exports = app => {
  return async ctx => {
    const { service } = ctx;
    ctx.body = service.test.hello();
  }
}