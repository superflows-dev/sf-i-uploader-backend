// getunmappedevents (projectid)

import { kmsClient, DecryptCommand, KMS_KEY_REGISTER } from "./globals.mjs";

function text2Binary(string) {
    return string.split('').map(function (char) {
        return char.charCodeAt(0).toString(2);
    }).join(' ');
}

export const processKmsDecrypt = async (projectid, plaintext) => {


    var input;

    
    try {
    
        input = {
          "KeyId": JSON.parse(process.env.KMS_KEY_REGISTER)[projectid],
          "CiphertextBlob": Buffer.from(plaintext, 'base64')
          
        };
    
    } catch {
        
        return "Error";
        
    }
     
    const command = new DecryptCommand(input);
    
    try {
    
        const response = await kmsClient.send(command);  
        console.log(response);
        return new Buffer.from(response.Plaintext, 'binary').toString('utf-8');
        
    } catch (err) {
        
        return err + "";
        
    }
    
}