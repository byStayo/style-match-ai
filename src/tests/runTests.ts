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

    // Start Vitest
    await vitest.start();

    // Run the tests
    const ctx = await vitest.run();
    
    // Check for failures
    if (ctx.state.getCountOfFailedTests() > 0) {
      console.error('Test failures:', ctx.state.getTestResults());
      process.exit(1);
    }

    console.log('All tests passed!');
    const coverage = ctx.state.getCoverage();
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