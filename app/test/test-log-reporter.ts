import type { Reporter, TestCase } from "vitest/node";

// Logs a line after each test finishes, with its full description and result.
// Runs in Node (not the browser), so it works in Browser Mode too.
export default class TestLogReporter implements Reporter {
    onTestCaseResult(testCase: TestCase) {
        const { state } = testCase.result();
        console.log(`✓ finished test: "${testCase.fullName}" — ${state}`);
    }
}
