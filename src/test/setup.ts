import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { clearApiCache } from '../hooks/useApi';

// Never let one test's cached API data leak into the next.
afterEach(() => {
  cleanup();
  clearApiCache();
});
