import * as HelloSignSDK from 'hellosign-sdk';
import AWS from 'aws-sdk';
import logger from './logger';
// import * from "hellosign-sdk/types";

export const getAccountInfo = async (): Promise<
  HelloSignSDK.AccountResponse | undefined
> => {
  const api = new HelloSignSDK.AccountApi();
  api.username = process.env.HELLOSIGN_API_KEY || 'undefined';

  const response = await api.accountGet();
  return response.body.account;
};

export const downloadDocument = async (
  requestId: string,
): Promise<HelloSignSDK.SignatureRequestResponseSignatures[] | undefined> => {
  const api = new HelloSignSDK.SignatureRequestApi();
  api.username = process.env.HELLOSIGN_API_KEY || 'undefined';
  try {
    const sigRequestResp = await api.signatureRequestGet(requestId);
    return sigRequestResp?.body?.signatureRequest?.signatures;
  } catch (error) {
    logger.error('Exception when calling HelloSign API:');
    logger.error(error.body);
    return Promise.reject(
      'Unable to download the document related to the request ID ' + requestId,
    );
  }
};

export const generateSignatureRequestData = ({
  signers,
  clientId,
  title,
  subject,
  message,
  ccEmailAddresses,
  fileUrl,
  testMode,
}: Api.IGenerateSignatureRequestData): HelloSignSDK.SignatureRequestSendRequest => {
  const signingOptions: HelloSignSDK.SubSigningOptions = {
    draw: true,
    type: true,
    upload: true,
    phone: true,
    defaultType: HelloSignSDK.SubSigningOptions.DefaultTypeEnum.Draw,
  };
  return {
    clientId,
    title,
    subject,
    message,
    signers: signers.map((signer: Api.Signer, index: number) => ({
      emailAddress: signer.mail,
      name: signer.name,
      order: index,
    })) as HelloSignSDK.SubSignatureRequestSigner[],
    ccEmailAddresses,
    fileUrl: [fileUrl],
    signingOptions,
    testMode,
  };
};

export const sendSignatureRequest = async ({
  signers,
  clientId,
  title,
  subject,
  message,
  fileUrl,
  testMode,
}: Api.ISendSignatureRequest): Promise<HelloSignSDK.SignatureRequestGetResponse> => {
  const api = new HelloSignSDK.SignatureRequestApi();
  api.username = process.env.HELLOSIGN_API_KEY || 'undefined';

  const data: HelloSignSDK.SignatureRequestSendRequest =
    generateSignatureRequestData({
      signers,
      clientId,
      title,
      subject,
      message,
      ccEmailAddresses: [],
      fileUrl,
      testMode,
    });
  try {
    const response = await api.signatureRequestSend(data);
    return response.body;
  } catch (error) {
    logger.error('Exception when calling HelloSign API:');
    logger.error(error.body);
    return Promise.reject('Unable to send the signature request.');
  }
};

interface ICreateApp {
  name: string;
  domains: string[];
}

export const createApp = async ({
  name,
  domains,
}: ICreateApp): Promise<HelloSignSDK.ApiAppGetResponse> => {
  const api = new HelloSignSDK.ApiAppApi();
  api.username = process.env.HELLOSIGN_API_KEY || 'undefined';

  const oauth: HelloSignSDK.SubOAuth = {
    callbackUrl: 'https://example.com/oauth',
    scopes: [
      HelloSignSDK.SubOAuth.ScopesEnum.BasicAccountInfo,
      HelloSignSDK.SubOAuth.ScopesEnum.RequestSignature,
    ],
  };

  const whiteLabelingOptions: HelloSignSDK.SubWhiteLabelingOptions = {
    primaryButtonColor: '#00b3e6',
    primaryButtonTextColor: '#ffffff',
  };

  const data: HelloSignSDK.ApiAppCreateRequest = {
    name,
    domains,
    oauth,
    whiteLabelingOptions,
  };
  try {
    const response = await api.apiAppCreate(data);
    return response.body;
  } catch (error) {
    logger.error('Exception when calling HelloSign API:');
    logger.error(error.body);
    return Promise.reject('Unable to create an app.');
  }
};

export const listApp = async (): HelloSignSDK.ApiAppListResponse => {
    const api = new HelloSignSDK.ApiAppApi();
    api.username = process.env.HELLOSIGN_API_KEY || 'undefined';
    try {
        const response = await api.apiAppList(1, 2);
        return response.body;
    } catch (error) {
        logger.error('Exception when calling HelloSign API:');
        logger.error(error.body);
        return Promise.reject('Unable to list applications.');
    }
}

export const uploadFile = async (
  encryptedData: string,
  filename: string,
  clientId: string,
  recipientAddress: string,
  recipientName: string,
): Promise<void> => {
  const s3 = new AWS.S3({
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    signatureVersion: 'v4',
    accessKeyId: process.env.FILEBASE_ACCESS_KEY_ID,
    secretAccessKey: process.env.FILEBASE_SECRET_ACCESS_KEY,
  });

  // const textFileName = 'encrypted_data.txt'
  const data =
    '==================' +
    filename +
    '==================\n\n' +
    encryptedData +
    '\n\n========================================================';
  // await createTextFile(data, textFileName)
  // const pdfContent = fs.readFileSync(pdfName)

  try {
    const params = {
      Bucket: 'hellosign',
      Key: filename,
      Body: data,
    };
    const request = s3.putObject(params);
    request.on('httpHeaders', async (statusCode, headers) => {
      logger.debug(statusCode + ' ' + headers);
      const cid = statusCode === 200 ? headers['x-amz-meta-cid'] : null;
      logger.debug(cid);
      if (cid === null) return;
      const fileBaseGatewayUrl = 'https://ipfs.filebase.io/ipfs/' + cid;
      logger.info(`URL: ${fileBaseGatewayUrl}`);

      const request = await sendSignatureRequest({
        signers: [
          {
            mail: recipientAddress,
            name: recipientName,
          },
        ],
        clientId,
        title: 'Signature for ' + filename,
        subject: 'Signature request for ' + filename,
        message:
          'You can access the encrypted document from this URL: \n' +
          fileBaseGatewayUrl +
          '\n\n' +
          'Encrypted data:\n' +
          encryptedData +
          '\n\n',
        fileUrl: fileBaseGatewayUrl,
        testMode: true,
      });
      if (request === undefined || request.signatureRequest === undefined) {
        logger.error('Unable to request a signature...');
      } else {
        logger.info(
          'Request id: ',
          request.signatureRequest.signatureRequestId,
        );
        logger.info(
          'Requester: ',
          request.signatureRequest.requesterEmailAddress,
        );
        logger.info('Details url: ', request.signatureRequest.detailsUrl);
        logger.info('Signatures: ', request.signatureRequest.signatures);
        logger.info('Request done!');
      }
    });
    await request.send();
  } catch (error) {
    logger.error(error);
    Promise.reject('Error while creating a signature request.');
  }
};
