declare namespace Api {
    export type Signer = {
        name: string
        mail: string
    }

    export interface IGenerateSignatureRequestData {
        signers: Signer[];
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
        clientId: string;
        title: string;
        subject: string;
        message: string;
        fileUrl: string;
        testMode: boolean;
    }
}
