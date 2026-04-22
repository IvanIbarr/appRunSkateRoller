/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: ['/node_modules/', '/web-build/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  clearMocks: true,
};
