module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'module:@react-native/babel-preset',
      '@babel/preset-env',
      '@babel/preset-react',
      '@babel/preset-typescript',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.web.js', '.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
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
  };
};

