import {DOC_DIR,GetDocumentTextDetectionCommand, TextractClient, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, UpdateItemCommand, GetItemCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { processParseDocument } from './parsedocument.mjs';
import { processExtractDocument } from './extractdocument.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { getMimeFromExtension } from './getMimeFromExtension.mjs';
import { processAddLog } from './addlog.mjs';
import https from 'https';

export const processSns = async (event) => {
    
    const userId = "sns";
    
    const message = JSON.parse(event["Sns"]["Message"]);
    
    const JobId = message["JobId"]; 
    
    const input2 = {
        "JobId": JobId
    }
    
    const txClient = new TextractClient();
    const command2 = new GetDocumentTextDetectionCommand(input2);
    const response2 = await txClient.send(command2);
    const blocks = response2.Blocks;
    
    processAddLog("0000", 'sns', response2.JobStatus, '', 200)
    
      var arrWords = [];
      var arrWordsMeta = {};
    
      for(var i = 0; i < blocks.length; i++) {
    
        const block = blocks[i];
        console.log(block.BlockType);
        if(arrWordsMeta[block.BlockType] == null) {
          arrWordsMeta[block.BlockType] = 0;
        }
        arrWordsMeta[block.BlockType]++;
    
        if(block.BlockType == "WORD") {
          arrWords.push(block.Text + "");
        }
    
      }
    
    var setParams = {
        TableName: TABLE,
        Key: {
            id: {
                "S": JobId
            }
        },
        UpdateExpression: "set #status1 = :status1, #arrwords1 = :arrwords1, #arrmeta1 = :arrmeta1",
        ExpressionAttributeNames: {
            "#status1": "status",
            "#arrwords1": "arrwords",
            "#arrmeta1": "arrmeta",
        },
        ExpressionAttributeValues: {
            ":status1": {"S": "1"},
            ":arrwords1": {"S": JSON.stringify(arrWords)},
            ":arrmeta1": {"S": JSON.stringify(arrWordsMeta)},
        },
    };
    
    console.log(setParams);
    
    const ddbUpdate = async (setParams) => {
        try {
          const data = await ddbClient.send(new UpdateItemCommand(setParams));
          console.log(data);
          return data;
        } catch (err) {
          return err;
        }
    };
    
    var resultUpdate = await ddbUpdate(setParams);
    
    var getParams = {
        TableName: TABLE,
        Key: {
          id: { S: JobId },
        },
    };
    
    processAddLog("0000", 'sns', getParams, '', 200)
    
    async function ddbGet (getParams) {
        try {
          const data = await ddbClient.send(new GetItemCommand(getParams));
          return data;
        } catch (err) {
          return err;
        }
    };
    
    var resultGet = await ddbGet(getParams);
    
    processAddLog("0000", 'sns', resultGet, '', 200)
    
    const dataPost = {
        jobId: JobId,
        dataPassthrough: JSON.parse(resultGet.Item.data.S),
        jobStatus: response2.JobStatus,
        blocks: blocks,
        arrWords: arrWords,
        arrWordsMeta: arrWordsMeta
    };
    
    const docType = resultGet.Item.doctype.S;
    
    var documentParsed = "";
    var possibleMatches = [];
    
    if(docType != "") {
                
        if(DOC_DIR[docType] != null) {
            
            documentParsed = processParseDocument(JSON.parse(resultGet.Item.arrwords.S), docType);
            if(documentParsed) {
                possibleMatches = processExtractDocument(JSON.parse(resultGet.Item.arrwords.S), docType);
            }
            
        }
            
    }
    
    dataPost.documentParsed = documentParsed;
    dataPost.possibleMatches = possibleMatches;
    
    processAddLog("0000", 'sns', dataPost, '', 200)
    
    let myPromise = new Promise(function(resolve, reject) {
    
        var options = {
          host: resultGet.Item.callbackurlhost.S,
          port: 443,
          method: 'POST',
          path: '/' + resultGet.Item.callbackurlpath.S
        };
        
        processAddLog("0000", 'sns', options, '', 200)
        processAddLog("0000", 'sns', https, '', 200)
        
        //create the request object with the callback with the result
        const req = https.request(options, (res) => {
            resolve('');
        //   resolve(JSON.stringify(res.statusCode));
        });
    
        // handle the possible errors
        req.on('error', (e) => {
          reject(e.message);
        });
        
        //do the request
        req.write(JSON.stringify(dataPost));
    
        //finish the request
        req.end();
        
        // resolve('');
        
    });
      
    await myPromise();
    
    
}