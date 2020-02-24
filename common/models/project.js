'use strict';
let commonLib = require('../../server/commons/business-common');

module.exports = function(Project) {

  // hook before save, auto save companyId if creator is clientadmin user
  Project.observe('before save', async function (ctx, next) {

    if(ctx.instance){

      let app =  Project.app;
      let Role = app.models.Role;
      let Company = app.models.Company;
      let RoleMapping = app.models.RoleMapping;

      let userId = ctx.options.accessToken && ctx.options.accessToken.userId ? ctx.options.accessToken.userId : '';
      if(!userId) return Promise.reject({code: 406, message: 'Pleases login with new token', name:"Method not allowed", details: {}});

      if(userId && ctx.instance.companyId){

        let resultCheckRole = await commonLib.checkRoleMappingByRoleName(Role, RoleMapping, 'clientadmin', userId);
        if(resultCheckRole && resultCheckRole.error) return Promise.reject({code: 401, message: 'User chưa được gán role clientadmin!', name:"Unauthorized ", details: {}});
        //check companyId
        let resultCheckCompanyId = await commonLib.checkCompanyId(Company, ctx.instance.companyId);
        if(resultCheckCompanyId && resultCheckCompanyId.error) return Promise.reject({code: 400, message: resultCheckCompanyId.message, name:"Bad request ", details: {}});
        resultCheckCompanyId.message
        // auto accep companyId
      } else {
        ctx.instance.companyId = '';
      }

    }
    // if function callback have async before it same next() ~ return Promise.resolve()
    return Promise.resolve();
  });

  //user.noOfProjects will be auto increase/decrease while creating/deleting a Project
  Project.observe('after save', async function (ctx, next) {

    if(ctx.instance){

      let app =  Project.app;
      let User = app.models.user;

      let userId = ctx.instance.created_by && ctx.instance.created_by.id ? ctx.instance.created_by.id : '';
      if(!userId) return Promise.reject('Error!');
      let resultCheckUser = await commonLib.checkUserId(User, userId);
      if(resultCheckUser && resultCheckUser.error) return Promise.reject(resultCheckUser.message);
      let user = resultCheckUser.user;
      user.noOfProjects += 1;
      user.save();

    }
    // if function callback have async before it same next() ~ return Promise.resolve()
    return Promise.resolve();
  });

  Project.observe('before delete', async function (ctx, next) {
    if(ctx.instance){

      let app =  Project.app;
      let User = app.models.user;

      let userId = ctx.instance.created_by && ctx.instance.created_by.id ? ctx.instance.created_by.id : '';
      if(!userId) return Promise.reject('Error!');
      let resultCheckUser = await commonLib.checkUserId(User, userId);
      if(resultCheckUser && resultCheckUser.error) return Promise.reject(resultCheckUser.message);
      let user = resultCheckUser.user;
      user.noOfProjects -= 1;
      user.save();

    }
    // if function callback have async before it same next() ~ return Promise.resolve()
    return Promise.resolve();
  });

  Project.observe('after delete', async function (ctx, next) {

    let app =  Project.app;
    let User = app.models.user;
    let userId = ctx.options.accessToken && ctx.options.accessToken.userId ? ctx.options.accessToken.userId : '';
    if(!userId) return Promise.reject('Error!');
    let resultCheckUser = await commonLib.checkUserId(User, userId);
    if(resultCheckUser && resultCheckUser.error) return Promise.reject(resultCheckUser.message);
    let user = resultCheckUser.user;
    user.noOfProjects -= 1;
    user.save();
    console.log('Deleted %s matching %j', ctx.Model.pluralModelName, ctx.where);
    return Promise.resolve();

  });

};
