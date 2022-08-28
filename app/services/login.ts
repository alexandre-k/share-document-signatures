import { bufferToBase64Url, base64ToBuffer } from '../utils/encoding';

export const login = async (username) => {
    // const stringifiedVerif = localStorage['verification'];
    // console.log(JSON.parse(stringifiedVerif))
    if (username === "") {
        console.log("Username not found!")
        return -1
    }
    try {
        const response = await fetch(
            window.location.origin + '/api/fido/login/' + username, {
            method: 'POST',
            headers: {
                "Content-type": "application/json"
            },
            // body: JSON.stringify({ username })
        })
        const { publicKey }= await response.json()
        console.log('Public key: ', publicKey)
        const options = {
            publicKey: {
                challenge: base64ToBuffer(publicKey.challenge),
                allowCredentials: publicKey.allowCredentials.map(cred => ({
                    type: cred.type,
                    id: base64ToBuffer(cred.id)
                }))
            },
        }

        const assertion = await navigator.credentials.get({
            publicKey: options.publicKey
        });

        const assertResp = assertion.response

        console.log("Assertion: ", assertion)
        const verifResponse = await fetch(
            window.location.origin + '/api/fido/login/' + username + '/verify', {
                method: 'POST',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    id: assertion.id,
                    rawId: bufferToBase64Url(assertion.rawId),
                    type: assertion.type,
                    response: {
                        authenticatorData: bufferToBase64Url(assertResp.authenticatorData),
                        clientDataJSON: bufferToBase64Url(assertResp.clientDataJSON),
                        signature: bufferToBase64Url(assertResp.signature),
                        userHandle: bufferToBase64Url(assertResp.userHandle)
                    }
                })
            })

        const jsonData = await verifResponse.json()
        console.log('Data: ', jsonData)
        // localStorage['credential'] = credential;
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
