#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as dotenv from 'dotenv';
import { formatData, lookupEmailPubKey } from './utils/keys';
import {
  createApp,
  listApp,
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
  const argv = await yargs(hideBin(process.argv))
    .command(
      'app',
      'List or create an app to get a client ID from HelloSign',
      (yargs) => {
        return yargs
          .positional('name', {
            description: 'Name of the app to create',
            alias: 'name',
            type: 'string',
            default: 'My Production App'
          })
          .positional('domain', {
            description: 'A domain to create the app for',
            alias: 'domain',
            type: 'string',
            default: ['example.com']
          })
        .option('create', {
            description: 'Pass create to create an app',
            type: 'boolean'
            default: false
        })
      },
    )
    .command('upload', 'Upload a document to sign', (yargs) => {
      return yargs
        .positional('recipientAddress', {
          description:
            'Mail address for the recipient of the signature request',
          alias: 'raddr',
          type: 'string',
          default: 'john.doe@example.com',
        })
        .positional('recipientName', {
          description: 'Name of the recipient of the signature request',
          alias: 'rname',
          type: 'string',
          default: 'John Doe',
        })
        .positional('name', {
          description: 'Name of the document',
          alias: 'n',
          type: 'string',
          default: 'document.pdf',
        })
        .positional('publicKey', {
          description: 'Public key of recipient',
          alias: 'pub',
          type: 'string',
          default: './public.key',
        })
        .positional('privateKey', {
          description: 'Your own Private key',
          alias: 'priv',
          type: 'string',
          default: './private.key',
        })
        .positional('server', {
          description: 'Default server used for lookup',
          alias: 's',
          type: 'string',
          default: 'keys.openpgp.org',
        });
    })
    .command('lookup', 'Email address used for signatures', (yargs) => {
      return yargs
        .positional('recipientAddress', {
          description:
            'Mail address for the recipient of the signature request',
          alias: 'raddr',
          type: 'string',
          default: 'john.doe@example.com',
        })
        .positional('server', {
          description: 'Default server used for lookup',
          alias: 's',
          type: 'string',
          default: 'keys.openpgp.org',
        });
    })
    .command('account', 'Get account used for signatures')
    .command('document', 'Get documents', (yargs) => {
      return yargs.positional('requestId', {
        description: 'Request id of document to sign',
        alias: 'rid',
        type: 'string',
      });
    })
    .command('send', 'Send request', (yargs) => {
      return yargs
        .positional('document', {
          description: 'Document to sign',
          alias: 'doc',
          type: 'string',
          default: 'document.pdf',
        })
        .positional('recipientAddress', {
          description:
            'Mail address for the recipient of the signature request',
          alias: 'raddr',
          type: 'string',
          default: 'john.doe@example.com',
        })
        .positional('recipientName', {
          description: 'Name of the recipient of the signature request',
          alias: 'rname',
          type: 'string',
          default: 'John Doe',
        })
        .positional('clientId', {
          description: 'App id generated',
          alias: 'cid',
          type: 'string',
          default: testClientId,
        });
    })
    .demandCommand()
    .help()
    .alias('help', 'h')
    .wrap(72)
    .parse();

  const [cmd] = argv._;

  switch (cmd) {
    case 'app': {
        console.log('argv ', argv)
        if (argv.create) {
            const app = await createApp({
                name: argv.name,
                domains: argv.domain,
            });
            if (app) logger.info(app);
        } else {
            const app = await listApp()
            if (app) logger.info(app);
        }
      break;
    }
    case 'upload': {
      const encryptedData = await formatData(
        argv.name,
        argv.recipientAddress,
        argv.publicKey,
        argv.privateKey,
        argv.server,
      );

      logger.info('Encrypted data:\n', encryptedData);
      await uploadFile(
        encryptedData,
        argv.name,
        testClientId,
        argv.recipientAddress,
        argv.recipientName,
      );
      break;
    }
    case 'lookup': {
      logger.info('Lookup email: ', argv.recipientAddress);
      const publicKeys = await lookupEmailPubKey(
        argv.recipientAddress,
        argv.server
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
        const signatures = await downloadDocument(argv.requestId);
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
            mail: argv.recipientAddress,
            name: argv.recipientName,
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
