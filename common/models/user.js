'use strict';
var app = require('../../server/server');

module.exports = function(User, app) {

  User.observe('loaded', function logQuery(ctx, next) {
    if(ctx.instance) console.log('RETURNING %j', ctx.instance);
    next();
  });

  // hook after login
  User.afterRemote('login', (ctx, user, next) => {
    let userId = user.userId || '';
    if(!userId) throw new Error('User not auth!');
    let app =  User.app;
    let Role = app.models.Role;
    let RoleMapping = app.models.RoleMapping;

    RoleMapping.find({ where: { principalId: userId} }, function (error, roleMapping) {

      if(error) throw  new Error('Find role mapping error!');
      if(roleMapping && roleMapping.length){
        let roleIds = roleMapping.map(item => item.roleId);
        Role.find({where: {id: {inq: roleIds}}}, function (error, roles) {
          if(error) throw  new Error('Find role error!');
          if(roles && roles.length) user.roles = roles.map(item => item.name);
          next();
        });
      } else {
        user.roles = [];
        next();
      }

    });
  });

  User.assignUserToCompany = function (userId, companyId, callback) {
    User.findById(userId, function (err, user) {
      if (err) return callback(err);
      if(!user || (user && !user.id)) return callback(null, {error: true, message: 'User not found!'});
      user.companyId = companyId;
      user.save();
      return callback(null, {error: false, message: 'Assign Success!'});
    });
  };

  User.remoteMethod('assignUserToCompany', {
    accepts: [
      {arg: 'userId', type: 'string'},
      {arg: 'companyId', type: 'string'}
    ],
    returns: [{arg: 'error', type: 'boolean'}, {arg: 'message', type: 'string'}],
    http: {path: '/assign-user-to-company', verb: 'post'}
  });

  User.getProjects = function (userId, callback) {
    var app =  User.app;
    var Project = app.models.Project;
    Project.find({where: {'created_by.id': userId}}, function (error, projects) {
      if (error) return callback(error);
      return callback(null, {error: false, items: projects});
    })
  };

  User.remoteMethod('getProjects', {
    accepts: [
      {arg: 'id', type: 'string', http: {source: 'query'}}
    ],
    returns: [{arg: 'error', type: 'boolean'}, {arg: 'items', type: 'array'}],
    http: {path: '/get-projects/:id', verb: 'get'}
  });

  User.assignRoleForUser = function (roleId, userId, callback) {

    let app =  User.app;
    let Role = app.models.Role;
    let RoleMapping = app.models.RoleMapping;

    User.findById(userId, function (err, user) {

      if (err) return callback(err);
      if(!user || (user && !user.id)) return callback(null, {error: true, message: 'User not found!'});

      Role.findOne({where: {id: roleId}}, function (err, role) {

        if(err) return callback(null, {error: true, message: 'Error when get role!'});
        if(!role) return callback(null, {error: true, message: 'Role id not found!'});

        RoleMapping.findOne({where: {principalId: userId, roleId: roleId }}, function (err, mappingRole) {

          if(err) return callback(null, {error: true, message: 'Error when get role mapping!'});
          if(mappingRole && mappingRole.principalId) return callback(null, {error: false, message: 'User assigned role!'});

          role.principals.create({
            principalType: RoleMapping.USER,
            principalId: user.id
          }, function(err, principal) {
            if (err) return callback(null, {error: true, message: 'Create RoleMapping fail!'});
            callback(null, {error: false, message: 'Create RoleMapping success!'});
          });

        })
      })
    });
  };

  User.remoteMethod('assignRoleForUser', {
    accepts: [
      {arg: 'roleId', type: 'string'},
      {arg: 'userId', type: 'string'}
    ],
    returns: [{arg: 'error', type: 'boolean'}, {arg: 'message', type: 'string'}],
    http: {path: '/assign-role-for-user', verb: 'post'}
  });

};
