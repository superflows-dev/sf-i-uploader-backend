import { TextractClient, GetDocumentTextDetectionCommand, DetectDocumentTextCommand, StartDocumentTextDetectionCommand, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { getMimeFromExtension } from './getMimeFromExtension.mjs';
import { processAddLog } from './addlog.mjs';
import { processGet } from './get.mjs';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const processGetExtract = async (event) => {
    
    // if((event["headers"]["Authorization"]) == null) {
    //     return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    // }
    
    // if((event["headers"]["Authorization"].split(" ")[1]) == null) {
    //     return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    // }
    
    // var hAscii = Buffer.from((event["headers"]["Authorization"].split(" ")[1] + ""), 'base64').toString('ascii');
    
    // if(hAscii.split(":")[1] == null) {
    //     return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    // }
    
    // const email = hAscii.split(":")[0];
    // const accessToken = hAscii.split(":")[1];
    
    // if(email == "" || !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
    //     return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    // }
    
    // if(accessToken.length < 5) {
    //     return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    // }
    
    // const authResult = await processAuthenticate(event["headers"]["Authorization"]);
    
    // if(!authResult.result) {
    //     return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
    // }
    
    // const userId = authResult.userId;
    
    const userId = "1234";

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
    
    const responseGet = await processGet(event);
    
    // console.log((responseGet.body));
    
    var ext = "";
    
    if(responseGet.body.data.indexOf('pdf') >= 0) {
        
        ext = "pdf";
        
    } else if(responseGet.body.data.indexOf('png') >= 0|| 
    responseGet.body.data.indexOf('PNG') >= 0) {
        
        ext = "png";
        
    } else if(responseGet.body.data.indexOf('jpg') >= 0 || 
    responseGet.body.data.indexOf('jpeg') >= 0 || 
    responseGet.body.data.indexOf('JPG') >= 0 || 
    responseGet.body.data.indexOf('JPEG') >= 0) {
         
        ext = "jpg";
        
    }
    
    console.log('ext found', ext);
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key + "_" + "full." + ext,
      Body: Buffer.from(responseGet.body.data.split(',')[1], 'base64'),
      ContentEncoding: 'base64',
      ContentType:  ext == "jpg" ? "image/jpeg" : ext == "png" ? "image/png" : 'application/pdf'
    });
    
    console.log({
      Bucket: S3_BUCKET,
      Key: key + "_" + "full." + ext,
    });
    
    try {
      const response = await s3Client.send(command);
      console.log(response);
    } catch (err) {
      console.error(err);
    }
    
    const txClient = new TextractClient();
    const input = { // DetectDocumentTextRequest
      DocumentLocation: { // Document
        "S3Object": {
            "Bucket": S3_BUCKET,
            "Name": key + "_" + "full." + ext
        }
      },
    };
    
    const command1 = new StartDocumentTextDetectionCommand(input);
    const response1 = await txClient.send(command1);
    
    const jobId = response1.JobId;
    
    // console.log('jobid', jobId);
    
    const response = {statusCode: 200, body: {result: true, jobId: jobId}};
    processAddLog(userId, 'getextract', event, response, response.statusCode)
    return response;
    // return responseGet;
    
    
}