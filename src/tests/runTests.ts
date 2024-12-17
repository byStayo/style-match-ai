import { startVitest } from 'vitest/node';

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

    // Start Vitest and wait for it to be ready
    await vitest.start();
    
    // Get the test runner instance
    const testRunner = vitest.getProcess();
    
    // Wait for all tests to complete
    await testRunner.waitForComplete();

    const failedTests = testRunner.state.getFailedTests();
    if (failedTests.length > 0) {
      console.error('Test failures:', failedTests);
      process.exit(1);
    }

    console.log('All tests passed!');
    const coverage = testRunner.state.getCoverage();
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