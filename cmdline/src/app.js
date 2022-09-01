#!/usr/bin/env node

import WKD from '@openpgp/wkd-client';
import { readKey } from 'openpgp';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as HelloSignSDK from "hellosign-sdk";
// import * from "hellosign-sdk/types";
import axios from 'axios';
const yargs = _yargs(hideBin(process.argv));

const testSignatureRequestId = "709f58c1b9b3e4dbfdce4e6a8aace66b5dd74a3f"
const testClientId = "0839d8330c3e55c4ccd10f52d62376ce";

(async () => {
    const argv = await yargs
      .command('create-app', "Create app to get client ID")
      .command('email', "Email address used for signatures", {
          lookup: {
              description: "Email address to sign with",
              alias: 'e',
              type: 'string'
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
              description:
                  "Mail address for the recipient of the signature request",
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
    const [ cmd, rest ] = argv._;
    switch (cmd) {
      case 'create-app': {
          const app = await createApp()
          console.log(app)
          break;
      }
      case 'email': {
        console.log('Lookup email: ', argv.email);
        const publicKey = await lookupEmailPubKey(argv.email)
	      console.log(publicKey)
	      console.log(Object.keys(publicKey))
        break;
      }
      case 'account': {
        // const { emailAddress } = await getAccountInfo()
        // console.log('Account email: ', emailAddress)
        const accountInfo = await getAccountInfo()
        console.log(accountInfo)
        break;
      }
      case 'document': {
        const document = await downloadDocument(argv.requestId)
        console.log('Document: ', document)
          console.log(
              "\nSignature ID: ", document.signatureId,
              "\nSigner Email address: ", document.signerEmailAddress,
              "\nSigner name: ", document.signerName,
              "\nSignature status code: ", document.statusCode)
        break;
      }
      case 'send': {
          const request = await sendSignatureRequest({
              signers: [{
                  mail: argv.recipientAddress,
                  name: argv.recipientName
              }],
              doc: argv.document,
              testClientId,
              title: "NDA with Acme Co.",
              subject: "The NDA we talked about",
              message: "Please sign this NDA and then we can discuss more. Let me know if you have any questions.",
              fileUrl: ["https://paulklipp.com/images/OnePageContract.pdf"],
              willSend: true,
              testMode: true
          });
          console.log('Request id: ', request.signatureRequest.signatureRequestId)
          console.log('Requester: ', request.signatureRequest.requesterEmailAddress)
          console.log('Details url: ', request.signatureRequest.detailsUrl)
          console.log('Signatures: ', request.signatureRequest.signatures)
          console.log('Request done!')
        break;
      }
    }
})();

// type Account = {
//     accountId: string
//     emailAddress: string
// }

const getAccountInfo = async () => {
    const api = new HelloSignSDK.AccountApi();
    api.username = process.env.HELLOSIGN_API_KEY;
    console.log(process.env.HELLOSIGN_API_KEY)

    const response = await api.accountGet();
    return response.body.account;
}

const downloadDocument = async (requestId) => {
    const api = new HelloSignSDK.SignatureRequestApi();
    api.username = process.env.HELLOSIGN_API_KEY;
    try {
        const sigRequestResp = await api.signatureRequestGet(requestId);
        const signatures = sigRequestResp.body.signatureRequest.signatures;
        const response = await api.signatureRequestFiles(requestId);
        return response.body;
    } catch(error) {
        console.log("Exception when calling HelloSign API:");
        console.log(error.body);
    };
}

const generateSignatureRequestData = ({ signers, doc, clientId, title, subject, message, ccEmailAddresses, fileUrl, testMode }) => {
    const signers = signers.map((signer, index) => ({
        emailAddress: signer.mail,
        name: signer.name,
        order: index,
    }));
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
        signers,
        ccEmailAddresses,
        fileUrl,
        signingOptions,
        testMode,
    };
    return data;
}

const sendSignatureRequest = async ({ mail, name, doc, clientId, title, subject, message, fileUrl, willSend, testMode }) => {
    const api = new HelloSignSDK.SignatureRequestApi();
    api.username = process.env.HELLOSIGN_API_KEY;

    const data = generateSignatureRequestData({
        signers,
        doc,
        clientId,
        title,
        subject,
        message,
        fileUrl,
        testMode })
    try {
        if (willSend) {
            const response = await api.signatureRequestSend(data);
            return response.body;
        } else {
            const response = await api.signatureRequestCreateEmbedded(data);
            return response.body;
        }
    } catch(error) {
        console.log("Exception when calling HelloSign API:");
        console.log(error.body);
    };
}

const lookupEmailPubKey = async (email) => {
  const wkd = new WKD();
  const publicKeyBytes = await wkd.lookup({
    email
  });
	console.log(publicKeyBytes)
  const publicKey = await readKey({
    binaryKey: publicKeyBytes
  });
  return publicKey;
}

const createApp = async () => {
    const api = new HelloSignSDK.ApiAppApi();
    api.username = process.env.HELLOSIGN_API_KEY;

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
        console.log(error.body);
    }
}
