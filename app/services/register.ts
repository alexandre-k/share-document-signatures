import { bufferToBase64Url, base64ToBuffer } from '../utils/encoding';


export const registerUser = async (username: string) => {
    if (username === "") {
        console.log("Username not found!")
        return -1
    }
    try {
        const response = await fetch(
            window.location.origin + '/api/fido/register', {
            method: 'POST',
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({ username })
        })
        const { options } = await response.json()
        options.publicKey.challenge = base64ToBuffer(options.publicKey.challenge);
        options.publicKey.user.id = base64ToBuffer(options.publicKey.user.id);

        const newCredential = await navigator.credentials.create({
            publicKey: options.publicKey
        });

        console.log("New credential:  ", newCredential)
        const decodedCredential = {
            rawId: bufferToBase64Url(newCredential.rawId),
            id: newCredential.id,
            response: {
                attestationObject: bufferToBase64Url(newCredential.response.attestationObject),
                clientDataJSON: bufferToBase64Url(newCredential.response.clientDataJSON),
            },
            type: newCredential.type
        }
        console.log(JSON.stringify(decodedCredential))
        const verificationResp = await fetch(
            window.location.origin + "/api/fido/register/" + username + "/verify",
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(decodedCredential)
            }
        );

        const { credential } = await verificationResp.json()
        console.log('verified credential ', JSON.parse(credential))
        localStorage['credential'] = credential;
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
