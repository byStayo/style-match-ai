import { startVitest } from 'vitest/node';
import type { TestRunner } from 'vitest';

async function runTests() {
  try {
    const vitest = await startVitest('test', [], {
      include: ['src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        enabled: true,
        reporter: ['text', 'json', 'html'],
      }
    });

    // Start Vitest
    await vitest.start();

    // Get test results
    const testPaths = await vitest.getTestFilepaths();
    await Promise.all(testPaths.map(path => vitest.runFiles([path])));
    
    // Check for failures
    const state = vitest.state;
    if (state.getCountOfFailedTests() > 0) {
      console.error('Test failures:', state.getCountOfFailedTests());
      process.exit(1);
    }

    console.log('All tests passed!');
    const coverage = state.getCoverageReport();
    if (coverage) {
      console.log('Coverage:', coverage);
    }
    
    await vitest.close();
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();