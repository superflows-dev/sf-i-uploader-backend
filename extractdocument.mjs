import { VERIFY_DIR, DOC_DIR, TextractClient, GetDocumentTextDetectionCommand, DetectDocumentTextCommand, GetItemCommand, StartDocumentTextDetectionCommand, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
import { processMatchString } from './matchstring.mjs';
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

export const processExtractDocument = (arrwords, docType) => {
    
    var possibleMatches = [];
    
    if(VERIFY_DIR[docType] != null && arrwords.length > VERIFY_DIR[docType].length) {
        
        for(var j = 0; j < arrwords.length ; j++) {
                
            var str = "";
            var expectedLength = 0;
            for(var count = j; (count - j) < VERIFY_DIR[docType].length && count < arrwords.length; count++) {
                
                if(arrwords[count].length === VERIFY_DIR[docType][count - j].length && processMatchString(arrwords[count], VERIFY_DIR[docType][count - j].type)) {
                    str += arrwords[count];    
                }
                
                expectedLength += VERIFY_DIR[docType][count - j].length;
                
            }
            
            if(str.length === expectedLength && !possibleMatches.includes(str)) {
                possibleMatches.push(str);
            }
            
        }
        
    }
    
    return possibleMatches;
    
}