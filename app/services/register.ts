import SimpleWebAuthnBrowser from '@simplewebauthn/browser';
import { startRegistration } from '@simplewebauthn/browser';
import { startAuthentication } from '@simplewebauthn/browser';


export const registerUser = async () => {
    try {
        const response = await fetch('http://localhost/api/fido/register')
        const { value: optionsBytes } = await response.body.getReader().read()
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const optionsBody = JSON.parse(decoder.decode(optionsBytes))
        const credentialOptions = optionsBody.options
        credentialOptions.publicKey.challenge = encoder.encode(credentialOptions.publicKey.challenge)
        credentialOptions.publicKey.user.id = encoder.encode(credentialOptions.publicKey.user.id)
        const newCredential = await navigator.credentials.create({
            publicKey: { ...credentialOptions.publicKey }
        });
        // registerNewCredential(newCredential);
        console.log('Credential: ', JSON.stringify(newCredential))
        const verificationResp = await fetch('http://localhost/api/fido/register/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newCredential),
        });
        const { value: verificationBytes } = await verificationResp.body.getReader().read();
        const stringifiedVerif = Buffer.from(verificationBytes).toString('utf-8');
        console.log('verification ', JSON.parse(stringifiedVerif))
        localStorage['verification'] = stringifiedVerif;
    } catch (error) {
        // Some basic error handling
        if (error.name === 'InvalidStateError') {
            // elemError.innerText = 'Error: Authenticator was probably already registered by user';
        } else {
            // elemError.innerText = error;
        }

        console.log(error)
        // throw error;
    }
}
