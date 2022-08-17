import type { NextApiRequest, NextApiResponse } from 'next'
import connectDb from "../../db/connectDatabase";
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Account>
) {

    const db = await connectDb();

    const users = await db
        .collection("users")
        .findOne(1000);

    const user: UserModel = getUserFromDB(1000);
    // Human-readable title for your website
    const rpName = 'SimpleWebAuthn Example';
    // A unique identifier for your website
    const rpID = 'localhost';
    // The URL at which registrations and authentications should occur
    const origin = `https://${rpID}`;


    const options = generateRegistrationOptions({
        rpName,
        rpID,
        userID: user.id,
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

    res.status(200).json(options)
}
