import { DOC_DIR, TextractClient, GetDocumentTextDetectionCommand, DetectDocumentTextCommand, GetItemCommand, StartDocumentTextDetectionCommand, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand, MESSAGE_DIR, VERIFY_DIR } from "./globals.mjs";
import { processAddLog } from './addlog.mjs';
import { processAuthenticate } from './authenticate.mjs';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const processGetMessage = async (event) => {
    
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

    var doctype = null;
    
    try {
        doctype = JSON.parse(event.body).docType;
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        //processAddLog(userId, 'upload', event, response, response.statusCode)
        return response;
    }
    
    if(doctype == null || doctype == "" || doctype.length < 1) {
        const response = {statusCode: 400, body: {result: false, error: "DocType is not valid!"}}
      // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    
    let messageArr = MESSAGE_DIR[doctype];
    let verifyArr = DOC_DIR[doctype];
    let matchArr = VERIFY_DIR[doctype];
    
    if(messageArr == null || messageArr.length < 1 || verifyArr == null || verifyArr.length < 1 || matchArr == null){
        
        const response = {statusCode: 400, body: {result: false, error: "DocType not found!"}}
        processAddLog(userId, 'getmessagebydoctype', event, response, response.statusCode)
        return response;
        
    }else{
        const response = {statusCode: 200, body: {result: true, message: messageArr[0], verify: verifyArr, match: matchArr}};
        processAddLog(userId, 'getmessagebydoctype', event, response, response.statusCode)
        return response;
    }
    
}