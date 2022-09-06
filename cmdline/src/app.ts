#!/usr/bin/env node
import yargs from 'yargs';
import * as dotenv from 'dotenv';
import { formatData, lookupEmailPubKey } from './utils/keys';
import {
  createApp,
  downloadDocument,
  getAccountInfo,
  sendSignatureRequest,
  uploadFile,
} from './api';
import logger from './logger';

// const testSignatureRequestId = "709f58c1b9b3e4dbfdce4e6a8aace66b5dd74a3f"
const testClientId = '0839d8330c3e55c4ccd10f52d62376ce';

dotenv.config();

(async (): Promise<void> => {
  const argv = await yargs
    .command('create-app', 'Create an app to get a client ID from HelloSign', {
      name: {
        description: 'Name of the app to create',
        alias: 'name',
        type: 'string',
        default: 'My Production App',
      },
      domains: {
        description: 'A domain to create the app for',
        alias: 'domain',
        type: 'string',
        default: ['example.com'],
      },
    })
    .command('upload', 'Upload a document to sign', {
      recipientAddress: {
        description: 'Mail address for the recipient of the signature request',
        alias: 'raddr',
        type: 'string',
        default: 'john.doe@example.com',
      },
      recipientName: {
        description: 'Name of the recipient of the signature request',
        alias: 'rname',
        type: 'string',
        default: 'John Doe',
      },
      name: {
        description: 'Name of the document',
        alias: 'n',
        type: 'string',
        default: 'document.pdf',
      },
      publicKey: {
        description: 'Public key of recipient',
        alias: 'pub',
        type: 'string',
        default: './public.key',
      },
      privateKey: {
        description: 'Your own Private key',
        alias: 'priv',
        type: 'string',
        default: './private.key',
      },
      server: {
        description: 'Default server used for lookup',
        alias: 's',
        type: 'string',
        default: 'keys.openpgp.org',
      },
    })
    .command('lookup', 'Email address used for signatures', {
      recipientAddress: {
        description: 'Mail address for the recipient of the signature request',
        alias: 'raddr',
        type: 'string',
        default: 'john.doe@example.com',
      },
      server: {
        description: 'Default server used for lookup',
        alias: 's',
        type: 'string',
        default: 'keys.openpgp.org',
      },
    })
    .command('account', 'Get account used for signatures')
    .command('document', 'Get documents', {
      requestId: {
        description: 'Request id of document to sign',
        alias: 'rid',
        type: 'string',
      },
    })
    .command('send', 'Send request', {
      document: {
        description: 'Document to sign',
        alias: 'doc',
        type: 'string',
        default: 'document.pdf',
      },
      recipientAddress: {
        description: 'Mail address for the recipient of the signature request',
        alias: 'raddr',
        type: 'string',
        default: 'john.doe@example.com',
      },
      recipientName: {
        description: 'Name of the recipient of the signature request',
        alias: 'rname',
        type: 'string',
        default: 'John Doe',
      },
      clientId: {
        description: 'App id generated',
        alias: 'cid',
        type: 'string',
        default: testClientId,
      },
    })
    .help()
    .alias('help', 'h').argv;

  const [cmd] = argv._;

  switch (cmd) {
    case 'create-app': {
      const app = await createApp({
        name: argv.name as string,
        domains: argv.domain as string[],
      });
      if (app) logger.info(app);
      break;
    }
    case 'upload': {
      const encryptedData = await formatData(
        argv.name as string,
        argv.recipientAddress as string,
        argv.publicKey as string,
        argv.privateKey as string,
        argv.server as string,
      );

      logger.info('Encrypted data:\n', encryptedData);
      await uploadFile(
        encryptedData,
        argv.name as string,
        testClientId,
        argv.recipientAddress as string,
        argv.recipientName as string,
      );
      break;
    }
    case 'lookup': {
      logger.info('Lookup email: ', argv.recipientAddress);
      const publicKeys = await lookupEmailPubKey(
        argv.recipientAddress as string,
        argv.server as string,
      );
      if (publicKeys) logger.info(publicKeys);
      break;
    }
    case 'account': {
      const accountInfo = await getAccountInfo();
      logger.info(accountInfo);
      break;
    }
    case 'document': {
      if (!argv.requestId) {
        logger.error(
          'Needs a request id to fetch signatures related to a document.',
        );
      } else {
        const signatures = await downloadDocument(argv.requestId as string);
        if (signatures)
          signatures.map((sig) => {
            logger.info(
              '\n\n=============',
              '\nSignature ID: ',
              sig.signatureId,
              '\nSigner Email address: ',
              sig.signerEmailAddress,
              '\nSigner name: ',
              sig.signerName,
              '\n=============',
            );
          });
      }
      break;
    }
    case 'send': {
      const request = await sendSignatureRequest({
        signers: [
          {
            mail: argv.recipientAddress as string,
            name: argv.recipientName as string,
          },
        ],
        clientId: testClientId,
        title: 'NDA with Acme Co.',
        subject: 'The NDA we talked about',
        message:
          'Please sign this NDA and then we can discuss more. Let me know if you have any questions.',
        fileUrl: 'https://paulklipp.com/images/OnePageContract.pdf',
        testMode: true,
      });
      if (request !== undefined && request.signatureRequest !== undefined) {
        logger.info(
          'Request id: ',
          request.signatureRequest.signatureRequestId,
        );
        logger.info(
          'Requester: ',
          request.signatureRequest.requesterEmailAddress,
        );
        logger.info('Details url: ', request.signatureRequest.detailsUrl);
        logger.info('Signatures: ', request.signatureRequest.signatures);
        logger.info('Request done!');
      } else {
        logger.error('Unable to send a signature request...');
      }
      break;
    }
    default: {
      yargs.showHelp();
      break;
    }
  }
})();
