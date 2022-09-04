#!/usr/bin/env node

import WKD from '@openpgp/wkd-client';
import AWS from 'aws-sdk';
import fsPromises from 'fs/promises';
import fs from 'fs';
import * as openpgp from 'openpgp';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as HelloSignSDK from "hellosign-sdk";
// import * from "hellosign-sdk/types";
import axios from 'axios';
const yargs = _yargs(hideBin(process.argv));
import promptSync from 'prompt-sync';
import qr from "qr-image";

const testSignatureRequestId = "709f58c1b9b3e4dbfdce4e6a8aace66b5dd74a3f"
const testClientId = "0839d8330c3e55c4ccd10f52d62376ce";

(async () => {
    const argv = await yargs
      .command('create-app', "Create app to get client ID")
      .command('upload', "Upload a document to sign", {
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
      case "upload": {
          const [encryptedData, signedMessage] = await formatData(
              argv.name,
              argv.recipientAddress,
              argv.publicKey,
              argv.privateKey,
              argv.server);

          await uploadFile(
              encryptedData,
              signedMessage,
              argv.name,
              argv.document,
              argv.recipientAddress,
              argv.recipientName)
          break;

      }
      case 'lookup': {
        console.log('Lookup email: ', argv.email);
        const publicKeys = await lookupEmailPubKey(argv.email, argv.server)
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
const encryptData = async (data, recipientAddress, publicKeyFile, wkdServer) => {
    const pubKeys = !!publicKeyFile ?
          await getPublicKeys(publicKeyFile) :
          await lookupEmailPubKey(recipientAddress, wkdServer)
    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ binary: data }),
        encryptionKeys: pubKeys
    });
    return encrypted
}


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
}

const sendSignatureRequest = async ({ signers, doc, clientId, title, subject, message, fileUrl, willSend, testMode }) => {
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

const lookupEmailPubKey = async (email, server) => {
  console.log('NOT YET IMPLEMENTED: use server ', server)
  const wkd = new WKD();
  const publicKeyBytes = await wkd.lookup({
    email
  });
  return await openpgp.readKey({
    binaryKey: publicKeyBytes
  });
  return publicKeys;
}

const getPublicKeys = async (filename) => {
    return await openpgp.readKey({ armoredKey: await getArmoredFile(filename) });
}

const getDecryptedPrivateKey = async (pkey) => {
    if (pkey.isEncrypted) {
        const prompt = promptSync({ hidden: true, echo: '*' });
        console.log("Enter the passphrase to decrypt your private key:");
        const passphrase = prompt({ echo: '*'});
        return await openpgp.decryptKey({
            privateKey: await getPrivateKey(privateKey),
            passphrase
        });
    } else {
        return pkey;
    }
}

const getPrivateKey = async (filename) => {
    const buf = fs.readFileSync(filename)
    return await openpgp.readPrivateKey({ binaryKey: buf });
}

const getArmoredFile = async (filename) => {
    return await fsPromises.readFile(filename, 'utf8');
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

const formatData = async (filename, recipientAddress, publicKey, privateKey, server) => {
    const data = await fsPromises.readFile(filename)
    const encryptedData = await encryptData(
        data, recipientAddress, publicKey, server)
    console.log('Encrypted data:\n', encryptedData)

    const pkey = await getPrivateKey(privateKey)
    const privateKeyDecrypted = await getDecryptedPrivateKey(pkey)

    const unsignedMessage = await openpgp.createMessage(
        { binary: data });

    const signedMessage = await openpgp.sign({
        message: unsignedMessage,
        signingKeys: privateKeyDecrypted
    });
    console.log('Signed message:\n', signedMessage)

    return [encryptedData, signedMessage]
}

const createQrCode = async (encryptedData) => {
    const qrPdf = qr.image(signaturePdf, { type: 'pdf' })
    qrPdf.pipe(fs.createWriteStream('encrypted_data.pdf'))
    console.log('Qr code generated...')

}

const uploadFile = async (encryptedData, signedMessage, filename, doc, recipientAddress, recipientName) => {
    const s3 = new AWS.S3({
        endpoint: 'https://s3.filebase.com',
        region: 'us-east-1',
        signatureVersion: 'v4',
        accessKeyId: process.env.FILEBASE_ACCESS_KEY_ID,
        secretAccessKey: process.env.FILEBASE_SECRET_ACCESS_KEY,
    });

    try {
        const params = {
            Bucket: 'hellosign',
            Key: filename,
            Body: encryptedData,
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
                testClientId,
                title: "Signature for " + filename,
                subject: "Signature request for " + filename,
                message: "<div>You can access the encrypted document from this URL: <br /></div>" + fileBaseGatewayUrl + "<br />",
                fileUrl: [],
                willSend: true,
                testMode: true
            });
            console.log('Request id: ', request.signatureRequest.signatureRequestId)
            console.log('Requester: ', request.signatureRequest.requesterEmailAddress)
            console.log('Details url: ', request.signatureRequest.detailsUrl)
            console.log('Signatures: ', request.signatureRequest.signatures)
            console.log('Request done!')
        })
        await request.send()
    } catch (error) {
        console.log(error)
    }
}
