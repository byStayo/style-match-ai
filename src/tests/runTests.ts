import { startVitest } from 'vitest/node';

async function runTests() {
  try {
    const vitest = await startVitest('test', [], {
      include: ['src/**/*.test.ts'],
      coverage: true,
      threads: true
    });

    const results = await vitest.run();

    if (results.errors.length > 0) {
      console.error('Test failures:', results.errors);
      process.exit(1);
    }

    console.log('All tests passed!');
    if (results.coverage) {
      console.log('Coverage:', results.coverage.summary);
    }
    
    await vitest.close();
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();