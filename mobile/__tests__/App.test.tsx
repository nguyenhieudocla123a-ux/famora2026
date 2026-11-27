/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.useFakeTimers();

test('renders the splash, then the login screen', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  const text = () => JSON.stringify(tree!.toJSON());
  expect(text()).toContain('Đang mở Famora');

  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(1500);
  });
  expect(text()).toContain('Đăng nhập');
  expect(text()).toContain('Tạo tài khoản');
});
