let commonLib = require('../commons/business-common');

module.exports = function (app) {

  let listRoleExist = ['admin', 'clientadmin', 'editor', 'worker'];
  let controllHandleActionRole = {};

  let Role = app.models.Role;
  let RoleMapping = app.models.RoleMapping;
  let Company = app.models.Company;
  let Project = app.models.Project;
  let User = app.models.user;

  Role.registerResolver('clientadmin', async function(role, context, cb) {

    var userId = context.accessToken.userId;
    if (!userId) return Promise.reject({code: 401, message: 'Please login with new access token!', name:"Unauthorized", details: {}});
    let resultHandle = await handleRoleClientAdmin(Role, RoleMapping, 'clientadmin', userId);
    if(!resultHandle) return Promise.reject({code: 401, message: 'User chưa được gán quyền clientadmin', name:"Unauthorized", details: {}});

    // clientadmin: only READ, WRITE, EXECUTE on his data at: Company and Project
    let accessTypeValid = ['READ', 'WRITE', 'EXECUTE'];
    let modelNameValid = ['Company', 'Project'];
    if(!accessTypeValid.includes(context.accessType)) return Promise.reject({code: 400, message: 'accessType not valid', name:"Bad Request", details: {}});
    if(!modelNameValid.includes(context.modelName)) return Promise.reject({code: 400, message: 'clientadmin: only READ, WRITE, EXECUTE on his data at: Company and Project', name:"Bad Request", details: {}});
    //pass auth
    return Promise.resolve();

  });

  Role.registerResolver('appRoles', async function(role, context, cb) {

    let userId = context.accessToken.userId;
    if (!userId) return Promise.reject({code: 401, message: 'Please login with new access token!', name:"Unauthorized", details: {}});
    // get list roles by userId
    let resultGetRoles = await commonLib.getRolesByUserId(Role, RoleMapping, userId);
    if(resultGetRoles && resultGetRoles.error) return Promise.reject({code: 500, message: resultGetRoles.message, name:"Internal Server Error", details: {}});
    let rolesName = resultGetRoles.roles;

    if(rolesName.includes('admin')){
      //pass all auth
      return Promise.resolve();
    } else {
      let resultHandle = null;
      let resultCheckAccessAndModel = null;
      for(let role of rolesName){

        switch(role) {
          case 'clientadmin':
            //handle for business role clientadmin
            let accessTypeValidClientAdmin = ['READ', 'WRITE', 'EXECUTE'];
            let modelNameValidClientAdmin = ['Company', 'Project'];
            resultCheckAccessAndModel = handleAccessTypeAndModelValid(context, accessTypeValidClientAdmin, modelNameValidClientAdmin);
            if(resultCheckAccessAndModel && resultCheckAccessAndModel.error) return Promise.reject(resultCheckAccessAndModel.detail);
            resultHandle = await handleRoleForClientAdmin(Company, Project, context, userId);
            break;
          case 'editor':
            //handle for business role editor
            let accessTypeValidEditor = ['READ', 'WRITE'];
            let modelNameValidEditor = ['Company', 'Project'];
            resultCheckAccessAndModel = handleAccessTypeAndModelValid(context, accessTypeValidEditor, modelNameValidEditor);
            if(resultCheckAccessAndModel && resultCheckAccessAndModel.error) return Promise.reject(resultCheckAccessAndModel.detail);
            resultHandle = await handleRoleForClientAdmin(Company, Project, context, userId);
            break;
          case 'worker':
            //handle for business role worker
            let accessTypeValidWorker = ['READ'];
            let modelNameValidWorker = ['Company', 'Project'];
            resultCheckAccessAndModel = handleAccessTypeAndModelValid(context, accessTypeValidWorker, modelNameValidWorker);
            if(resultCheckAccessAndModel && resultCheckAccessAndModel.error) return Promise.reject(resultCheckAccessAndModel.detail);
            resultHandle = await handleRoleForClientWorker(Company, Project, context, userId);
            break;
        }
        if(resultHandle && resultHandle.error) return Promise.reject({code: 401 , message: resultGetRoles.message, name:"Unauthorized", details: {model: resultHandle.model}});
        return Promise.resolve();
      }
    }

  });


};

function handleAccessTypeAndModelValid (context, accessTypeValid = [], modelNameValid = []) {
  if(!accessTypeValid.length || !modelNameValid.length) return {error: true , detail: {code: 400, message: `Có lỗi xảy ra!`, name:"Bad Request", details: {}}};
  if(!accessTypeValid.includes(context.accessType)) return {error: true , detail: {code: 400, message: `accessType ${context.accessType} not valid`, name:"Bad Request", details: {}}};
  if(!modelNameValid.includes(context.modelName)) return {error: true , detail: {code: 400, message: `modelNameValid ${context.modelName} not valid`, name:"Bad Request", details: {}}};
  return {error: false};
}

function handleRoleForClientWorker (Company, Project, context, userId) {
  return new Promise(async (resolve) => {
    try{

      let resultQuery = null;
      switch(context.modelName) {
        case 'Company':
          resultQuery = await Company.find({where: {'created_by.id': userId}});
          break;
        case 'Project':
          let company = await Company.findOne({where: {'created_by.id': userId}});
          if(!company || (company && !company.id)) return resolve({error: true, model: context.modelName});
          resultQuery = await Project.find({where: {and: [{'created_by.id': userId}, {companyId: company.id}]}});
          //resultQuery = await Project.find({where: {companyId: company.id}});
          break;
      }

      if(!resultQuery || (resultQuery && !resultQuery.length)) return resolve({error: true, model: context.modelName});
      return resolve({error: false});

    } catch (e) {
      console.log(e);
      return resolve({error: true, model: context.modelName});
    }
  });

}

function handleRoleForClientAdmin (Company, Project, context, userId) {
  return new Promise(async (resolve) => {
    try{

      let resultQuery = null;
      switch(context.modelName) {
          case 'Company':
            resultQuery = await Company.find({where: {'created_by.id': userId}});
            break;
          case 'Project':
            resultQuery = await Project.find({where: {'created_by.id': userId, userId}});
            break;
      }

      if(!resultQuery || (resultQuery && !resultQuery.length)) return resolve({error: true, model: context.modelName});
      return resolve({error: false});

    } catch (e) {
      console.log(e);
      return resolve({error: true, model: context.modelName});
    }
   });

}

async function handleRoleClientAdmin (Role, RoleMapping, roleName, userId) {
    try{
      let resultCheckRole = await commonLib.checkRoleMappingByRoleName(Role, RoleMapping, roleName, userId);
      if(!resultCheckRole.error) return true;
      console.error('Function handleRoleClientAdminForUser error: ', resultCheckRole.message);
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
}

function renderJsonResponseError (code, message, name, details) {
  return {
    code: code || 500,
    message: message || '',
    name: name || 'Unknown',
    details: details ||  {}
  }
}

