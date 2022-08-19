import type { NextApiRequest, NextApiResponse } from 'next'
import * as HelloSignSDK from "hellosign-sdk";
require("hellosign-sdk").types;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Array<SignatureRequestResponse>>
) {

    const accountApi = new HelloSignSDK.AccountApi();
    accountApi.username = process.env.HELLOSIGN_API_KEY;

    const { accountId, emailAddress }= (await accountApi.accountGet()).body.account;
    const signatureRequestApi = new HelloSignSDK.SignatureRequestApi();
    signatureRequestApi.username = process.env.HELLOSIGN_API_KEY;

    // const signer1: HelloSignSDK.SubSignatureRequestSigner = {
    //     emailAddress: "jack@example.com",
    //     name: "Jack",
    //     order: 0,
    // };


    // const signingOptions: HelloSignSDK.SubSigningOptions = {
    //     draw: true,
    //     type: true,
    //     upload: true,
    //     phone: true,
    //     defaultType: HelloSignSDK.SubSigningOptions.DefaultTypeEnum.Draw,
    // };

    // const data: HelloSignSDK.SignatureRequestCreateEmbeddedRequest = {
    //     clientId: "ec64a202072370a737edf4a0eb7f4437",
    //     title: "NDA with Acme Co.",
    //     subject: "The NDA we talked about",
    //     message: "Please sign this NDA and then we can discuss more. Let me know if you have any questions.",
    //     signers: [ signer1, signer2 ],
    //     ccEmailAddresses: [
    //         "lawyer@hellosign.com",
    //         "lawyer@example.com",
    //     ],
    //     fileUrl: ["https://app.hellosign.com/docs/example_signature_request.pdf"],
    //     signingOptions,
    //     testMode: true,
    // };


    // SignatureRequestResponseSignatures

    // SignatureRequestCreateEmbeddedRequest

    // const result = api.signatureRequestCreateEmbeddedWithTemplate(data);
    // result.then(response => {
    //     console.log(response.body);
    // }).catch(error => {
    //     console.log("Exception when calling HelloSign API:");
    //     console.log(error.body);
    // });

    const page = 1;
    const response = await signatureRequestApi.signatureRequestList(accountId, page);
    console.log(response.body.signatureRequests)
    res.status(200).json(response.body.signatureRequests)
}
