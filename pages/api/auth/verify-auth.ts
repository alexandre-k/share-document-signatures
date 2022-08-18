import type { NextApiRequest, NextApiResponse } from 'next'
import User from "../../../db/user";
import { v4 as uuidv4 } from 'uuid';
import {
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import jwt from "jsonwebtoken";


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

    const { verified }= await verifyAuthenticationResponse({
        credential: body,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator,
    });

    console.log('Verify auth: ', verified);

    if (verified) {
        const token = jwt.sign({ pubKey: user.pubKey }, process.env.PRIVATE_KEY);
        res.setHeader('Authorization', 'Bearer' + token);
        return res.status(200).json({ ok: true })
    } else {
        return res.status(500).json({ error: 'Invalid signature'});
    }
}
