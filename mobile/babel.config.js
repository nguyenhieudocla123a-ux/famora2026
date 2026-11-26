module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // zod v4 ships `export * as ns from` syntax, which the RN preset does not transform.
    '@babel/plugin-transform-export-namespace-from',
    // Reanimated 4 worklets; must stay the last plugin.
    'react-native-worklets/plugin',
  ],
};
