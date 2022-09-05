declare module 'HelloSignEncrypt';

export interface Signer {
    name: string;
    mail: string;
}

export interface IGenerateSendSignatureRequest {
    signers: Signer[];
    doc: string;
    clientId: string;
    title: string;
    subject: string;
    message: string;
    ccEmailAddresses: string[];
    fileUrl: string;
    testMode: boolean;
}

export interface ISendSignatureRequest {
    signers: Signer[];
    doc: string;
    clientId: string;
    title: string;
    subject: string;
    message: string;
    fileUrl: string;
    willSend: boolean;
    testMode: boolean;
}
