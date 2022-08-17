import type { NextApiRequest, NextApiResponse } from 'next'
import * as HelloSignSDK from "hellosign-sdk";
require("hellosign-sdk").types;

type Account = {
    accountId: string
    emailAddress: string
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Account>
) {
    const api = new HelloSignSDK.AccountApi();
    api.username = process.env.HELLOSIGN_API_KEY;

    const response = await api.accountGet();
    const { accountId, emailAddress } = response.body.account;
    res.status(200).json(response.body.account)
}
