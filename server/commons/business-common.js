'use strict'

module.exports = {

  checkRoleMappingByRoleName: (Role, RoleMapping, roleName, userId) => {
    return new Promise((resolve) => {
      try{
        Role.findOne({where: {name: roleName}}, function (error, roles) {
          if ( error ) return resolve({error: true, message: 'Có lỗi trong quá trình xử lý'});
          if (!roles || (roles && !roles.id) ) return resolve({error: true, message: `Chưa tồn tại role name: ${roleName}`});

          RoleMapping.findOne({ where: { principalId: userId, roleId: roles.id} }, function (error, roleMapping) {
            if(error) return resolve({error: true, message: 'Có lỗi trong quá trình xử lý'});
            if (!roleMapping || (roleMapping && !roleMapping.id) ) return resolve({error: true, message: `User chưa được gán role : ${roleName}`});
            return resolve({error: false});
          });
        })

      } catch (e) {
        console.log(e);
        return resolve({error: true});
      }
    });
  },

  checkCompanyId: (Company, companyId) => {
    return new Promise((resolve) => {
      try{
        Company.findById(companyId, function (err, company) {
          if (err) return resolve({error: true, message: 'Có lỗi xảy ra trong quá trình xử lý!'});
          if(!company || (company && !company.id)) return resolve({error: true, message: 'CompanyId not valid!'});
          return resolve({error: false});
        });
      } catch (e) {
        console.error(e);
        return resolve({error: true});
      }
    });
  },

  checkUserId: (User, userId) => {
    return new Promise((resolve) => {
      try{
        User.findById(userId, function (err, user) {
          if (err) return resolve({error: true, message: 'Có lỗi xảy ra trong quá trình xử lý!'});
          if(!user || (user && !user.id)) return resolve({error: true, message: 'User not valid!'});
          return resolve({error: false, user});
        });
      } catch (e) {
        console.error(e);
        return resolve({error: true});
      }
    });
  },

  getRolesByUserId: (Role, RoleMapping, userId) => {
    return new Promise((resolve) => {
        try{
          RoleMapping.find({ where: { principalId: userId} }, function (error, roleMapping) {
            if(error) return resolve({error: true, message: 'Find role mapping error!'});
            if(roleMapping && roleMapping.length) {
              let roleIds = roleMapping.map(item => item.roleId);
              Role.find({where: {id: {inq: roleIds}}}, function (error, roles) {
                if(error) return resolve({error: true, message: 'Find role error!'});
                if(roles && roles.length){
                  let rolesName = roles.map(item => item.name);
                  return resolve({error: false, roles: rolesName});
                } else {
                  return resolve({error: false, roles: []});
                }
              });
            } else {
              return resolve({error: false, roles: []});
            }
          });
        } catch (e) {
          console.error(e);
          return resolve({error: true});
        }
     });
  }

};
