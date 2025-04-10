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

export const processMatchString = (str, type) => {
    
    if(type == "numeric") {
        
        var pattern = /^\d+\.?\d*$/;
        return pattern.test(str); 
        
    }
    
    if(type == "alphanumeric") {
        
        var pattern1 = /^[A-Z0-9_]+$/;
        
        var pattern2 = /\d/;
        
        return pattern1.test(str) && pattern2.test(str); 
        
    }
    if(type == "passportin") {
        
        var pattern3 = /P<[A-Z]+<<[A-Z]+<[A-Z]+<</i;
        return pattern3.test(str); 
        
    }
    if(type == "itrack-submit-date") {
        
        var pattern4 = /^(([0-9])|([0-2][0-9])|([3][0-1]))\-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\-\d{4}$/;
        return pattern4.test(str); 
        
    }
    if(type == "itrack-assessment-year") {
        
        var pattern5 = /\d{4}\-\d{2}$/;
        return pattern5.test(str); 
        
    }
    if(type == "itrack-pan") {
        
        var pattern6 = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
        return pattern6.test(str); 
        
    }
    if(type == "gstin") {
        
        var pattern7 = /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/;
        return pattern7.test(str); 
        
    }
    if(type == "gst-arn") {
        
        var pattern8 = /[A-Z]{2}\d{12}[A-Z]{1}/;
        return pattern8.test(str); 
        
    }
    
    return false;
    
}