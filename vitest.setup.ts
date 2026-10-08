import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Runs for every test file, including the node-environment ones. cleanup only
// unmounts what render() mounted, so it is a no-op there.
afterEach(() => {
  cleanup();
});
