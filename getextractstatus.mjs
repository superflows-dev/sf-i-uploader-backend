import { DOC_DIR, TextractClient, GetDocumentTextDetectionCommand, DetectDocumentTextCommand, GetItemCommand, StartDocumentTextDetectionCommand, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { processParseDocument } from './parsedocument.mjs';
import { processExtractDocument } from './extractdocument.mjs';
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
    
    var getParams = {
        TableName: TABLE,
        Key: {
          id: { S: jobId },
        },
    };
    
    async function ddbGet (getParams) {
        try {
          const data = await ddbClient.send(new GetItemCommand(getParams));
          return data;
        } catch (err) {
          return err;
        }
    };
    
    var resultGet = await ddbGet(getParams);
    
    if(resultGet.Item != null) {
        
        if(resultGet.Item.arrwords != null) {
            
            if(resultGet.Item.doctype != null) {
                
                const docType = resultGet.Item.doctype.S;
            
                const response = {statusCode: 200, body: {result: true, status: "SUCCEEDED", arrWords: resultGet.Item.arrwords, arrWordsMeta: resultGet.Item.arrmeta}};
                
                if(docType != "") {
                    
                    if(DOC_DIR[docType] != null) {
                        
                        response.body.documentParsed = processParseDocument(JSON.parse(resultGet.Item.arrwords.S), docType);
                        if(response.body.documentParsed) {
                            response.body.possibleMatches = processExtractDocument(JSON.parse(resultGet.Item.arrwords.S), docType);
                        }
                        
                    }
                        
                }
                
                processAddLog(userId, 'getextractstatus', event, response, response.statusCode)
                return response;
                
            } else {
                
                const response = {statusCode: 200, body: {result: true, status: "SUCCEEDED", arrWords: resultGet.Item.arrwords, arrWordsMeta: resultGet.Item.arrmeta}};
                processAddLog(userId, 'getextractstatus', event, response, response.statusCode)
                return response;
                
            }
            
            
            
            
        } else {
            
            const response = {statusCode: 200, body: {result: true, status: "IN_PROGRESS"}};
            processAddLog(userId, 'getextractstatus', event, response, response.statusCode)
            return response;
            
        }
        
    } else {
        
        const response = {statusCode: 200, body: {result: true, status: "IN_PROGRESS"}};
        processAddLog(userId, 'getextractstatus', event, response, response.statusCode)
        return response;
        
    }
    
    
}