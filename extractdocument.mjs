import { VERIFY_DIR, DOC_DIR, TextractClient, GetDocumentTextDetectionCommand, DetectDocumentTextCommand, GetItemCommand, StartDocumentTextDetectionCommand, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
import { processExtractString } from './extractstring.mjs';
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
    
    var arrwordsfinal = [];
    for(var k = 0 ; k < arrwords.length ; k++){
        arrwordsfinal = arrwordsfinal.concat(arrwords[k].split(" "));
    }
  
    if(VERIFY_DIR[docType] != null && arrwords.length > VERIFY_DIR[docType].length) {
        
        for(var j = 0; j < arrwordsfinal.length ; j++) {
                
            var str = [];
            var expectedLength = 0;
            var strLength = 0
            for(var count = j; (count - j) < VERIFY_DIR[docType].length && count < arrwordsfinal.length; count++) {
                var expectedStringLength = 0
                if(((VERIFY_DIR[docType][count - j].length === 0) || (arrwordsfinal[count].length === VERIFY_DIR[docType][count - j].length)) && processMatchString(arrwordsfinal[count], VERIFY_DIR[docType][count - j].type)) {
                    
                    if(VERIFY_DIR[docType][count - j].extract ?? false){
                        
                        let extractedString = processExtractString(arrwordsfinal[count], VERIFY_DIR[docType][count - j].type); 
                        str.push(extractedString);
                        strLength += extractedString.length;
                        expectedLength += extractedString.length;
                    }else{
                        str.push(arrwordsfinal[count]);
                        strLength += arrwordsfinal[count].length;
                        expectedLength += VERIFY_DIR[docType][count - j].length; 
                    }
                }else if(VERIFY_DIR[docType][count-j].condition == "and"){
                    expectedLength += VERIFY_DIR[docType][count - j].length; 
                }
            }
            
            if(expectedLength > 0 && strLength === expectedLength && !possibleMatches.includes(str.join(" "))) {
                possibleMatches.push(str.join(" "));
            }
            
        }
        
    }
    
    return possibleMatches;
    
}