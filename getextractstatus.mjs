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

export const processGetExtractStatus = async (event) => {
    
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

    var jobId = null;
    
    try {
        jobId = JSON.parse(event.body).jobid;
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        //processAddLog(userId, 'upload', event, response, response.statusCode)
        return response;
    }
    
    if(jobId == null || jobId == "" || jobId.length < 1) {
        const response = {statusCode: 400, body: {result: false, error: "JobId is not valid!"}}
       // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    
    // console.log(response1);
    // console.log(jobId);
    
    const input2 = {
        "JobId": jobId
    }
    
    // sleep(5000);
    
    const txClient = new TextractClient();
    const command2 = new GetDocumentTextDetectionCommand(input2);
    const response2 = await txClient.send(command2);
    
    console.log(response2.JobStatus);
    
    if(response2.JobStatus == "SUCCEEDED") {
      console.log(response2.Blocks.length);
    }
    
    
    // return response1;
    // return response;
    
    const response = {statusCode: 200, body: {result: true, status: response2}};
    processAddLog(userId, 'getextract', event, response, response.statusCode)
    return response;
    
    
}