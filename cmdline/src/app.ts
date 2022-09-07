#!/usr/bin/env node
import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as dotenv from 'dotenv';
import { formatData, lookupEmailPubKey, toArmorFormat } from './utils/keys';
import {
  createApp,
  listApp,
  downloadDocument,
  getAccountInfo,
  // sendSignatureRequest,
  uploadFile,
} from './api';
import logger from './logger';

// const testSignatureRequestId = "709f58c1b9b3e4dbfdce4e6a8aace66b5dd74a3f"
// const testClientId = '0839d8330c3e55c4ccd10f52d62376ce';

dotenv.config();

(async (): Promise<void> => {
  const argv = await yargs(hideBin(process.argv))
    .command(
      'app',
      'List or create an app to get a client ID from HelloSign',
      (args: Argv) => {
        args
          .positional('name', {
            description: 'Name of the app to create',
            alias: 'name',
            type: 'string',
            default: 'My Production App',
          })
          .positional('domain', {
            description: 'Domain to create the app for',
            alias: 'domain',
            type: 'string',
            default: 'example.com',
          })
          .option('create', {
            description: 'Pass create to create an app',
            type: 'boolean',
            default: false,
          });
      },
    )
    .command('send', 'Upload and send a document to sign', (args: Argv) => {
      args
        .positional('filename', {
          description: 'File name and path to the document uploaded',
          alias: 'n',
          type: 'string',
        })
        .option('clientId', {
          description: 'Client ID related to an application',
          alias: 'c',
          type: 'string',
        })
        .option('to', {
          description: 'Mail address for the recipient used for encryption',
          alias: 't',
          type: 'string',
        })
        .option('fullname', {
          description:
            'Firstname and lastname of the recipient of the signature request',
          alias: 'f',
          type: 'string',
          default: 'Anonymous',
        })

        .option('publicKey', {
          description: 'Public key of recipient',
          alias: 'pub',
          type: 'string',
        })
        .option('privateKey', {
          description: 'Your own Private key',
          alias: 'priv',
          type: 'string',
          default: './private.key',
        })
        .option('server', {
          description: 'Default server used for lookup',
          alias: 's',
          type: 'string',
          default: 'keys.openpgp.org',
        });
    })
    .command(
      'lookup',
      'Lookup the public key used for signatures',
      (args: Argv) => {
        args
          .positional('email', {
            description:
              'Mail address for the recipient of the signature request',
            alias: 'e',
            type: 'string',
          })
            .option('fingerprint', {
                description: 'Show fingerprint instead of public key',
                alias: 'f',
                type: 'boolean',
                default: false
            })
          .option('server', {
            description: 'Default server used for lookup',
            alias: 's',
            type: 'string',
            default: 'keys.openpgp.org',
          });
      },
    )
    .command('account', 'Get account used for signatures')
    .command('document', 'Get documents', (yargs) => {
      return yargs.positional('requestId', {
        description: 'Request id of document to sign',
        alias: 'rid',
        type: 'string',
      });
    })
    // .command('send', 'Send request', (yargs) => {
    //   return yargs
    //     .positional('document', {
    //       description: 'Document to sign',
    //       alias: 'doc',
    //       type: 'string',
    //       default: 'document.pdf',
    //     })
    //     .positional('recipientAddress', {
    //       description:
    //         'Mail address for the recipient of the signature request',
    //       alias: 'raddr',
    //       type: 'string',
    //       default: 'john.doe@example.com',
    //     })
    //     .positional('recipientName', {
    //       description: 'Name of the recipient of the signature request',
    //       alias: 'rname',
    //       type: 'string',
    //       default: 'John Doe',
    //     })
    //     .positional('clientId', {
    //       description: 'App id generated',
    //       alias: 'cid',
    //       type: 'string',
    //       default: testClientId,
    //     });
    // })
    .demandCommand()
    .help()
    .alias('help', 'h')
    .wrap(72)
    .parse();

  const [cmd] = argv._;
  switch (cmd) {
    case 'app': {
      if (argv.create) {
        const [, name, domain] = argv._;
        if (!name || !(domain && argv.domain)) {
          logger.warn(
            'Need a name and domains as positional parameters to create your app.',
          );
          return;
        }
        const app = await createApp({
          name: String(name),
          domains: [String(domain)] || [String(argv.domain)],
        });
        if (app) logger.info(app);
      } else {
        logger.info('Fetching a list of your applications...');
        const apps = await listApp();
        if (apps && apps.apiApps !== undefined) {
          logger.debug(apps.apiApps);
          if (apps.apiApps.length > 0) {
            const firstApp = apps.apiApps[0];
            logger.info('Found the application below:');
            logger.info('- Client id: ' + firstApp.clientId);
            logger.info('- Name: ' + firstApp.name);
            logger.info(
              '- Owner account id: ' + firstApp.ownerAccount?.accountId,
            );
            logger.info(
              '- Owner account mail: ' + firstApp.ownerAccount?.emailAddress,
            );
          }
        }
      }
      break;
    }
    case 'send': {
      if (
        argv.filename === undefined ||
        argv.to === undefined ||
        argv.clientId === undefined
      ) {
        logger.warn(
          'To send a signature request you need to provide at least:',
        );
        logger.warn('- "--filename", a file locally available');
        logger.warn(
          '- "--to " || "--publicKey", an email address or a public key to encrypt the file with',
        );
        logger.warn('- "--clientId", the client ID for your app.');
        return;
      }
      try {
        const encryptedData = await formatData(
          String(argv.filename),
          String(argv.to),
          !argv.publicKey ? null : String(argv.publicKey),
          String(argv.privateKey),
          String(argv.server),
        );

        logger.info('Data encryption done!');
        // logger.debug(encryptedData);
          console.log('UPLOAD FILE')

        await uploadFile(
          encryptedData,
          String(argv.filename),
          String(argv.clientId),
          String(argv.to),
          String(argv.fullname),
        );
      } catch (error) {
        logger.error(error.message);
        return;
      }

      break;
    }
    case 'lookup': {
      const [, email] = argv._;
      logger.info('Lookup email: ', email);
      if (!email) {
        logger.warn('No email passed as positional parameter');
        return;
      }
      try {
        const publicKey = await lookupEmailPubKey(
          String(email),
          String(argv.server),
        );

        if (publicKey && !argv.fingerprint) {
          logger.info('Armored public key associated to ' + email);
          logger.info(toArmorFormat(publicKey));
        } else {
            logger.info('Fingerprint and key ID of the public key associated to ' + email);
            logger.info('- Fingerprint: ' + publicKey.getFingerprint());
            logger.info('- Key ID: ' + publicKey.getKeyID().toHex());
        }
      } catch (err) {
        logger.error(err);
      }
      break;
    }
    case 'account': {
      const accountInfo = await getAccountInfo();
      logger.debug(accountInfo);
      logger.info('Found an account below associated to your API key:');
      logger.info('- Account id: ' + accountInfo?.accountId);
      logger.info('- Email address: ' + accountInfo?.emailAddress);
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
    // case 'send': {
    //   const request = await sendSignatureRequest({
    //     signers: [
    //       {
    //         mail: argv.recipientAddress,
    //         name: argv.recipientName,
    //       },
    //     ],
    //     clientId: testClientId,
    //     title: 'NDA with Acme Co.',
    //     subject: 'The NDA we talked about',
    //     message:
    //       'Please sign this NDA and then we can discuss more. Let me know if you have any questions.',
    //     fileUrl: 'https://paulklipp.com/images/OnePageContract.pdf',
    //     testMode: true,
    //   });
    //   if (request !== undefined && request.signatureRequest !== undefined) {
    //     logger.info(
    //       'Request id: ',
    //       request.signatureRequest.signatureRequestId,
    //     );
    //     logger.info(
    //       'Requester: ',
    //       request.signatureRequest.requesterEmailAddress,
    //     );
    //     logger.info('Details url: ', request.signatureRequest.detailsUrl);
    //     logger.info('Signatures: ', request.signatureRequest.signatures);
    //     logger.info('Request done!');
    //   } else {
    //     logger.error('Unable to send a signature request...');
    //   }
    //   break;
    // }
    default: {
      yargs.showHelp();
      break;
    }
  }
})();
