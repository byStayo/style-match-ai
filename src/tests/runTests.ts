import { StateManager } from './StateManager';
import { TestSpecification } from './types';

export async function runTests() {
  const stateManager = new StateManager();
  
  // Define test specifications
  const tests: TestSpecification[] = [
    {
      name: 'User Flow Tests',
      path: './integration/userFlow.test.ts',
      type: 'integration'
    },
    {
      name: 'Matching Performance Tests',
      path: './load/matchingPerformance.test.ts',
      type: 'load'
    }
  ];

  try {
    // Run all test files with their specifications
    await Promise.all(tests.map(test => 
      stateManager.runFiles(test.path, test)
    ));

    // Get coverage if available
    const coverage = stateManager.coverage?.getCoverage();
    
    if (coverage) {
      console.log('Test Coverage Report:', coverage);
    }

    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runTests();