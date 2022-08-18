import '../styles/globals.css'
import connectDb from "../db/connectDatabase";
import type { AppProps } from 'next/app'
import { NextUIProvider } from '@nextui-org/react';



const MyApp = ({ Component, pageProps }: AppProps)  => {

    return (
        <NextUIProvider>
          <Component {...pageProps} />
        </NextUIProvider>
    );
};

export default MyApp
