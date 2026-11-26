/* eslint-env jest */
// Native modules have no implementation under Jest; use the libraries' official mocks.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
