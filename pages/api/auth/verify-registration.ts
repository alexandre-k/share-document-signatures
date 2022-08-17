import type { NextApiRequest, NextApiResponse } from 'next'
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';

type Account = {
    accountId: string
    emailAddress: string
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Account>
) {
    const user: UserModel = getUserFromDB(1000);
    // Wait for the results of verification
    const expectedChallenge: string = getUserCurrentChallenge(user)
    const rpID = 'localhost';

    try {
        console.log('REQ > ', req.body, req.headers.host)
        const origin = req.headers.host;
        const verification = await verifyRegistrationResponse({
            credential: req.body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).send({ error: error.message });
}

    // Show UI appropriate for the `verified` status
    if (verificationJSON && verificationJSON.verified) {
        elemSuccess.innerHTML = 'Success!';
    } else {
        elemError.innerHTML = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
verificationJSON,
)}</pre>`;
    }

    res.status(200).json(options)
}
