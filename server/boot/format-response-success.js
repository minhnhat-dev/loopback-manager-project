module.exports = function(server) {

  var remotes = server.remotes();
  remotes.after('**', function (ctx, next) {
    ctx.result = {
      data: ctx.result
    };
    next();
  });

};
