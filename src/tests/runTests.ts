import { startVitest } from 'vitest/node';

async function runTests() {
  try {
    const vitest = await startVitest('test', [], {
      include: ['src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        enabled: true,
        reporter: ['text', 'json', 'html'],
      },
      threads: true
    });

    // Use the correct API to run tests
    const result = await vitest.start();

    if (result.state.getCountOfFailedTests() > 0) {
      console.error('Test failures:', result.state.getTestResults());
      process.exit(1);
    }

    console.log('All tests passed!');
    const coverage = result.state.getCoverage();
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