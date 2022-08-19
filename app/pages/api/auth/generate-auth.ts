import type { NextApiRequest, NextApiResponse } from 'next'
import User from "../../../middleware/user";
import { v4 as uuidv4 } from 'uuid';
import {
    generateAuthenticationOptions,
} from '@simplewebauthn/server';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AuthenticationCredential>
) {

    const testUserId = "08ec7dee-ba64-41f8-acaf-bcff4577ac44";
    let user: User;
    if (testUserId) {
        user = await User.findOne({ id: testUserId });
    }

    if (!testUserId || !user.id) {
        user = new User({
            id: uuidv4()
        });
        await user.save();
    }

    // Human-readable title for your website
    const rpName = 'SimpleWebAuthn Example';
    // A unique identifier for your website
    const rpID = window.location.host
    // The URL at which registrations and authentications should occur
    const origin = window.location.origin;

    const options = generateAuthenticationOptions({
        allowCredentials: {
            id: user.credentialID,
            type: 'public-key',
            // transports: authenticator.transports
        },
        userVerification: 'preferred'
    });
    await User.updateOne(
        { id: testUserId },
        { currentChallenge: options.challenge });
    res.status(200).json(options)
}
