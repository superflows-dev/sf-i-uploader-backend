import { processUpload } from './upload.mjs';
import { processGetMeta } from './getmeta.mjs';
import { processGet } from './get.mjs';
import { processSns } from './sns.mjs';
import { processGetExtract } from './getextract.mjs';
import { processGetExtractStatus } from './getextractstatus.mjs';
import { processGetMessage } from './getmessage.mjs';
import { processLargeFileWarning } from './largefilewarning.mjs';
import nodemailer from 'nodemailer';
import { TEST_IP_ADDRESSES } from './globals.mjs';
export const handler = async (event, context, callback) => {

  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": '*',
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, Access-Control-Allow-Credentials, Content-Type, isBase64Encoded, x-requested-with",
      "Access-Control-Allow-Credentials": true,
      'Content-Type': 'application/json',
      "isBase64Encoded": false
    },
  };


  if (event.Records != null) {
    await processSns(event.Records[0]);
    return;
  }

  if (event["httpMethod"] == "OPTIONS") {
    callback(null, response);
    return;
  }

  switch (event["path"]) {

    case "/upload":
      const resultUpload = await processUpload(event);
      response.body = JSON.stringify(resultUpload.body);
      response.statusCode = resultUpload.statusCode;
      break;

    case "/getmessage":
      const resultMessage = await processGetMessage(event);
      response.body = JSON.stringify(resultMessage.body);
      response.statusCode = resultMessage.statusCode;
      break;

    case "/getmeta":
      const resultGetMeta = await processGetMeta(event);
      response.body = JSON.stringify(resultGetMeta.body);
      response.statusCode = resultGetMeta.statusCode;
      break;

    case "/get":
      const resultGet = await processGet(event);
      response.body = JSON.stringify(resultGet.body);
      response.statusCode = resultGet.statusCode;
      break;

    case "/getextract":
      const resultGetExtract = await processGetExtract(event);
      response.body = JSON.stringify(resultGetExtract.body);
      response.statusCode = resultGetExtract.statusCode;
      break;

    case "/getextractstatus":
      const resultGetExtractStatus = await processGetExtractStatus(event);
      response.body = JSON.stringify(resultGetExtractStatus.body);
      response.statusCode = resultGetExtractStatus.statusCode;
      break;

    case "/largefilewarning":
      const resultLargeFileWarning = await processLargeFileWarning(event);
      response.body = JSON.stringify(resultLargeFileWarning.body);
      response.statusCode = resultLargeFileWarning.statusCode;
      break;

    default:
      let userIp = event.headers?.["cloudfront-viewer-address"]?.split(":")[0] || event.headers?.["x-forwarded-for"]?.split(",")[0] || "Unknown";
      let transporter = nodemailer.createTransport({
        host: "email-smtp.us-east-1.amazonaws.com", // Notes on this below
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD, // Passed in via the YAML
        },
      });
      let subject = ((TEST_IP_ADDRESSES.indexOf(userIp) >= 0) ? "[TEST] " : "") + "Unknown method called for Compliance Upload function";
      console.log("userIp", userIp, (TEST_IP_ADDRESSES.indexOf(userIp) >= 0), ((TEST_IP_ADDRESSES.indexOf(userIp) >= 0) ? "[TEST] " : ""), subject);
      const message = {
        from: '"FlaggGRC Alert" <rcm@flagggrc.tech>', // sender address
        to: "hrushi@flagggrc.tech, jomon.j@flagggrc.tech, ninad.t@flagggrc.tech", // list of receivers
        subject: subject,
        text: "An unknown method was called in Compliance Upload function with following event: " + JSON.stringify(event), // plain text body
        html: "An unknown method was called in Compliance Upload function from following ip address: <b>" + userIp + "</b><br /><br />with following event:<br /><br />" + JSON.stringify(event),
      };

      // Send it out!
      const emailResult = await transporter.sendMail(message);
      response.body = JSON.stringify({ result: false, error: "Method not found", event: event });
      response.statusCode = 404;
  }

  callback(null, response);

  return response;

};