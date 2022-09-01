#!/usr/bin/env node

import WKD from '@openpgp/wkd-client';
import { readKey } from 'openpgp';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const yargs = _yargs(hideBin(process.argv));

(async () => {
    const argv = await yargs
      .command('email', 'Email address used for signatures', {
          lookup: {
              description: 'Email address to sign with',
              alias: 'e',
              type: 'string'
          }
      })
      .option('Fetch request', {
          alias: 't',
          description: 'Tell the present Time',
          type: 'boolean'
      })
      .help()
      .alias('help', 'h').argv;

    if (argv.email) {
        console.log('Lookup email: ', argv.email);
        const publicKey = await lookupEmailPubKey(argv.email)
	      console.log(publicKey)
	      console.log(Object.keys(publicKey))
    }
})();


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


