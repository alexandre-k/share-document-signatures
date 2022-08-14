import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { NextUIProvider } from '@nextui-org/react';

const MyApp = ({ Component, pageProps }: AppProps)  => (
      <NextUIProvider>
          <Component {...pageProps} />
      </NextUIProvider>);

export default MyApp
