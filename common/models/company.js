'use strict';

module.exports = function(Company) {

  //assign a user to be an employee of a company
  Company.assignCreatedByUserToCompany = function (userId, companyId, callback) {
    Company.findById(companyId, function (err, company) {
      if (err) return callback(err);
      if(!company || (company && !company.id)) return callback(null, {error: true, message: 'Company not found!'});

      if(company.created_by && company.created_by.id){
        company.created_by.id = userId;
      } else {
        company.created_by = {id: userId};
      }
      company.save();
      return callback(null, {error: false, message: 'Assign Success!'});
    });
  };

  Company.remoteMethod('assignCreatedByUserToCompany', {
    accepts: [
      {arg: 'userId', type: 'string'},
      {arg: 'companyId', type: 'string'}
    ],
    returns: [{arg: 'error', type: 'boolean'}, {arg: 'message', type: 'string'}],
    http: {path: '/assign-user-to-company', verb: 'post'}
  });

  // get list project of company
  Company.getProjects = function (companyId, callback) {
    let app =  Company.app;
    let Project = app.models.Project;
    Project.find({where: {'companyId': companyId}}, function (error, projects) {
      if (error) return callback(error);
      return callback(null, {error: false, items: projects});
    })
  };

  Company.remoteMethod('getProjects', {
    accepts: [
      {arg: 'id', type: 'string', http: {source: 'query'}}
    ],
    returns: [{arg: 'error', type: 'boolean'}, {arg: 'items', type: 'array'}],
    http: {path: '/get-projects/:id', verb: 'get'}
  });
};
