import * as HelloSignSDK from "hellosign-sdk";
import AWS from 'aws-sdk';
// import * from "hellosign-sdk/types";

export type Signer = {
    name: string
    mail: string
}

export interface IGenerateSignatureRequestData {
    signers: Signer[];
    doc: string;
    clientId: string;
    title: string;
    subject: string;
    message: string;
    ccEmailAddresses: string[];
    fileUrl: string;
    testMode: boolean;
}

export interface ISendSignatureRequest {
    signers: Signer[];
    doc: string;
    clientId: string;
    title: string;
    subject: string;
    message: string;
    fileUrl: string;
    testMode: boolean;
}

export const getAccountInfo = async () => {
    const api = new HelloSignSDK.AccountApi();
    api.username = process.env.HELLOSIGN_API_KEY || "undefined";

    const response = await api.accountGet();
    return response.body.account;
}

export const downloadDocument = async (requestId: string) => {
    const api = new HelloSignSDK.SignatureRequestApi();
    api.username = process.env.HELLOSIGN_API_KEY || "undefined";
    try {
        const sigRequestResp = await api.signatureRequestGet(requestId);
        return sigRequestResp?.body?.signatureRequest?.signatures;
    } catch(error) {
        console.log("Exception when calling HelloSign API:");
        // @ts-ignore
        console.log(error.body);
    };
}

export const generateSignatureRequestData = ({ signers, doc, clientId, title, subject, message, ccEmailAddresses, fileUrl, testMode }: IGenerateSignatureRequestData) => {
    const signingOptions: HelloSignSDK.SubSigningOptions = {
        draw: true,
        type: true,
        upload: true,
        phone: true,
        defaultType: HelloSignSDK.SubSigningOptions.DefaultTypeEnum.Draw,
    };
    return {
        clientId,
        title,
        subject,
        message,
        signers: signers.map((signer: Signer, index: number) => ({
            emailAddress: signer.mail,
            name: signer.name,
            order: index,
        })) as HelloSignSDK.SubSignatureRequestSigner[],
        ccEmailAddresses,
        fileUrl: [fileUrl],
        signingOptions,
        testMode,
    };
}

export const sendSignatureRequest = async ({ signers, doc, clientId, title, subject, message, fileUrl, testMode}: ISendSignatureRequest) => {
    const api = new HelloSignSDK.SignatureRequestApi();
    api.username = process.env.HELLOSIGN_API_KEY || "undefined";

    const data: HelloSignSDK.SignatureRequestSendRequest = generateSignatureRequestData({
        signers,
        doc,
        clientId,
        title,
        subject,
        message,
        ccEmailAddresses: [],
        fileUrl,
        testMode })
    try {
        const response = await api.signatureRequestSend(data);
        return response.body;
    } catch(error) {
        console.log("Exception when calling HelloSign API:");
        // @ts-ignore
        console.log(error.body);
    };
}


export const createApp = async () => {
    const api = new HelloSignSDK.ApiAppApi();
    api.username = process.env.HELLOSIGN_API_KEY || "undefined";

    const oauth = {
        callbackUrl: "https://example.com/oauth",
        scopes: [
            HelloSignSDK.SubOAuth.ScopesEnum.BasicAccountInfo,
            HelloSignSDK.SubOAuth.ScopesEnum.RequestSignature,
        ],
    };

    const whiteLabelingOptions = {
        primaryButtonColor: "#00b3e6",
        primaryButtonTextColor: "#ffffff",
    };

    const data = {
        name: "My Production App",
        domains: ["example.com"],
        oauth,
        whiteLabelingOptions,
    };
    try {
        const response = await api.apiAppCreate(data);
        console.log(response.body);
    } catch(error) {
        console.log("Exception when calling HelloSign API:");
        // @ts-ignore
        console.log(error.body);
    }
}

export const uploadFile = async (encryptedData: string, filename: string, doc: string, clientId: string, recipientAddress: string, recipientName: string) => {
    const s3 = new AWS.S3({
        endpoint: 'https://s3.filebase.com',
        region: 'us-east-1',
        signatureVersion: 'v4',
        accessKeyId: process.env.FILEBASE_ACCESS_KEY_ID,
        secretAccessKey: process.env.FILEBASE_SECRET_ACCESS_KEY,
    });

    // const textFileName = 'encrypted_data.txt'
    const data = '==================' + filename + '==================\n\n' + encryptedData + '\n\n========================================================'
    // await createTextFile(data, textFileName)
    // const pdfContent = fs.readFileSync(pdfName)

    try {
        const params = {
            Bucket: 'hellosign',
            Key: filename,
            Body: data
        };
        const request = s3.putObject(params)
        request.on('httpHeaders', async (statusCode, headers) => {
            console.log(statusCode, headers)
            const cid = (statusCode === 200) ? headers['x-amz-meta-cid'] : null
            console.log(cid)
            if (cid === null) return;
            const fileBaseGatewayUrl = "https://ipfs.filebase.io/ipfs/" + cid
            console.log(`URL: ${fileBaseGatewayUrl}`);

            const request = await sendSignatureRequest({
                signers: [{
                    mail: recipientAddress,
                    name: recipientName
                }],
                doc,
                clientId,
                title: "Signature for " + filename,
                subject: "Signature request for " + filename,
                message: "You can access the encrypted document from this URL: \n" + fileBaseGatewayUrl + "\n\n" + "Encrypted data:\n" + encryptedData + "\n\n",
                fileUrl: fileBaseGatewayUrl,
                testMode: true
            });
            if (request === undefined || request.signatureRequest === undefined) {
                console.log('Unable to request a signature...')
            } else {
                console.log('Request id: ', request.signatureRequest.signatureRequestId)
                console.log('Requester: ', request.signatureRequest.requesterEmailAddress)
                console.log('Details url: ', request.signatureRequest.detailsUrl)
                console.log('Signatures: ', request.signatureRequest.signatures)
                console.log('Request done!')
            }
        })
        await request.send()
    } catch (error) {
        console.log(error)
    }
}
