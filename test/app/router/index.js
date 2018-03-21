module.exports = (app, router) => {
  router.get('/', app.controller.hello);
}