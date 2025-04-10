import { kmsClient, EncryptCommand } from "./globals.mjs";

export const processKmsEncrypt = async (projectid, plaintext) => {
    
    const input = {
      "KeyId": JSON.parse(process.env.KMS_KEY_REGISTER)[projectid],
      "Plaintext": Buffer.from(plaintext, 'utf-8')
    };
    
    console.log(input)
    
    const command = new EncryptCommand(input);
    
    try {
    
        const response = await kmsClient.send(command);    
        console.log(response);
        const blobBase64 = new Buffer( response.CiphertextBlob, 'binary').toString('base64'); 
        console.log(blobBase64)
        return blobBase64;
        
    } catch (err) {
        
        console.log(err)
        return err + "";
        
    }
    
}