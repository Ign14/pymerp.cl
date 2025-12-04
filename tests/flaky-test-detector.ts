/**
 * Detector de Tests Flaky
 * 
 * Ejecuta cada test múltiples veces para detectar flakiness
 * 
 * Uso:
 * npx playwright test --repeat-each=10
 */

import { test, expect } from '@playwright/test';

interface FlakyTestResult {
  testName: string;
  runs: number;
  failures: number;
  flakyRate: number;
  failureReasons: string[];
}

const flakyResults: FlakyTestResult[] = [];

/**
 * Wrapper para detectar tests flaky
 */
export function detectFlaky(testName: string, testFn: () => Promise<void>) {
  return test(testName, async ({ page }, testInfo) => {
    const result: FlakyTestResult = {
      testName,
      runs: testInfo.retry + 1,
      failures: 0,
      flakyRate: 0,
      failureReasons: [],
    };

    try {
      await testFn();
    } catch (error) {
      result.failures++;
      result.failureReasons.push((error as Error).message);
      
      // Tomar screenshot del failure
      await page.screenshot({
        path: `test-results/flaky/${testName.replace(/\s+/g, '-')}-failure-${Date.now()}.png`,
        fullPage: true,
      });
      
      throw error;
    } finally {
      result.flakyRate = result.failures / result.runs;
      flakyResults.push(result);
      
      // Si flakyRate > 0.2 (20%), registrar
      if (result.flakyRate > 0.2) {
        console.warn(`⚠️ FLAKY TEST DETECTED: ${testName} (${result.flakyRate * 100}% failure rate)`);
      }
    }
  });
}

/**
 * Reporter de tests flaky
 */
export function reportFlakyTests() {
  if (flakyResults.length === 0) return;
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 FLAKY TESTS REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const flakyTests = flakyResults.filter(r => r.flakyRate > 0);
  
  if (flakyTests.length === 0) {
    console.log('✅ No se detectaron tests flaky\n');
    return;
  }
  
  flakyTests
    .sort((a, b) => b.flakyRate - a.flakyRate)
    .forEach(result => {
      console.log(`\n❌ ${result.testName}`);
      console.log(`   Runs: ${result.runs}`);
      console.log(`   Failures: ${result.failures}`);
      console.log(`   Flaky Rate: ${(result.flakyRate * 100).toFixed(1)}%`);
      
      if (result.failureReasons.length > 0) {
        console.log(`   Reasons:`);
        result.failureReasons.forEach((reason, idx) => {
          console.log(`     ${idx + 1}. ${reason}`);
        });
      }
    });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Exportar resultados para análisis
export function exportFlakyReport(filename = 'flaky-report.json') {
  const fs = require('fs');
  const path = require('path');
  
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: flakyResults.length,
    flakyTests: flakyResults.filter(r => r.flakyRate > 0).length,
    results: flakyResults,
  };
  
  fs.writeFileSync(
    path.join('test-results', filename),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`📄 Flaky report exportado: test-results/${filename}`);
}

