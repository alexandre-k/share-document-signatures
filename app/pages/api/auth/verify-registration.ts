import type { NextApiRequest, NextApiResponse } from 'next'
import connectDb from "../../../middleware/connectDatabase";
import User from "../../../middleware/user";
import { v4 as uuidv4 } from 'uuid';
import {
    PublicKeyCredentialCreationOptionsJSON,
    VerifyAuthenticationResponseOpts,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<VerifyAuthenticationResponseOpts>
) {
    // TODO: refactor get / verify
    const testUserId = "08ec7dee-ba64-41f8-acaf-bcff4577ac44";
    let user: User;
    if (testUserId) {
        user = await User.findOne({ id: testUserId });
    }

    if (!testUserId || !user) {
        return res.status(500).json({ error: 'User not found' });
    }

    // Wait for the results of verification
    const expectedChallenge: string = user.currentChallenge;
    const rpID = window.location.host;

    try {
        const origin = window.location.origin;
        const verification = await verifyRegistrationResponse({
            credential: req.body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });
        // Show UI appropriate for the `verified` status
        if (verification && verification.verified) {
            console.log(verification)
            res.status(200).json({ verification });
        } else {
            res.status(404).json({ verification });
        }
    } catch (error) {
        console.error(error);
        return res.status(400).send({ error: error.message });
    }
}
