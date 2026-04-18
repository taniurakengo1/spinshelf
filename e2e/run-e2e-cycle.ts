import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const MAX_CYCLES = 5;
const REPORTS_DIR = path.resolve(__dirname, 'reports');
const EVIDENCE_DIR = path.resolve(__dirname, 'evidence');

interface CycleResult {
  cycle: number;
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  failedNames: string[];
  duration: number;
}

function cleanDirectories(): void {
  for (const dir of [REPORTS_DIR, EVIDENCE_DIR]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log('[Cycle] Cleaned reports/ and evidence/ directories');
}

function runTests(): { exitCode: number; output: string } {
  try {
    const output = execSync('npx playwright test', {
      encoding: 'utf-8',
      cwd: __dirname,
      timeout: 600_000, // 10 minutes
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { exitCode: 0, output };
  } catch (error: any) {
    return {
      exitCode: error.status || 1,
      output: (error.stdout || '') + '\n' + (error.stderr || ''),
    };
  }
}

function parseResults(): { total: number; passed: number; failed: number; failedNames: string[] } {
  const resultsPath = path.join(REPORTS_DIR, 'results.json');
  if (!fs.existsSync(resultsPath)) {
    return { total: 0, passed: 0, failed: 0, failedNames: [] };
  }

  try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    const suites = data.suites || [];
    let total = 0;
    let passed = 0;
    let failed = 0;
    const failedNames: string[] = [];

    function walkSuites(suites: any[]): void {
      for (const suite of suites) {
        if (suite.specs) {
          for (const spec of suite.specs) {
            for (const test of spec.tests || []) {
              total++;
              const status = test.status || test.results?.[0]?.status;
              if (status === 'passed' || status === 'expected') {
                passed++;
              } else if (status === 'skipped') {
                // Don't count skipped as failed
                total--;
              } else {
                failed++;
                failedNames.push(`${suite.title} > ${spec.title}`);
              }
            }
          }
        }
        if (suite.suites) {
          walkSuites(suite.suites);
        }
      }
    }

    walkSuites(suites);
    return { total, passed, failed, failedNames };
  } catch {
    return { total: 0, passed: 0, failed: 0, failedNames: [] };
  }
}

async function waitForUserInput(message: string): Promise<boolean> {
  const autoRetry = process.env.AUTO_RETRY === 'true';
  if (autoRetry) {
    console.log('[Cycle] AUTO_RETRY enabled, proceeding automatically...');
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('SpinShelf E2E Test Cycle Runner');
  console.log('='.repeat(60));
  console.log(`Max cycles: ${MAX_CYCLES}`);
  console.log();

  const history: CycleResult[] = [];

  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Cycle ${cycle}/${MAX_CYCLES}`);
    console.log(`${'─'.repeat(60)}\n`);

    // Step 1: Clean
    cleanDirectories();

    // Step 2: Run all tests
    console.log('[Cycle] Running all tests...');
    const startTime = Date.now();
    const { exitCode, output } = runTests();
    const duration = Date.now() - startTime;

    console.log(output);

    // Step 3: Parse results
    const results = parseResults();
    const cycleResult: CycleResult = {
      cycle,
      passed: exitCode === 0 && results.failed === 0,
      totalTests: results.total,
      passedTests: results.passed,
      failedTests: results.failed,
      failedNames: results.failedNames,
      duration,
    };
    history.push(cycleResult);

    // Step 4: Report
    console.log(`\n[Cycle ${cycle}] Results:`);
    console.log(`  Total: ${results.total}`);
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);

    if (cycleResult.passed) {
      console.log(`\n✅ All tests passed on cycle ${cycle}!`);
      break;
    }

    // Step 5: Show failures
    console.log('\n❌ Failed tests:');
    for (const name of results.failedNames) {
      console.log(`  - ${name}`);
    }

    if (cycle < MAX_CYCLES) {
      const shouldRetry = await waitForUserInput(
        `\nFix the issues and retry? (cycle ${cycle + 1}/${MAX_CYCLES})`
      );
      if (!shouldRetry) {
        console.log('[Cycle] User chose to stop.');
        break;
      }
    } else {
      console.log(`\n⚠️  Max cycles (${MAX_CYCLES}) reached.`);
    }
  }

  // Final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Final Summary');
  console.log(`${'='.repeat(60)}`);
  for (const result of history) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(
      `  Cycle ${result.cycle}: ${status} (${result.passedTests}/${result.totalTests} passed, ${(result.duration / 1000).toFixed(1)}s)`
    );
  }

  const lastResult = history[history.length - 1];
  process.exit(lastResult.passed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
