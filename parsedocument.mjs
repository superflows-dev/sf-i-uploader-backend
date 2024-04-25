import { DOC_DIR, TextractClient, GetDocumentTextDetectionCommand, DetectDocumentTextCommand, GetItemCommand, StartDocumentTextDetectionCommand, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
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

export const processParseDocument = (arrwords, docType) => {
    
    var retValue = false;
    
    if(DOC_DIR[docType] != null) {
                    
        var matches = 0;
        
        for(var i = 0; i < DOC_DIR[docType].length; i++) {

            var presentWordFlag = false;
            
            for(var j = 0; j < arrwords.length; j++) {
                
                if(arrwords[j].toLowerCase().indexOf(DOC_DIR[docType][i].toLowerCase()) >= 0) {
                    presentWordFlag = true;
                }
                
            }
            
            if(presentWordFlag) matches++;
        }
        
        if(matches == DOC_DIR[docType].length) {
            retValue = true;
        } else {
            retValue = false;
        }
        
    }
    
    return retValue;
    
}