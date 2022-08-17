import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
// import { Fido2Lib } from "fido2-lib";
import SimpleWebAuthnBrowser from '@simplewebauthn/browser';
import { startRegistration } from '@simplewebauthn/browser';
import { startAuthentication } from '@simplewebauthn/browser';

/**
 * It is strongly advised that authenticators get their own DB
 * table, ideally with a foreign key to a specific UserModel.
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
type Authenticator = {
    // SQL: Encode to base64url then store as `TEXT`. Index this column
    credentialID: Buffer;
    // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
    credentialPublicKey: Buffer;
    // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
    counter: number;
    // SQL: `VARCHAR(255)` and store string array as a CSV string
    // ['usb' | 'ble' | 'nfc' | 'internal']
    transports?: AuthenticatorTransport[];
};

export const getServerSideProps = async () => {
    // const res = await fetch("http://localhost:3000/api/signatureRequest");

    // (Pseudocode) Retrieve any of the user's previously-
    // registered authenticators
    // const userAuthenticators: Authenticator[] = getUserAuthenticators(user);

    // const data = await res.json();
    const data = [{
        filesUrl: [""],
        signingUrl: "",
        detailsUrl: ""
    }]
    return { props: { data }}
}

type Signature = {
    filesUrl: string;
    signingUrl: string;
    detailsUrl: string;
}
interface HomeProps {
    data: Array<Signature>
}

const Home: NextPage = (homeProps: HomeProps) => {
    console.log(homeProps)
    const tryFido = async () => {

        try {
            const response = await fetch('http://localhost:3000/api/auth/get-registration-options')
            const { value: optionsBytes } = await response.body.getReader().read()
            const decoder = new TextDecoder();
            const options = JSON.parse(decoder.decode(optionsBytes))
            // Pass the options to the authenticator and wait for a response
            const resp = await startRegistration(options);
            return resp
        } catch (error) {
            // Some basic error handling
            if (error.name === 'InvalidStateError') {
                // elemError.innerText = 'Error: Authenticator was probably already registered by user';
            } else {
                // elemError.innerText = error;
            }

            throw error;
        }
        // @simplewebauthn/server -> verifyRegistrationResponse()
        const verificationResp = await fetch('http://localhost:3000/api/auth/verify-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resp),
        });
        /* const f2l = new Fido2Lib({
         *     timeout: 42,
         *     rpId: "example.com",
         *     rpName: "ACME",
         *     rpIcon: "https://example.com/logo.png",
         *     challengeSize: 128,
         *     attestation: "none",
         *     cryptoParams: [-7, -257],
         *     authenticatorAttachment: "platform",
         *     authenticatorRequireResidentKey: false,
         *     authenticatorUserVerification: "required"
         * });
         * console.log(f2l)
         * const registrationOptions = await f2l.attestationOptions();
         *     console.log(registrationOptions)
           const authnOptions = await f2l.assertionOptions();
         *     console.log(authnOptions) */

// add allowCredentials to limit the number of allowed credential for the authentication process. For further details refer to webauthn specs: (https://www.w3.org/TR/webauthn-2/#dom-publickeycredentialrequestoptions-allowcredentials).
// save the challenge in the session information...
// send authnOptions to client and pass them in to `navigator.credentials.get()`...
// get response back from client (clientAssertionResponse)

        /* const assertionExpectations = {
         *     Remove the following comment if allowCredentials has been added into authnOptions so the credential received will be validate against allowCredentials array.
         *                                                                                                                                                                allowCredentials: [{
         *                                                                                                                                                                    id: "lTqW8H/lHJ4yT0nLOvsvKgcyJCeO8LdUjG5vkXpgO2b0XfyjLMejRvW5oslZtA4B/GgkO/qhTgoBWSlDqCng4Q==",
         *                                                                                                                                                                    type: "public-key",
         *                                                                                                                                                                    transports: ["usb"]
         *                                                                                                                                                                }],
         *     challenge: "eaTyUNnyPDDdK8SNEgTEUvz1Q8dylkjjTimYd5X7QAo-F8_Z1lsJi3BilUpFZHkICNDWY8r9ivnTgW7-XZC3qQ",
         *     origin: "https://localhost:8443",
         *     factor: "either",
         *     publicKey: "-----BEGIN PUBLIC KEY-----\n" +
         *         "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAERez9aO2wBAWO54MuGbEqSdWahSnG\n" +
         *         "MAg35BCNkaE3j8Q+O/ZhhKqTeIKm7El70EG6ejt4sg1ZaoQ5ELg8k3ywTg==\n" +
         *         "-----END PUBLIC KEY-----\n",
         *     prevCounter: 362
         * }; */
// const authnResult = await f2l.assertionResult(authnOptions.clientAssertionResponse, authnOptions.assertionExpectations); // will throw on error

    }
    tryFido()

  return (
      <>
      <div>Signature</div>
      <a href={homeProps.data[0].filesUrl}>{homeProps.data[0].filesUrl}</a>
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          Get started by editing{' '}
          <code className={styles.code}>pages/index.tsx</code>
        </p>

        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Documentation &rarr;</h2>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a href="https://nextjs.org/learn" className={styles.card}>
            <h2>Learn &rarr;</h2>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>

          <a
            href="https://github.com/vercel/next.js/tree/canary/examples"
            className={styles.card}
          >
            <h2>Examples &rarr;</h2>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
          >
            <h2>Deploy &rarr;</h2>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
      </>
  )
}

export default Home
