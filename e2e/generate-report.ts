import fs from 'fs';
import path from 'path';

const REPORTS_DIR = path.resolve(__dirname, 'reports');
const EVIDENCE_DIR = path.resolve(__dirname, 'evidence');
const SPEC_HTML = path.resolve(__dirname, 'test-spec.html');
const OUTPUT_HTML = path.resolve(REPORTS_DIR, 'test-report.html');

interface TestResult {
  id: string;
  title: string;
  suite: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  error?: string;
  attachments: Array<{
    name: string;
    path?: string;
    body?: string;
    contentType: string;
  }>;
}

function parsePlaywrightResults(): TestResult[] {
  const resultsPath = path.join(REPORTS_DIR, 'results.json');
  if (!fs.existsSync(resultsPath)) {
    console.log('No results.json found. Run tests first.');
    return [];
  }

  const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  const results: TestResult[] = [];

  function walkSuites(suites: any[], parentTitle = ''): void {
    for (const suite of suites) {
      const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

      if (suite.specs) {
        for (const spec of suite.specs) {
          for (const test of spec.tests || []) {
            const result = test.results?.[0] || {};
            const attachments = (result.attachments || []).map((a: any) => ({
              name: a.name,
              path: a.path,
              body: a.body,
              contentType: a.contentType,
            }));

            results.push({
              id: spec.title.match(/P\d{3}/)?.[0] || spec.id || '',
              title: spec.title,
              suite: suite.title,
              status: result.status === 'passed' ? 'passed'
                : result.status === 'skipped' ? 'skipped'
                : result.status ? 'failed' : 'pending',
              duration: result.duration || 0,
              error: result.error?.message,
              attachments,
            });
          }
        }
      }

      if (suite.suites) {
        walkSuites(suite.suites, suiteTitle);
      }
    }
  }

  walkSuites(data.suites || []);
  return results;
}

function generateEvidenceHTML(results: TestResult[]): string {
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const pending = results.filter(r => r.status === 'pending').length;
  const total = results.length;
  const passRate = total > 0 ? ((passed / (total - skipped)) * 100).toFixed(1) : '0';

  let html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SpinShelf E2E テスト結果レポート</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f7; color: #1d1d1f; line-height: 1.5; }
  .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 28px; margin-bottom: 20px; }
  .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 30px; }
  .stat-card { background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .stat-card .number { font-size: 36px; font-weight: 700; }
  .stat-card .label { font-size: 14px; color: #86868b; margin-top: 4px; }
  .stat-card.pass .number { color: #34c759; }
  .stat-card.fail .number { color: #ff3b30; }
  .stat-card.skip .number { color: #ff9500; }
  .stat-card.rate .number { color: #007aff; }
  .result-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 20px; }
  .result-table th { background: #1d1d1f; color: white; padding: 12px 16px; text-align: left; font-weight: 600; }
  .result-table td { padding: 10px 16px; border-bottom: 1px solid #e5e5e7; }
  .result-table tr:last-child td { border-bottom: none; }
  .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .status-passed { background: #d1f2d9; color: #1b7a34; }
  .status-failed { background: #fdd; color: #c00; }
  .status-skipped { background: #fff3cd; color: #856404; }
  .status-pending { background: #e2e3e5; color: #383d41; }
  .error-msg { color: #ff3b30; font-size: 12px; font-family: monospace; margin-top: 4px; max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attachments { font-size: 12px; color: #86868b; }
  .timestamp { text-align: center; color: #86868b; padding: 20px; }
</style>
</head>
<body>
<div class="container">
  <h1>SpinShelf E2E テスト結果レポート</h1>

  <div class="dashboard">
    <div class="stat-card pass"><div class="number">${passed}</div><div class="label">Passed</div></div>
    <div class="stat-card fail"><div class="number">${failed}</div><div class="label">Failed</div></div>
    <div class="stat-card skip"><div class="number">${skipped}</div><div class="label">Skipped</div></div>
    <div class="stat-card"><div class="number">${total}</div><div class="label">Total</div></div>
    <div class="stat-card rate"><div class="number">${passRate}%</div><div class="label">Pass Rate</div></div>
  </div>

  <table class="result-table">
    <thead>
      <tr><th>ID</th><th>テスト名</th><th>ステータス</th><th>所要時間</th><th>エビデンス</th></tr>
    </thead>
    <tbody>`;

  for (const result of results) {
    const statusClass = `status-${result.status}`;
    const statusLabel = result.status === 'passed' ? 'PASS'
      : result.status === 'failed' ? 'FAIL'
      : result.status === 'skipped' ? 'SKIP' : 'PENDING';
    const duration = (result.duration / 1000).toFixed(1) + 's';
    const attachmentCount = result.attachments.length;
    const errorHtml = result.error
      ? `<div class="error-msg" title="${escapeHtml(result.error)}">${escapeHtml(result.error.substring(0, 100))}</div>`
      : '';

    html += `
      <tr>
        <td><strong>${escapeHtml(result.id)}</strong></td>
        <td>${escapeHtml(result.title)}${errorHtml}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>${duration}</td>
        <td class="attachments">${attachmentCount} files</td>
      </tr>`;
  }

  html += `
    </tbody>
  </table>

  <div class="timestamp">Generated: ${new Date().toLocaleString('ja-JP')}</div>
</div>
</body>
</html>`;

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function main(): void {
  console.log('[Report] Parsing Playwright results...');
  const results = parsePlaywrightResults();
  console.log(`[Report] Found ${results.length} test results`);

  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const html = generateEvidenceHTML(results);
  fs.writeFileSync(OUTPUT_HTML, html, 'utf-8');
  console.log(`[Report] Written to ${OUTPUT_HTML}`);

  // Summary
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  console.log(`[Report] Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
}

main();
