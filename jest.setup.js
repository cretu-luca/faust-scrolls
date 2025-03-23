// Import testing-library utilities
import '@testing-library/jest-dom';

// Mock canvas methods since JSDOM doesn't support them
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0
})); 