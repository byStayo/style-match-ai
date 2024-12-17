import { startVitest } from 'vitest/node';
import type { Vitest, File } from 'vitest';

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
    await Promise.all(testPaths.map(path => vitest.runFiles([{ path }], 'test')));
    
    // Check for failures
    const state = vitest.state;
    const failedTestFiles = state.getFiles().filter((file: File) => 
      file.tasks.some(task => task.result?.state === 'fail')
    );
    
    if (failedTestFiles.length > 0) {
      console.error('Test failures:', failedTestFiles.length);
      process.exit(1);
    }

    console.log('All tests passed!');
    const coverage = state.getCoverage();
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