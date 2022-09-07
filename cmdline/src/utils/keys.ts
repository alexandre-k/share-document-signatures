import axios from 'axios';
import fsPromises from 'fs/promises';
import fs from 'fs';
import * as openpgp from 'openpgp';
import promptSync from 'prompt-sync';
import logger from '../logger';

export const getPublicKeys = async (filename: string): Promise<openpgp.Key> => {
  return openpgp.readKey({ armoredKey: await getArmoredFile(filename) });
};

export const getPrivateKey = async (
  filename: string,
): Promise<openpgp.PrivateKey> => {
  const buf = fs.readFileSync(filename);
  return openpgp.readPrivateKey({ binaryKey: buf });
};

export const encryptDataAndSign = async (
  data: Buffer,
  email: string,
  publicKeyFile: string | null,
  wkdServer: string,
  privateKey: openpgp.PrivateKey,
): Promise<string> => {
  let pubKeys = null;
  if (email && !publicKeyFile) {
    pubKeys = await lookupEmailPubKey(email, wkdServer);
  } else if (publicKeyFile) {
    pubKeys = await getPublicKeys(publicKeyFile);
  } else {
    throw new Error('No public key found!');
  }
  return openpgp.encrypt({
    message: await openpgp.createMessage({ binary: data }),
    encryptionKeys: pubKeys,
    signingKeys: privateKey,
  });
};

export const lookupEmailPubKey = async (
  email: string,
  server: string,
): Promise<openpgp.Key> => {
  try {
    const apiUrl = 'https://' + server + '/vks/v1/by-email/' + email;
    logger.debug('API call to: ' + apiUrl);
    const response = await axios.get(apiUrl);
    return openpgp.readKey({
      armoredKey: response.data,
    });
  } catch (error) {
    logger.error(error.message);
    return Promise.reject('Sorry, the lookup for "' + email + '" failed...');
  }
};

export const toArmorFormat = (publicKey: openpgp.Key): string => {
  return publicKey.toPublic().armor();
};

export const getDecryptedPrivateKey = async (
  privateKeyFile: string,
): Promise<openpgp.PrivateKey> => {
  const pkey = await getPrivateKey(privateKeyFile);
  if (!pkey.isDecrypted()) {
    const prompt = promptSync();
    const passphrase = prompt({
      echo: '*',
      ask: 'Enter the passphrase to decrypt your private key:',
    });
    return openpgp.decryptKey({
      privateKey: pkey,
      passphrase,
    });
  } else {
    return pkey;
  }
};

export const getArmoredFile = async (filename: string): Promise<string> => {
  return fsPromises.readFile(filename, 'utf8');
};

export const formatData = async (
  filename: string,
  email: string,
  publicKey: string | null,
  privateKeyFile: string,
  server: string,
): Promise<string> => {
  const data = await fsPromises.readFile(filename);

  const privateKeyDecrypted = await getDecryptedPrivateKey(privateKeyFile);

  return encryptDataAndSign(
    data,
    email,
    publicKey,
    server,
    privateKeyDecrypted,
  );
};
