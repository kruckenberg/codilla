export default `const tests = [];

function test(name, testFn) {
  tests.push({ name, testFn });
}

async function runTests() {
  const results = [];

  for await (const { name, testFn } of tests) {
    try {
      const { pass, message } = await testFn();
      results.push({ name, pass, message });
    } catch (error) {
      results.push({ name, pass: false, message: error?.message || error });
    }
  }

  // Clear the tests array after running
  tests.length = 0;

  return results;
}

function reportResults(results) {
  for (const result of results) {
    if (result.pass) {
      console.info(\`✓ \${result.name}\`);
    } else {
      console.info(\`✗ \${result.name} - \${result.message}\`);
    }
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.info('------------------------------');
  console.info(\`Summary: \${passed} passed, \${failed} failed\`);
}

async function run() {
  const results = await runTests();
  reportResults(results);
}

// Register the automatic runner
// process.on("exit", run);

export { test, run };`;
