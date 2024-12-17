import { test } from 'vitest';

async function runTests() {
  try {
    const results = await test.run({
      include: ['src/**/*.test.ts'],
      coverage: true,
      threads: true
    });

    if (results.errors.length > 0) {
      console.error('Test failures:', results.errors);
      process.exit(1);
    }

    console.log('All tests passed!');
    console.log('Coverage:', results.coverage?.summary);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();