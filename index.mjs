import { processUpload } from './upload.mjs';

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
        
    }
    
    callback(null, response);
    
    return response;
    
};