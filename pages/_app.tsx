import '../styles/globals.css'
import connectDb from "../db/connectDatabase";
import type { AppProps } from 'next/app'
import { NextUIProvider } from '@nextui-org/react';

export const getServerSideProps = async () => {
    const db = await connectDb();
    return { props: { }}
}

const MyApp = ({ Component, pageProps }: AppProps)  => {

    return (
        <NextUIProvider>
          <Component {...pageProps} />
        </NextUIProvider>
    );
};

export default MyApp
