#!/usr/bin/env node
import yargs from 'yargs';
import { formatData, lookupEmailPubKey } from "./utils/keys";
import { createApp, downloadDocument, getAccountInfo, sendSignatureRequest, uploadFile } from './api';

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
              type: 'string',
              default: "john.doe@example.com"
          },
          recipientName: {
              description: "Name of the recipient of the signature request",
              alias: 'rname',
              type: 'string',
              default: "John Doe"
          },
          name: {
              description: "Name of the document",
              alias: "n",
              type: "string",
              default: "document.pdf"
          },
          publicKey: {
              description: "Public key of recipient",
              alias: "pub",
              type: "string",
              default: "./public.key"
          },
          privateKey: {
              description: "Your own Private key",
              alias: "priv",
              type: "string",
              default: "./private.key"
          },
          server: {
              description: "Default server used for lookup",
              alias: "s",
              type: "string",
              default: "keys.openpgp.org"
          }
      })
      .command("lookup", "Email address used for signatures", {
          recipientAddress: {
              description:
              "Mail address for the recipient of the signature request",
              alias: 'raddr',
              type: 'string',
              default: "john.doe@example.com"
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
              type: 'string',
              default: "document.pdf"
          },
          recipientAddress: {
              description:
                  "Mail address for the recipient of the signature request",
              alias: 'raddr',
              type: 'string',
              default: "john.doe@example.com"
          },
          recipientName: {
              description: "Name of the recipient of the signature request",
              alias: 'rname',
              type: 'string',
              default: "John Doe"
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

    const [ cmd, _ ] = argv._;

    switch (cmd) {
      case 'create-app': {
          const app = await createApp()
          console.log(app)
          break;
      }
      case "upload": {
          const encryptedData = await formatData(
              argv.name as string,
              argv.recipientAddress as string,
              argv.publicKey as string,
              argv.privateKey as string,
              argv.server as string);

          await uploadFile(
              // @ts-ignore
              encryptedData,
              argv.name as string,
              testClientId,
              argv.recipientAddress as string,
              argv.recipientName as string)
          break;

      }
      case 'lookup': {
        console.log('Lookup email: ', argv.recipientAddress);
        const publicKeys = await lookupEmailPubKey(argv.recipientAddress as string, argv.server as string)
          console.log("Public keys: ", publicKeys)
        break;
      }
      case 'account': {
        const accountInfo = await getAccountInfo()
        console.log(accountInfo)
        break;
      }
      case 'document': {
          if (!argv.requestId) console.log('Needs a request id to fetch signatures related to a document.')
        const signatures = await downloadDocument(argv.requestId as string)
          if (!!signatures)
              signatures.map(sig => {
                  console.log(
                      "\n\n=============",
                      "\nSignature ID: ", sig.signatureId,
                      "\nSigner Email address: ", sig.signerEmailAddress,
                      "\nSigner name: ", sig.signerName,
                      "\n=============")
              })
        break;
      }
      case 'send': {
          const request = await sendSignatureRequest({
              signers: [{
                  mail: argv.recipientAddress as string,
                  name: argv.recipientName as string
              }],
              clientId: testClientId,
              title: "NDA with Acme Co.",
              subject: "The NDA we talked about",
              message: "Please sign this NDA and then we can discuss more. Let me know if you have any questions.",
              fileUrl: "https://paulklipp.com/images/OnePageContract.pdf",
              testMode: true
          });
          if (request !== undefined && request.signatureRequest !== undefined) {
            console.log('Request id: ', request.signatureRequest.signatureRequestId)
            console.log('Requester: ', request.signatureRequest.requesterEmailAddress)
            console.log('Details url: ', request.signatureRequest.detailsUrl)
            console.log('Signatures: ', request.signatureRequest.signatures)
            console.log('Request done!')
          } else {
              console.log('Unable to send a signature request...')
          }
        break;
      }
    }
})();
