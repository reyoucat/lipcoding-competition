// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Mock axios globally
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ data: { token: 'fake-token' } })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  defaults: {
    headers: {
      common: {}
    }
  },
  interceptors: {
    response: {
      use: jest.fn(),
      eject: jest.fn()
    }
  }
}));

// Mock window.localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
