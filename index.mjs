import { processUpload } from './upload.mjs';
import { processGetMeta } from './getmeta.mjs';
import { processGet } from './get.mjs';
import { processGetExtract } from './getextract.mjs';
import { processGetExtractStatus } from './getextractstatus.mjs';

export const handler = async (event, context, callback) => {
    
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : '*',
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, Access-Control-Allow-Credentials, Content-Type, isBase64Encoded, x-requested-with",
        "Access-Control-Allow-Credentials" : true,
        'Content-Type': 'application/json',
        "isBase64Encoded": false
      },
    };
    
    if(event["httpMethod"] == "OPTIONS") {
      callback(null, response);
      return;
    }
    
    switch(event["path"]) {
      
        case "/upload":
          const resultUpload = await processUpload(event);
          response.body = JSON.stringify(resultUpload.body);
          response.statusCode = resultUpload.statusCode;
        break;
        
        case "/getmeta":
          const resultGetMeta = await processGetMeta(event);
          response.body = JSON.stringify(resultGetMeta.body);
          response.statusCode = resultGetMeta.statusCode;
        break;
        
        case "/get":
          const resultGet = await processGet(event);
          response.body = JSON.stringify(resultGet.body);
          response.statusCode = resultGet.statusCode;
        break;
        
        case "/getextract":
          const resultGetExtract = await processGetExtract(event);
          response.body = JSON.stringify(resultGetExtract.body);
          response.statusCode = resultGetExtract.statusCode;
        break;
        
        case "/getextractstatus":
          const resultGetExtractStatus = await processGetExtractStatus(event);
          response.body = JSON.stringify(resultGetExtractStatus.body);
          response.statusCode = resultGetExtractStatus.statusCode;
        break;
        
    }
    
    callback(null, response);
    
    return response;
    
};