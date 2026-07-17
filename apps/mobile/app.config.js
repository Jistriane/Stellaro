const isPublicNetwork = ['public', 'mainnet'].includes(
  String(process.env.STELLAR_NETWORK || 'testnet').toLowerCase()
);

const chainProviderMode =
  String(process.env.CHAIN_PROVIDER_MODE || 'public-testnet').toLowerCase() === 'local'
    ? 'local'
    : 'public-testnet';

const horizonUrl =
  process.env.HORIZON_URL ||
  (chainProviderMode === 'local'
    ? 'http://localhost:8000'
    : isPublicNetwork
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org');

const networkPassphrase =
  process.env.STELLAR_NETWORK_PASSPHRASE ||
  (isPublicNetwork
    ? 'Public Global Stellar Network ; September 2015'
    : 'Test SDF Network ; September 2015');

module.exports = {
  expo: {
    name: 'mobile',
    slug: 'mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#050608',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#050608',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      CHAIN_PROVIDER_MODE: chainProviderMode,
      STELLAR_NETWORK: isPublicNetwork ? 'public' : 'testnet',
      HORIZON_URL: horizonUrl,
      STELLAR_NETWORK_PASSPHRASE: networkPassphrase,
      BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://localhost:3001',
    },
    plugins: ['expo-secure-store', 'expo-font', 'expo-web-browser'],
  },
};
