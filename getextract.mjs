import { TextractClient, GetDocumentTextDetectionCommand, DetectDocumentTextCommand, StartDocumentTextDetectionCommand, ListObjectsV2Command, GetObjectCommand, GetObjectAttributesCommand, S3_BUCKET, PutObjectCommand, s3Client, RECORD_TYPE_META, RECORD_TYPE_DATA, REGION, TABLE, AUTH_ENABLE, ddbClient, ScanCommand, PutItemCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { getMimeFromExtension } from './getMimeFromExtension.mjs';
import { processAddLog } from './addlog.mjs';
import { processGet } from './get.mjs';
import { checkForScripts } from './checkforscripts.mjs'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { processDeleteFiles } from './deletefiles.mjs'
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export const processGetExtract = async (event) => {

    if ((event["headers"]["Authorization"]) == null) {
        return { statusCode: 400, body: { result: false, error: "Malformed headers!" } };
    }

    if ((event["headers"]["Authorization"].split(" ")[1]) == null) {
        return { statusCode: 400, body: { result: false, error: "Malformed headers!" } };
    }

    var hAscii = Buffer.from((event["headers"]["Authorization"].split(" ")[1] + ""), 'base64').toString('ascii');

    if (hAscii.split(":")[1] == null) {
        return { statusCode: 400, body: { result: false, error: "Malformed headers!" } };
    }

    const email = hAscii.split(":")[0];
    const accessToken = hAscii.split(":")[1];

    if (email == "" || !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        return { statusCode: 400, body: { result: false, error: "Malformed headers!" } }
    }

    if (accessToken.length < 5) {
        return { statusCode: 400, body: { result: false, error: "Malformed headers!" } }
    }

    const authResult = await processAuthenticate(event["headers"]["Authorization"]);

    if (!authResult.result) {
        return { statusCode: 401, body: { result: false, error: "Unauthorized request!" } };
    }

    const userId = authResult.userId;

    // const userId = "1234";

    var key = null;
    var dataPassthrough = null;
    var callbackUrlHost = null;
    var callbackUrlPath = null;
    var doctype = null;
    var filename = null;
    var emailcontent = null;

    try {
        key = JSON.parse(event.body).key;
        dataPassthrough = JSON.parse(event.body).datapassthrough.trim();
        callbackUrlHost = JSON.parse(event.body).callbackurlhost.trim();
        callbackUrlPath = JSON.parse(event.body).callbackurlpath.trim();
        doctype = JSON.parse(event.body).doctype;
        filename = JSON.parse(event.body).filename;
    } catch (e) {
        const response = { statusCode: 400, body: { result: false, error: "Malformed body!" } };
        //processAddLog(userId, 'upload', event, response, response.statusCode)
        return response;
    }

    try {
        emailcontent = JSON.parse(event.body).emailcontent;
    } catch (e) {
        emailcontent = null;
    }

    if (key == null || key == "" || key.length < 1) {
        const response = { statusCode: 400, body: { result: false, error: "Key is not valid!" } }
        // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }

    if (dataPassthrough == null || dataPassthrough == "" || dataPassthrough.length < 1) {
        const response = { statusCode: 400, body: { result: false, error: "DataPassthrough is not valid!" } }
        // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }

    if (callbackUrlHost == null || callbackUrlHost == "" || callbackUrlHost.length < 1) {
        const response = { statusCode: 400, body: { result: false, error: "CallbackUrlHost is not valid!" } }
        // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }

    if (callbackUrlPath == null || callbackUrlPath == "" || callbackUrlPath.length < 1) {
        const response = { statusCode: 400, body: { result: false, error: "CallbackUrlPath is not valid!" } }
        // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }

    const responseGet = await processGet(event);

    console.log((responseGet));

    var ext = "";

    if (responseGet.body.data.indexOf('pdf') >= 0) {

        ext = "pdf";

    } else if (responseGet.body.data.indexOf('png') >= 0 ||
        responseGet.body.data.indexOf('PNG') >= 0) {

        ext = "png";

    } else if (responseGet.body.data.indexOf('jpg') >= 0 ||
        responseGet.body.data.indexOf('jpeg') >= 0 ||
        responseGet.body.data.indexOf('JPG') >= 0 ||
        responseGet.body.data.indexOf('JPEG') >= 0) {

        ext = "jpg";

    }

    console.log('ext found', ext);
    if (responseGet.body.data.indexOf(', ') > 0) {
        if (checkForScripts(responseGet.body.data.split(', ')[1])) {
            // let deleteCommand = new DeleteObjectCommand({
            //   Bucket: S3_BUCKET,
            //   Key: key + "_" + "full." + ext
            // });
            // try {
            //   await s3Client.send(deleteCommand);
            // } catch (e) {
            //   console.log(e);
            // }
            await processDeleteFiles(key);
            const response = { statusCode: 400, body: { result: false, error: "Potentially malicious content found in the file!" } }
            return response;
        }
    }else{
        if (checkForScripts(responseGet.body.data.split(', ')[0])) {
            // let deleteCommand = new DeleteObjectCommand({
            //   Bucket: S3_BUCKET,
            //   Key: key + "_" + "full." + ext
            // });
            // try {
            //   await s3Client.send(deleteCommand);
            // } catch (e) {
            //   console.log(e);
            // }
            await processDeleteFiles(key);
            const response = { statusCode: 400, body: { result: false, error: "Potentially malicious content found in the file!" } }
            return response;
        }
    }

    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key + "_" + "full." + ext,
        Body: Buffer.from(responseGet.body.data.split(',')[1], 'base64'),
        ContentEncoding: 'base64',
        ContentType: ext == "jpg" ? "image/jpeg" : ext == "png" ? "image/png" : 'application/pdf'
    });

    console.log({
        Bucket: S3_BUCKET,
        Key: key + "_" + "full." + ext,
    });

    try {
        const response = await s3Client.send(command);
        console.log(response);
    } catch (err) {
        console.error(err);
    }

    const txClient = new TextractClient();
    const input = { // DetectDocumentTextRequest
        DocumentLocation: { // Document
            "S3Object": {
                "Bucket": S3_BUCKET,
                "Name": key + "_" + "full." + ext
            },
        },
        "NotificationChannel": {
            "SNSTopicArn": "arn:aws:sns:us-east-1:181895849565:AmazonTextractT_sf-i-uploader_FlaggGRC-ComplianceUploads_1684321396854_test",
            "RoleArn": "arn:aws:iam::181895849565:role/TextractRole"
        }
    };

    console.log(input);

    const command1 = new StartDocumentTextDetectionCommand(input);
    const response1 = await txClient.send(command1);

    console.log(response1);

    const jobId = response1.JobId;

    var setParams = {
        TableName: TABLE,
        Item: {
            id: {
                "S": jobId
            },
            status: {
                "S": "0"
            },
            data: {
                "S": JSON.stringify(dataPassthrough)
            },
            doctype: {
                "S": doctype == null ? "" : doctype
            },
            callbackurlhost: {
                "S": callbackUrlHost
            },
            callbackurlpath: {
                "S": callbackUrlPath
            },
            email: {
                "S": email
            },
            filename: {
                "S": filename
            },
            emailcontent: {
                "S": emailcontent == null ? "" : emailcontent
            }
        }
    };

    console.log(setParams);

    const ddbUpdate = async (setParams) => {
        try {
            const data = await ddbClient.send(new PutItemCommand(setParams));
            return data;
        } catch (err) {
            return err;
        }
    };

    var resultUpdate = await ddbUpdate(setParams);

    // console.log('jobid', jobId);

    const response = { statusCode: 200, body: { result: true, jobId: jobId } };
    processAddLog(userId, 'getextract', event, response, response.statusCode)
    return response;


}