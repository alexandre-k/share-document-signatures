import type { NextApiRequest, NextApiResponse } from 'next'
import * as HelloSignSDK from "hellosign-sdk";
require("hellosign-sdk").types;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Array<SignatureRequestResponse>>
) {

    const accountApi = new HelloSignSDK.AccountApi();
    accountApi.username = process.env.API_KEY;

    const { accountId, emailAddress }= (await accountApi.accountGet()).body.account;
    const signatureRequestApi = new HelloSignSDK.SignatureRequestApi();
    signatureRequestApi.username = process.env.API_KEY;

    const page = 1;
    const response = await signatureRequestApi.signatureRequestList(accountId, page);
    res.status(200).json(response.body.signatureRequests)
}
