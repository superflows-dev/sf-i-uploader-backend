import { PutObjectCommand, s3Client } from './globals.mjs';

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
    
    const command = new PutObjectCommand({
      Bucket: "flagggrc-complianceuploads1684312618859-uploads",
      Key: "hello-s5.txt",
      Body: "Hello S3!",
    });
  
    try {
      const response = await s3Client.send(command);
      console.log(response);
    } catch (err) {
      console.error(err);
    }
    
    
    response.body = "hello";
    callback(null, response);
    
    return response;
};