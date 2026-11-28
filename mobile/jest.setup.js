/* eslint-env jest */
// Native modules have no implementation under Jest; use the libraries' official mocks.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('react-native-audio-api', () => require('react-native-audio-api/mock'));
require('react-native-gesture-handler/jestSetup');
// Google Sign-In's official mock (its package "exports" hide the file, so reach it through the folder).
require(
  require('path').join(
    require('path').dirname(require.resolve('@react-native-google-signin/google-signin/package.json')),
    'jest/build/jest/setup',
  ),
);
// The secure store keeps the refresh token in memory under Jest.
jest.mock('react-native-keychain', () => {
  let stored = null;
  return {
    ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY' },
    getGenericPassword: jest.fn(async () => (stored ? { username: 'famora', password: stored } : false)),
    setGenericPassword: jest.fn(async (_u, p) => {
      stored = p;
      return true;
    }),
    resetGenericPassword: jest.fn(async () => {
      stored = null;
      return true;
    }),
  };
});
// Reanimated 4's own mock needs native worklets; a small stub covers what the app uses.
// Reduced motion is reported, so ambient animations are not even mounted in tests.
jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView } = require('react-native');
  const id = v => v;
  const Animated = { View, Text, Image, ScrollView, createAnimatedComponent: c => c };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: v => ({ value: v }),
    useAnimatedStyle: f => f(),
    useReducedMotion: () => true,
    withTiming: id,
    withSpring: id,
    withDelay: (_d, v) => v,
    withRepeat: id,
    withSequence: (...v) => v[v.length - 1],
    interpolate: (x, input, output) => output[0] + ((x - input[0]) * (output[output.length - 1] - output[0])) / (input[input.length - 1] - input[0] || 1),
    runOnJS: f => f,
    Easing: { linear: id, quad: id, cubic: id, back: () => id, bezier: () => id, in: id, out: id, inOut: id },
  };
});
