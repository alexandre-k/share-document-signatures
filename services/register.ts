import SimpleWebAuthnBrowser from '@simplewebauthn/browser';
import { startRegistration } from '@simplewebauthn/browser';
import { startAuthentication } from '@simplewebauthn/browser';


export const registerUser = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/auth/get-registration-options')
        const { value: optionsBytes } = await response.body.getReader().read()
        const decoder = new TextDecoder();
        const options = JSON.parse(decoder.decode(optionsBytes))

        // Pass the options to the authenticator and wait for a response
        const resp = await startRegistration(options);
        // @simplewebauthn/server -> verifyRegistrationResponse()
        console.log('RESP > ', resp)
        const verificationResp = await fetch('http://localhost:3000/api/auth/verify-registration', {
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
