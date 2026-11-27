module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  // The lucide CJS bundle is large; more parallel workers run this machine out of memory.
  maxWorkers: 2,
  // These packages ship untranspiled ESM, so Babel must transform them too.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-svg|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-audio-api|react-redux|@reduxjs/toolkit|redux|immer|reselect|axios)/)',
  ],
  // lucide's "react-native" entry is .mjs; under Jest use the CommonJS build it also ships.
  moduleNameMapper: {
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
};
