import { VERIFY_DIR, DOC_DIR, TextractClient, GetDocumentTextDetectionCommand, DetectDocumentTextCommand, GetItemCommand, StartDocumentTextDetectionCommand, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
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

export const processExtractString = (str, type) => {
    var retStr = str;
    if(type == "passportin") {
        
        var split1 = retStr.split('P<IND')
        var split2 = [];
        for (var i = 0; i < split1.length; i++) {
            split2 = split2.concat(split1[i].split("<"))
        } 
        var retArray = [];
        for (var i = 0; i < split2.length; i++) {
            if(split2[i].length > 0){
                retArray.push(split2[i])
            }
        }
        retStr = retArray.join(' ');
    }
    processAddLog("0000", 'extractString', str, retStr, 200)
    return retStr;
    
}