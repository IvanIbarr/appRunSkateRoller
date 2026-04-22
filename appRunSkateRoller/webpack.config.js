const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
require('dotenv').config();

module.exports = {
  mode: 'development',
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'web-build'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx', '.json'],
    alias: {
      'react-native$': 'react-native-web',
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/utils/asyncStorage.web.ts'),
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@screens': path.resolve(__dirname, 'src/screens'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@assets': path.resolve(__dirname, 'assets'),
      '@notifee/react-native': path.resolve(
        __dirname,
        'src/shims/notifee.web.ts',
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude:
          /node_modules\/(?!(react-native-web|@react-navigation|react-native-screens)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    ios: '14',
                    safari: '14',
                    android: '90',
                    chrome: '90',
                  },
                },
              ],
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [
              [
                'module-resolver',
                {
                  root: ['./src'],
                  extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
                  alias: {
                    '@': './src',
                    '@components': './src/components',
                    '@screens': './src/screens',
                    '@services': './src/services',
                    '@types': './src/types',
                    '@utils': './src/utils',
                    '@assets': './assets',
                  },
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|jpeg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name].[hash][ext]',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      // Por defecto el plugin usa defer en <head>; en Safari móvil a veces la app no monta. Bundle al final del body, síncrono.
      inject: 'body',
      scriptLoading: 'blocking',
    }),
    new Dotenv({
      path: './.env',
      safe: true,
      systemvars: true,
      silent: true,
      defaults: false,
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_MAPBOX_ACCESS_TOKEN': JSON.stringify(
        process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '',
      ),
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development',
      ),
      // Bitácora remota → POST /api/logs/client (ver SIIG-ROLLER-BACKEND .env CLIENT_LOG_INGEST)
      'process.env.REACT_APP_CLIENT_LOGS': JSON.stringify(
        process.env.REACT_APP_CLIENT_LOGS !== undefined
          ? process.env.REACT_APP_CLIENT_LOGS
          : process.env.NODE_ENV === 'production'
            ? 'false'
            : 'true',
      ),
      'process.env.REACT_APP_CLIENT_LOG_SECRET': JSON.stringify(
        process.env.REACT_APP_CLIENT_LOG_SECRET || '',
      ),
      // 1 = Beta | 2 = Público | 3 = Crecer (ver src/config/launchPhase.ts)
      'process.env.REACT_APP_LAUNCH_PHASE': JSON.stringify(
        process.env.REACT_APP_LAUNCH_PHASE != null && String(process.env.REACT_APP_LAUNCH_PHASE) !== ''
          ? String(process.env.REACT_APP_LAUNCH_PHASE)
          : '1',
      ),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'web-build'),
    },
    compress: true,
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: 'all',
    // HMR + cliente WS en Safari móvil / LAN suele dejar pantalla en blanco; recarga manual (F5) en desktop.
    hot: false,
    liveReload: false,
    client: false,
    historyApiFallback: true,
    // Webpack-dev-server 5: `proxy` debe ser un array con `context` (objeto { '/api': {...} } se ignora).
    // Mismo origen :3000 → backend :3001 (Safari/iOS).
    proxy: [
      {
        context: ['/api', '/uploads', '/health'],
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    ],
  },
};

