/* eslint-env jest */
// Native modules have no implementation under Jest; use the libraries' official mocks.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('react-native-audio-api', () => require('react-native-audio-api/mock'));
require('react-native-gesture-handler/jestSetup');
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
