import { processGetDateTimeStrings } from "./getdatetimestrings.mjs";
import { processSendEmail } from "./sendemail.mjs";
import { processAuthenticate } from "./authenticate.mjs";
export const processLargeFileWarning = async (event) => {
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

    var filesize = null;

    try {
        filesize = JSON.parse(event.body).filesize;
    } catch (e) {
        const response = { statusCode: 400, body: { result: false, error: "Malformed body!" } };
        //processAddLog(userId, 'upload', event, response, response.statusCode)
        return response;
    }

    let subject = "[FlaggGRC Uploader] Large File Warning - " + processGetDateTimeStrings(new Date().getTime());
    let bodyHTML = "<p>There has been an attempt to upload a large file of the size " + filesize + ".</p><p>from the email: <b>" + email + "</b></p><p>Best regards,<br>FlaggGRC Team</p>";
    await processSendEmail('hrushi@flagggrc.tech, jomon.j@flagggrc.tech, ninad.t@flagggrc.tech', subject, bodyHTML, bodyHTML, false);

    return { statusCode: 200, body: { result: true } };
}