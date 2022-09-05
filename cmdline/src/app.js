#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const yargs = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv));
const keys_1 = require("./utils/keys");
const api_1 = require("./api");
const testSignatureRequestId = "709f58c1b9b3e4dbfdce4e6a8aace66b5dd74a3f";
const testClientId = "0839d8330c3e55c4ccd10f52d62376ce";
(() => __awaiter(void 0, void 0, void 0, function* () {
    const argv = yield yargs
        .command('create-app', "Create app to get client ID")
        .command('upload', "Upload a document to sign", {
        recipientAddress: {
            description: "Mail address for the recipient of the signature request",
            alias: 'raddr',
            type: 'string'
        },
        recipientName: {
            description: "Name of the recipient of the signature request",
            alias: 'rname',
            type: 'string'
        },
        name: {
            description: "Name of the document",
            alias: "n"
        },
        publicKey: {
            description: "Public key of recipient",
            alias: "pub",
            type: "string"
        },
        privateKey: {
            description: "Your own Private key",
            alias: "priv",
            type: "string"
        },
        server: {
            description: "Default server used for lookup",
            alias: "s",
            type: "string",
            default: "keys.openpgp.org"
        }
    })
        .command("lookup", "Email address used for signatures", {
        email: {
            description: "Email address to sign with",
            alias: 'e',
            type: 'string'
        },
        server: {
            description: "Default server used for lookup",
            alias: "s",
            type: "string",
            default: "keys.openpgp.org"
        }
    })
        .command('get-account', "Get account used for signatures")
        .command('document', 'Get documents', {
        requestId: {
            description: "Request id of document to sign",
            alias: 'rid',
            type: 'string',
            default: testSignatureRequestId
        }
    })
        .command('send', 'Send request', {
        document: {
            description: "Document to sign",
            alias: 'doc',
            type: 'string'
        },
        recipientAddress: {
            description: "Mail address for the recipient of the signature request",
            alias: 'raddr',
            type: 'string'
        },
        recipientName: {
            description: "Name of the recipient of the signature request",
            alias: 'rname',
            type: 'string'
        },
        clientId: {
            description: "App id generated",
            alias: 'cid',
            type: "string",
            default: testClientId
        }
    })
        .help()
        .alias('help', 'h').argv;
    // const { email, account, document, send } = argv;
    const [cmd, rest] = argv._;
    switch (cmd) {
        case 'create-app': {
            const app = yield (0, api_1.createApp)();
            console.log(app);
            break;
        }
        case "upload": {
            const encryptedData = yield (0, keys_1.formatData)(argv.name, argv.recipientAddress, argv.publicKey, argv.privateKey, argv.server);
            yield (0, api_1.uploadFile)(encryptedData, argv.name, argv.document, testClientId, argv.recipientAddress, argv.recipientName);
            break;
        }
        case 'lookup': {
            console.log('Lookup email: ', argv.email);
            const publicKeys = yield (0, keys_1.lookupEmailPubKey)(argv.email, argv.server);
            break;
        }
        case 'account': {
            // const { emailAddress } = await getAccountInfo()
            // console.log('Account email: ', emailAddress)
            const accountInfo = yield (0, api_1.getAccountInfo)();
            console.log(accountInfo);
            break;
        }
        case 'document': {
            const document = yield (0, api_1.downloadDocument)(argv.requestId);
            console.log('Document: ', document);
            if (!!document)
                console.log("\nSignature ID: ", document.signatureId, "\nSigner Email address: ", document.signerEmailAddress, "\nSigner name: ", document.signerName, "\nSignature status code: ", document.statusCode);
            break;
        }
        case 'send': {
            const request = yield (0, api_1.sendSignatureRequest)({
                signers: [{
                        mail: argv.recipientAddress,
                        name: argv.recipientName
                    }],
                doc: argv.document,
                clientId: testClientId,
                title: "NDA with Acme Co.",
                subject: "The NDA we talked about",
                message: "Please sign this NDA and then we can discuss more. Let me know if you have any questions.",
                fileUrl: ["https://paulklipp.com/images/OnePageContract.pdf"],
                willSend: true,
                testMode: true
            });
            if (request === undefined || request.signatureRequest === undefined) {
                console.log('Unable to send a signature request...');
            }
            else {
                console.log('Request id: ', request.signatureRequest.signatureRequestId);
                console.log('Requester: ', request.signatureRequest.requesterEmailAddress);
                console.log('Details url: ', request.signatureRequest.detailsUrl);
                console.log('Signatures: ', request.signatureRequest.signatures);
                console.log('Request done!');
            }
            break;
        }
    }
}))();
