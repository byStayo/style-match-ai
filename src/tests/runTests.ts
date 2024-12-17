import { startVitest } from 'vitest/node';
import type { Vitest } from 'vitest';

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
    const failedTests = state.getFiles().filter(file => 
      file.tasks?.some(task => task.result?.state === 'fail')
    );
    
    if (failedTests.length > 0) {
      console.error('Test failures:', failedTests.length);
      process.exit(1);
    }

    console.log('All tests passed!');
    const coverageReport = state.getCoverageReport?.();
    if (coverageReport) {
      console.log('Coverage:', coverageReport);
    }
    
    await vitest.close();
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();