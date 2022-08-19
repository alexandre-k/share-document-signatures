import type { NextApiRequest, NextApiResponse } from 'next'

import connectDb from "../../../middleware/connectDatabase";
import User from "../../../middleware/user";
import { v4 as uuidv4 } from 'uuid';
import {
    PublicKeyCredentialCreationOptionsJSON,
    GenerateRegistrationOptionsOpts,
    generateRegistrationOptions,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<PublicKeyCredentialCreationOptionsJSON>
) {
        const db = await connectDb();
        console.log('Connect db > ', db)
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

    const options = generateRegistrationOptions({
        rpName,
        rpID,
        userID: user.id,
        userName: 'alex',
        // Don't prompt users for additional information about the authenticator
        // (Recommended for smoother UX)
        attestationType: 'indirect',
        // Prevent users from re-registering existing authenticators
        /* excludeCredentials: userAuthenticators.map(authenticator => ({
         *     id: authenticator.credentialID,
         *     type: 'public-key',
         *     // Optional
         *     transports: authenticator.transports,
         * })), */
    });
    await User.updateOne(
        { id: testUserId },
        { currentChallenge: options.challenge });
    res.status(200).json(options)
}
