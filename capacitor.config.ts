import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moinsbete.app',
  appName: 'MoinsBête',
  webDir: 'out',
  server: {
    url: 'https://moinsbete.guibo.com',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#7C6CF6',
      androidSplashResourceName: 'splash'
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#372773'
    }
  }
};

export default config;
