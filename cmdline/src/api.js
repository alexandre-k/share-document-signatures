"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.createApp = exports.sendSignatureRequest = exports.generateSignatureRequestData = exports.downloadDocument = exports.getAccountInfo = void 0;
const HelloSignSDK = __importStar(require("hellosign-sdk"));
// import * from "hellosign-sdk/types";
const getAccountInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    const api = new HelloSignSDK.AccountApi();
    api.username = process.env.HELLOSIGN_API_KEY || "undefined";
    const response = yield api.accountGet();
    return response.body.account;
});
exports.getAccountInfo = getAccountInfo;
const downloadDocument = (requestId) => __awaiter(void 0, void 0, void 0, function* () {
    const api = new HelloSignSDK.SignatureRequestApi();
    api.username = process.env.HELLOSIGN_API_KEY || "undefined";
    try {
        const sigRequestResp = yield api.signatureRequestGet(requestId);
        if (sigRequestResp === undefined) {
            console.log('Unable to get a request for a signature.');
            return null;
        }
        else {
            const signatures = sigRequestResp.body.signatureRequest.signatures;
            const response = yield api.signatureRequestFiles(requestId);
            return response.body;
        }
    }
    catch (error) {
        console.log("Exception when calling HelloSign API:");
        // @ts-ignore
        console.log(error.body);
    }
    ;
});
exports.downloadDocument = downloadDocument;
const generateSignatureRequestData = ({ signers, doc, clientId, title, subject, message, ccEmailAddresses, fileUrl, testMode }) => {
    const signingOptions = {
        draw: true,
        type: true,
        upload: true,
        phone: true,
        defaultType: HelloSignSDK.SubSigningOptions.DefaultTypeEnum.Draw,
    };
    const data = {
        clientId,
        title,
        subject,
        message,
        signers: signers.map((signer, index) => ({
            emailAddress: signer.mail,
            name: signer.name,
            order: index,
        })),
        ccEmailAddresses,
        fileUrl,
        signingOptions,
        testMode,
    };
    return data;
};
exports.generateSignatureRequestData = generateSignatureRequestData;
const sendSignatureRequest = ({ signers, doc, clientId, title, subject, message, fileUrl, willSend, testMode }) => __awaiter(void 0, void 0, void 0, function* () {
    const api = new HelloSignSDK.SignatureRequestApi();
    api.username = process.env.HELLOSIGN_API_KEY || "undefined";
    const data = (0, exports.generateSignatureRequestData)({
        signers,
        doc,
        clientId,
        title,
        subject,
        message,
        fileUrl,
        testMode
    });
    try {
        if (willSend) {
            const response = yield api.signatureRequestSend(data);
            return response.body;
        }
        else {
            const response = yield api.signatureRequestCreateEmbedded(data);
            return response.body;
        }
    }
    catch (error) {
        console.log("Exception when calling HelloSign API:");
        // @ts-ignore
        console.log(error.body);
    }
    ;
});
exports.sendSignatureRequest = sendSignatureRequest;
const createApp = () => __awaiter(void 0, void 0, void 0, function* () {
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
        const response = yield api.apiAppCreate(data);
        console.log(response.body);
    }
    catch (error) {
        console.log("Exception when calling HelloSign API:");
        // @ts-ignore
        console.log(error.body);
    }
});
exports.createApp = createApp;
const uploadFile = (encryptedData, filename, doc, clientId, recipientAddress, recipientName) => __awaiter(void 0, void 0, void 0, function* () {
    const s3 = new AWS.S3({
        endpoint: 'https://s3.filebase.com',
        region: 'us-east-1',
        signatureVersion: 'v4',
        accessKeyId: process.env.FILEBASE_ACCESS_KEY_ID,
        secretAccessKey: process.env.FILEBASE_SECRET_ACCESS_KEY,
    });
    // const textFileName = 'encrypted_data.txt'
    const data = '==================' + filename + '==================\n\n' + encryptedData + '\n\n========================================================';
    // await createTextFile(data, textFileName)
    // const pdfContent = fs.readFileSync(pdfName)
    try {
        const params = {
            Bucket: 'hellosign',
            Key: filename,
            Body: data
        };
        const request = s3.putObject(params);
        request.on('httpHeaders', (statusCode, headers) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(statusCode, headers);
            const cid = (statusCode === 200) ? headers['x-amz-meta-cid'] : null;
            console.log(cid);
            if (cid === null)
                return;
            const fileBaseGatewayUrl = "https://ipfs.filebase.io/ipfs/" + cid;
            console.log(`URL: ${fileBaseGatewayUrl}`);
            const request = yield (0, exports.sendSignatureRequest)({
                signers: [{
                        mail: recipientAddress,
                        name: recipientName
                    }],
                doc,
                clientId,
                title: "Signature for " + filename,
                subject: "Signature request for " + filename,
                message: "You can access the encrypted document from this URL: \n" + fileBaseGatewayUrl + "\n\n" + "Encrypted data:\n" + encryptedData + "\n\n",
                fileUrl: [fileBaseGatewayUrl],
                willSend: true,
                testMode: true
            });
            if (request === undefined || request.signatureRequest === undefined) {
                console.log('Unable to request a signature...');
            }
            else {
                console.log('Request id: ', request.signatureRequest.signatureRequestId);
                console.log('Requester: ', request.signatureRequest.requesterEmailAddress);
                console.log('Details url: ', request.signatureRequest.detailsUrl);
                console.log('Signatures: ', request.signatureRequest.signatures);
                console.log('Request done!');
            }
        }));
        yield request.send();
    }
    catch (error) {
        console.log(error);
    }
});
exports.uploadFile = uploadFile;
