import { startVitest } from 'vitest/node';
import type { Vitest, TestSpecification } from 'vitest';

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
    const testSpecs: TestSpecification[] = testPaths.map(path => ({ path }));
    await Promise.all(testSpecs.map(spec => vitest.runFiles([spec])));
    
    // Check for failures
    const state = vitest.state;
    const failedTestFiles = state.getFiles().filter(file => 
      file.tasks.some(task => task.result?.state === 'fail')
    );
    
    if (failedTestFiles.length > 0) {
      console.error('Test failures:', failedTestFiles.length);
      process.exit(1);
    }

    console.log('All tests passed!');
    const coverageData = state.getCoverageData();
    if (coverageData) {
      console.log('Coverage:', coverageData);
    }
    
    await vitest.close();
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();