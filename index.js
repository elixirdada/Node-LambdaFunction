'use strict';

const AWS = require('aws-sdk');
var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
var CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
var CognitoUserAttribute = AmazonCognitoIdentity.CognitoUserAttribute;
const CognitoIdentityService = new AWS.CognitoIdentityServiceProvider();

exports.handler = function(event, context, callback) {

  // Define AWS Cognito User Pool
  var paramsGetUser = {
    UserPoolId: process.env.UserPoolId
  };

  var paramsAddUser = {
    UserPoolId: process.env.UserPoolId,
    ClientId: process.env.ClientId
  };

  let _body = {};
  if (event.body) {
    _body = JSON.parse(event.body);
  }

  // set logic for proxied API path
  if (event.resource === '/users' && event.httpMethod === 'GET') {
    CognitoIdentityService.listUsers(paramsGetUser, (err, data) => {
      if (!err) {
        return callback(null, buildOutput(200, data));
      } else {
        return callback(buildOutput(500, err), null);
      }
    });
  } else if (event.resource === '/users' && event.httpMethod === 'POST') {

    var userPool = new CognitoUserPool(paramsAddUser);
    // Create User via AWS Cognito
    var attributeList = infoNewUser(_body);
    userPool.signUp(_body.username, _body.password, attributeList, null, function(err, result) {
      if(err) {
        return callback( buildOutput(500, err), null );
      } else {
        var cognitoUser = result.user.username;
        return callback( null, buildOutput(200, cognitoUser) );
      }
    });
  } else if (event.resource === '/users' && event.httpMethod === 'PUT') {
    const cognitoIdServiceProvider = new AWS.CognitoIdentityServiceProvider({
      region: process.env.Region
    });
      
    var paramsEditUser =  {
      UserAttributes: _body.updatedData,
      UserPoolId: process.env.UserPoolId,
      Username: _body.curUserName
    }
    
    cognitoIdServiceProvider.adminUpdateUserAttributes(paramsEditUser, function(err, data) {
      if (!err) {
        return callback(null, buildOutput(200, data));
      } else {
        return callback(buildOutput(500, err.stack), null);
      }
    });
  } else if (event.resource === '/users' && event.httpMethod === 'DELETE') {
    const cognitoIdServiceProvider = new AWS.CognitoIdentityServiceProvider({
      region: process.env.Region
    });
      
    var paramsDelUser =  {
      UserPoolId: process.env.UserPoolId,
      Username: _body.curUserName
    }
    
    cognitoIdServiceProvider.adminDeleteUser(paramsDelUser, function(err, data) {
      if (!err) {
        return callback(null, buildOutput(200, data));
      } else {
        return callback(buildOutput(500, err.stack), null);
      }
    });
  } else{
    return callback(buildOutput(500, event), null);
  }
};

/**
 * for creating new User
 */
function infoNewUser(_body) {
  // Define User Attributes
  var attributeList = [];

  // user attributes
  var dataEmail = {
    Name: "email",
    Value: _body.mail
  };
  var phoneNumber = {
    Name: "phone_number",
    Value: _body.phoneNumber
  };
  var role = {
    Name: "custom:role",
    Value: _body.role
  };
  var client_id = {
    Name: "custom:client_id",
    Value: _body.client_id
  };
  var admin_id = {
    Name: "custom:admin_id",
    Value: _body.admin_id
  };

  var attributeEmail = new CognitoUserAttribute(dataEmail);
  var attributePhone = new CognitoUserAttribute(phoneNumber);
  var attributeRole = new CognitoUserAttribute(role); //admin or user
  var attributeClientId = new CognitoUserAttribute(client_id);
  var attributeAdminId = new CognitoUserAttribute(admin_id);

  attributeList.push(attributeEmail);
  attributeList.push(attributePhone);
  attributeList.push(attributeRole);
  attributeList.push(attributeClientId);
  attributeList.push(attributeAdminId);

  return attributeList;
}

/**
 * Constructs the appropriate HTTP response.
 * @param {integer} statusCode - HTTP status code for the response.
 * @param {JSON} data - Result body to return in the response.
 * buildOutput(200, data)
 */
function buildOutput(statusCode, data) {

  let _response = {
    statusCode: statusCode,
    headers: {
        'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };

  return _response;
};