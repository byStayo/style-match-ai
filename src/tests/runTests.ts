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

    // Get test results
    const testFiles = await vitest.getTestFiles();
    await Promise.all(testFiles.map(file => vitest.runFiles(file.filepath)));
    
    // Check for failures
    const stats = vitest.getStats();
    if (stats.failedTests > 0) {
      console.error('Test failures:', stats.failedTests);
      process.exit(1);
    }

    console.log('All tests passed!');
    const coverage = vitest.getCoverageReport();
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