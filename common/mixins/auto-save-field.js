'use strict';

module.exports = function(Model, options) {

  Model.observe('before save', function (ctx, next) {

    if (ctx.instance) {
      let userId = ctx.options.accessToken && ctx.options.accessToken.userId ? ctx.options.accessToken.userId : '';
      if(!userId) return next();
      if(!ctx.instance.created_at) ctx.instance.created_at = Date.now();
      if(ctx.instance.created_by && !ctx.instance.created_by.hasOwnProperty('id')) ctx.instance.created_by.id = userId;
      ctx.instance.modified_at = Date.now();
      if(ctx.instance.modified_by) ctx.instance.modified_by.id = userId;
    }
    next();
  });
};
