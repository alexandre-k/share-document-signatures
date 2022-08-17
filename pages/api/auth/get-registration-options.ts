import type { NextApiRequest, NextApiResponse } from 'next'
import connectDb from "../../../db/connectDatabase";
import User from "../../../db/user";
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
    const user = new User();
    await user.save();
    // Human-readable title for your website
    const rpName = 'SimpleWebAuthn Example';
    // A unique identifier for your website
    const rpID = 'localhost';
    // The URL at which registrations and authentications should occur
    const origin = `https://${rpID}`;

    const options = generateRegistrationOptions({
        rpName,
        rpID,
        userID: user._id,
        userName: user.username,
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
    console.log(options)

    res.status(200).json(options)
}
