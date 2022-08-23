import SimpleWebAuthnBrowser from '@simplewebauthn/browser';
import { startRegistration } from '@simplewebauthn/browser';
import { startAuthentication } from '@simplewebauthn/browser';


export const registerUser = async () => {
    try {
        const response = await fetch('http://localhost/api/fido/register', {
            method: 'POST',
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({username: 'john'})
        })
        const { value: optionsBytes } = await response.body.getReader().read()
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const optionsBody = JSON.parse(decoder.decode(optionsBytes))
        // const credentialOptions = optionsBody.options
        const options = optionsBody.options;

        const credentialOptionsPublicKey = {
            ...options.publicKey,
            challenge: encoder.encode(options.publicKey.challenge),
            user: {
                id: encoder.encode(options.publicKey.user.id),
                name: encoder.encode(options.publicKey.user.name),
                displayName: encoder.encode(options.publicKey.user.name)
            },
            authenticatorSelection: {
                userVerification: "preferred"
            }
        };

        const newCredential = await navigator.credentials.create({...options, ...{
                publicKey: { ...credentialOptionsPublicKey },
        }});

        // registerNewCredential(newCredential);
        const decodedCredential = {
            username: options.publicKey.user.name,
            challenge: options.publicKey.challenge,
            authenticatorAttachment: newCredential.authenticatorAttachment,
            id: newCredential.id,
            response: {
                attestationObject: btoa(String.fromCharCode(...new Uint8Array(newCredential.response.attestationObject))),
                clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(newCredential.response.clientDataJSON)))
            },
            type: newCredential.type
        }
        console.log(JSON.stringify(decodedCredential))
        const verificationResp = await fetch("http://localhost/api/fido/register/verify", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(decodedCredential),
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
