import { KMS_KEY_REGISTER, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processKmsDecrypt } from './kmsdecrypt.mjs';
import { processDecryptData } from './decryptdata.mjs';
import { getMimeFromExtension } from './getMimeFromExtension.mjs';
import { processAddLog } from './addlog.mjs';

export const processGet = async (event) => {
    
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

    var key = null;
    
    try {
        key = JSON.parse(event.body).key;
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        //processAddLog(userId, 'upload', event, response, response.statusCode)
        return response;
    }
    
    if(key == null || key == "" || key.length < 1) {
        const response = {statusCode: 400, body: {result: false, error: "Key is not valid!"}}
       // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    
    const manifest = key + '/manifest.json';
    
    let command = new GetObjectAttributesCommand({
      Bucket: S3_BUCKET,
      Key: manifest,
      ObjectAttributes: ["ObjectSize"],
    });
    
    try {
        const response = await s3Client.send(command);
        //console.log(response.httpStatusCode);
    } catch (err) {
        console.error(err);
        const response = {statusCode: 404, body: {result: false, error: "Key not present!"}}
        processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    
    command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: manifest
    });
    
    let jsonContent = {}
    try {
        const response = await s3Client.send(command);
        const s3ResponseStream = response.Body;
        const chunks = []
        for await (const chunk of s3ResponseStream) {
            chunks.push(chunk)
        }
        const responseBuffer = Buffer.concat(chunks)
        jsonContent = JSON.parse(responseBuffer.toString());
    } catch (err) {
        console.error(err);
        const response = {statusCode: 404, body: {result: false, error: "Key not present!"}}
        processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    
    const numblocks = jsonContent.numblocks
    const ext = jsonContent.ext;
    
    console.log('ext', ext);
    
    let isTruncated = false;
    let nextToken = null;
    let allKeys = [];
    
    do {
        
        if(!isTruncated) {
            
            command = new ListObjectsV2Command({
              Bucket: S3_BUCKET,
              Prefix: key
            });
            
        } else {
            
            command = new ListObjectsV2Command({
              Bucket: S3_BUCKET,
              Prefix: key,
              NextContinuationToken: nextToken
            });
            
        }
        
        const response = await s3Client.send(command);
        allKeys.push(...response.Contents)
    
        if(response.IsTruncated) {
            nextToken = response.NextContinuationToken;
        }
        isTruncated = response.isTruncated;
        
    } while (isTruncated)
    
    for(var i = 0; i < allKeys.length; i++) {
        
        if(allKeys[i].Key.indexOf(key + "_" + "full." + ext) >= 0) {
            allKeys.splice(i, 1);
            break;
        }
        
    }
    
    const numdatafiles = allKeys.length - 1;
    const percentageComplete = parseInt((100*numdatafiles)/numblocks)
    
    if(percentageComplete >= 100) {
        
        
        console.log('allKeys', allKeys);
        
        const blocks = [];
        for(var i = 0; i < allKeys.length - 1; i++) {
            
            command = new GetObjectCommand({
              Bucket: S3_BUCKET,
              Key: key + '/' + i + '.dat'
            });
            
            let strContent = "";
            try {
                const response = await s3Client.send(command);
                const s3ResponseStream = response.Body;
                const chunks = [];
                for await (const chunk of s3ResponseStream) {
                    chunks.push(chunk)
                }
                const responseBuffer = Buffer.concat(chunks)
                strContent = responseBuffer.toString();
                
                // console.log('strcontent', strContent);
                
                var projectid = null;
        
                try {
                    projectid = JSON.parse(event.body).projectid.trim();
                } catch (e) {
                    
                }
                console.log('projectid', projectid)
                if(projectid != null) {
                    
                    if(strContent.indexOf("::") >= 0) {
                        console.log('here 1', Object.keys(KMS_KEY_REGISTER), KMS_KEY_REGISTER[projectid])
                        if(KMS_KEY_REGISTER[projectid] != null) {
                            console.log('decrypting 1')
                            strContent = await processDecryptData(projectid, strContent);
                        }
                                        
                    } else {
                        console.log('here 2', KMS_KEY_REGISTER[projectid] )
                        if(KMS_KEY_REGISTER[projectid] != null) {
                            console.log('decrypting 2')
                            const text = await processKmsDecrypt(projectid, strContent);
                            strContent = text.toLowerCase().indexOf('error') >= 0 ? strContent : text;
                        }
                        
                    }
                    
                }
                
                blocks.push(strContent);
            } catch (err) {
                console.error(err);
            }
            
        }
        
        // console.log(blocks[blocks.length - 1]);
        const response = {statusCode: 200, body: {result: true, ext: ext, data: blocks.join('')}};
        // processAddLog(userId, 'get', event, response, response.statusCode)
        return response;
        
    } else {
    
        const response = {statusCode: 422, body: {result: false, error: "File is not uploaded properly!", percentageComplete: percentageComplete, keys: allKeys}};
        processAddLog(userId, 'get', event, response, response.statusCode)
        return response;
    
    }
    
}