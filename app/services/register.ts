import SimpleWebAuthnBrowser from '@simplewebauthn/browser';
import { startRegistration } from '@simplewebauthn/browser';
import { startAuthentication } from '@simplewebauthn/browser';


export const registerUser = async () => {
    try {
        const response = await fetch('http://localhost/api/register')
        console.log('RESPONSE > ', response)
        const { value: optionsBytes } = await response.body.getReader().read()
        console.log('RESPONSE > ', optionsBytes)
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const optionsBody = JSON.parse(decoder.decode(optionsBytes))
        const credentialOptions = optionsBody.options
        console.log('RESPONSE > ', credentialOptions.publicKey)
        credentialOptions.publicKey.challenge = encoder.encode(credentialOptions.publicKey.challenge)
        credentialOptions.publicKey.user.id = encoder.encode(credentialOptions.publicKey.user.id)
        console.log('RESPONSE > ', credentialOptions.publicKey)
        const newCredential = await navigator.credentials.create({
            publicKey: { ...credentialOptions.publicKey }
        });
        console.log("PublicKeyCredential Created");
        console.log(newCredential);
        // state.createResponse = newCredential;
        // registerNewCredential(newCredential);
        // Pass the options to the authenticator and wait for a response
        // const resp = await startRegistration(optionsBody.options.publicKey);
        // @simplewebauthn/server -> verifyRegistrationResponse()
        console.log('RESP > ', resp)
        const verificationResp = await fetch('http://localhost/api/auth/verify-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resp),
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
