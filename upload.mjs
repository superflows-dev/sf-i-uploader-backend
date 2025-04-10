import { KMS_KEY_REGISTER, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { processKmsEncrypt } from './kmsencrypt.mjs';
import { processEncryptData } from './encryptdata.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { checkForScripts } from './checkforscripts.mjs';
export const processUpload = async (event) => {
    
    if((event["headers"]["Authorization"]) == null) {
        return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    }
    
    if((event["headers"]["Authorization"].split(" ")[1]) == null) {
        return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    }
    
    var hAscii = Buffer.from((event["headers"]["Authorization"].split(" ")[1] + ""), 'base64').toString('ascii');
    
    if(hAscii.split(":")[1] == null) {
        return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    }
    
    const email = hAscii.split(":")[0];
    const accessToken = hAscii.split(":")[1];
    
    if(email == "" || !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    }
    
    if(accessToken.length < 5) {
        return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    }
    
    const authResult = await processAuthenticate(event["headers"]["Authorization"]);
    
    if(!authResult.result) {
        return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
    }
    
    const userId = authResult.userId;
    
    // const userId = "1234";
    
    var data = null;
    var ext = null;
    var type = null;
    var key = null;
    var numblocks = null;
    var block = null;
    
    try {
        data = JSON.parse(event.body).data;
        ext = JSON.parse(event.body).ext;
        type = JSON.parse(event.body).type;
        key = JSON.parse(event.body).key;
        numblocks = JSON.parse(event.body).numblocks;
        block = JSON.parse(event.body).block;
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        //processAddLog(userId, 'upload', event, response, response.statusCode)
        return response;
    }
    
    if(type == null || type == "" || type.length < 1) {
        const response = {statusCode: 400, body: {result: false, error: "Type is not valid!"}}
       // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    
    if(key == null || key == "" || key.length < 1) {
        const response = {statusCode: 400, body: {result: false, error: "Key is not valid!"}}
       // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    
    if(type == RECORD_TYPE_META) {
        
        if(numblocks == null || parseInt(numblocks + "") <= 0) {
            const response = {statusCode: 400, body: {result: false, error: "Numblocks is not valid!"}}
           // processAddLog(userId, 'detail', event, response, response.statusCode)
            return response;
        }
        
        if(ext == null || ext == "" || ext.length < 1) {
            const response = {statusCode: 400, body: {result: false, error: "Extension is not valid!"}}
           // processAddLog(userId, 'detail', event, response, response.statusCode)
            return response;
        }
        
        
        const command = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key + "/manifest.json",
          Body: JSON.stringify({ext: ext, numblocks: numblocks}),
          ContentType: 'application/json'
        });
        
        try {
          const response = await s3Client.send(command);
          console.log(response);
        } catch (err) {
          console.error(err);
          const response = {statusCode: 400, body: {result: false, error: "Object storage error"}}
          return response
        }
        
    }
    
    var encKey = "";
    var project = "";
    var norData = null;
    var encData = null;
    var insert = null;
    
    if(type == RECORD_TYPE_DATA) {
        
        if(data == null || data == "" || data.length <= 0 || checkForScripts(data)) {
            const response = {statusCode: 400, body: {result: false, error: "Data is not valid!"}}
           // processAddLog(userId, 'detail', event, response, response.statusCode)
            return response;
        }
        
        if(block == null || parseInt(block + "") < 0) {
            const response = {statusCode: 400, body: {result: false, error: "Block is not valid!"}}
           // processAddLog(userId, 'detail', event, response, response.statusCode)
            return response;
        }
        
        var projectid = null;
        
        try {
            projectid = JSON.parse(event.body).projectid;
        } catch (e) {
            
        }
        
        norData = data;
        
        var strDataEncrypt = "";
        
        project = projectid;
        
        if(projectid != null) {
            if(KMS_KEY_REGISTER[projectid] != null) {
                strDataEncrypt = await processEncryptData(projectid, data);
                // encKey = KMS_KEY_REGISTER[projectid];
                // strDataEncrypt = await processKmsEncrypt(projectid, data);
            } else {
                strDataEncrypt = data;
            }
        } else {
            strDataEncrypt = data;
        }
        
        encData = strDataEncrypt;
        
        const command = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key + "/" + block + ".dat",
          Body: strDataEncrypt,
        });
        
        try {
          const response = await s3Client.send(command);
          insert = response;
          console.log(response);
        } catch (err) {
          console.error(err);
        }
           
    }
    
    
    const response = {statusCode: 200, body: {result: true, key: key, encKey: encKey, project: project, normalData: norData, encData: encData, insert: insert}};
    processAddLog(userId, 'upload', event, response, response.statusCode)
    return response;

}