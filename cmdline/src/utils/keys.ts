import { WKD } from '@openpgp/wkd-client';
import fsPromises from 'fs/promises';
import fs from 'fs';
import * as openpgp from 'openpgp';
import promptSync from 'prompt-sync';
console.log('WKD > ', WKD)

export const getPublicKeys = async (filename: string) => {
    return await openpgp.readKey({ armoredKey: await getArmoredFile(filename) });
}

export const getPrivateKey = async (filename: string) => {
    const buf = fs.readFileSync(filename)
    return await openpgp.readPrivateKey({ binaryKey: buf });
}

export const encryptDataAndSign = async (data: Buffer, recipientAddress: string, publicKeyFile: string, wkdServer: string, privateKey: openpgp.PrivateKey) => {
    const pubKeys = !!publicKeyFile ?
        await getPublicKeys(publicKeyFile) :
        await lookupEmailPubKey(recipientAddress, wkdServer)
    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ binary: data }),
        encryptionKeys: pubKeys,
        signingKeys: privateKey
    });
    return encrypted
}

export const lookupEmailPubKey = async (email: string, server: string) => {
    console.log('NOT YET IMPLEMENTED: use server ', server)
    const wkd = new WKD();
    const publicKeyBytes = await wkd.lookup({
        email
    });
    return await openpgp.readKey({
        binaryKey: publicKeyBytes
    });
}

export const getDecryptedPrivateKey = async (privateKeyFile: string) => {
    const pkey = await getPrivateKey(privateKeyFile)
    if (!pkey.isDecrypted()) {
        // @ts-ignore
        const prompt = promptSync({ hidden: true, echo: '*' });
        console.log("Enter the passphrase to decrypt your private key:");
        const passphrase = prompt({ echo: '*'});
        return await openpgp.decryptKey({
            privateKey: pkey,
            passphrase
        });
    } else {
        return pkey;
    }
}

export const getArmoredFile = async (filename: string) => {
    return await fsPromises.readFile(filename, 'utf8');
}

export const formatData = async (filename: string, recipientAddress: string, publicKey: string, privateKeyFile: string, server: string) => {
    const data = await fsPromises.readFile(filename)

    const privateKeyDecrypted = await getDecryptedPrivateKey(privateKeyFile)

    const encryptedData = await encryptDataAndSign(
        data, recipientAddress, publicKey, server, privateKeyDecrypted)
    console.log('Encrypted data:\n', encryptedData)

    return encryptedData
}
