#!/usr/bin/env node

/**
 * Test Script for Payout Orchestration
 * 
 * This script replicates the exact orchestrator behavior but provides detailed
 * reporting without failing on missing data. It tests all steps and reports
 * what was found vs what was expected.
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  API_SECRET_KEY: process.env.API_SECRET_KEY || 'test-key',
  PERIOD_START: process.argv[2] || null,
  PERIOD_END: process.argv[3] || null,
  VERBOSE: process.argv.includes('--verbose') || process.argv.includes('-v')
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message, status = 'info') {
  const statusColor = status === 'success' ? 'green' : status === 'error' ? 'red' : status === 'warning' ? 'yellow' : 'blue';
  log(`[${step}] ${message}`, statusColor);
}

function logVerbose(message) {
  if (CONFIG.VERBOSE) {
    log(`  ${message}`, 'cyan');
  }
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_SECRET_KEY}`,
        ...options.headers
      },
      timeout: 30000
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            ok: false,
            data: { error: 'Invalid JSON response', raw: data }
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test results tracking
const testResults = {
  period: null,
  steps: [],
  errors: [],
  warnings: [],
  summary: {
    totalSteps: 0,
    successfulSteps: 0,
    failedSteps: 0,
    warnings: 0
  }
};

async function testOrchestrator() {
  log('🚀 Starting Payout Orchestration Test', 'bright');
  log(`📅 Testing period: ${CONFIG.PERIOD_START || 'auto-detect'} to ${CONFIG.PERIOD_END || 'auto-detect'}`, 'blue');
  log(`🌐 App URL: ${CONFIG.APP_URL}`, 'blue');
  log('');

  try {
    // Step 1: Test Period Validation
    await testPeriodValidation();
    
    // Step 2: Test User Interaction Scores
    await testUserInteractionScores();
    
    // Step 3a: Test PumpFun Period Fees
    await testPumpFunPeriodFees();
    
    // Step 3b: Test Platform Period Fees
    await testPlatformPeriodFees();
    
    // Step 4: Test User Payouts
    await testUserPayouts();
    
    // Generate final report
    generateFinalReport();
    
  } catch (error) {
    log(`❌ Test failed with error: ${error.message}`, 'red');
    testResults.errors.push(`Test execution failed: ${error.message}`);
    generateFinalReport();
  }
}

async function testPeriodValidation() {
  logStep('STEP 1', 'Testing Period Validation', 'info');
  
  try {
    const body = CONFIG.PERIOD_START && CONFIG.PERIOD_END 
      ? { periodStart: CONFIG.PERIOD_START, periodEnd: CONFIG.PERIOD_END }
      : {};
    
    logVerbose(`Request body: ${JSON.stringify(body)}`);
    
    const response = await makeRequest(`${CONFIG.APP_URL}/api/admin/revenue/run-payout-orchestration`, {
      method: 'POST',
      body
    });
    
    if (response.ok && response.data.period) {
      testResults.period = response.data.period;
      logStep('STEP 1', `✅ Period validated: ${response.data.period.start} to ${response.data.period.end}`, 'success');
      
      if (response.data.steps && response.data.steps.length > 0) {
        const periodStep = response.data.steps.find(s => s.name === 'Period Validation');
        if (periodStep) {
          logVerbose(`Period name: ${periodStep.data?.periodName || 'N/A'}`);
          logVerbose(`PumpFun wallet: ${periodStep.data?.pumpfunCreatorWallet || 'N/A'}`);
          logVerbose(`Revenue status: ${periodStep.data?.currentRevenueStatus || 'N/A'}`);
          logVerbose(`Is current: ${periodStep.data?.isCurrent || 'N/A'}`);
          logVerbose(`Is future: ${periodStep.data?.isFuture || 'N/A'}`);
        }
      }
    } else {
      logStep('STEP 1', `❌ Period validation failed: ${response.data.error || 'Unknown error'}`, 'error');
      testResults.errors.push(`Period validation failed: ${response.data.error || 'Unknown error'}`);
    }
    
    testResults.steps.push({
      step: 1,
      name: 'Period Validation',
      success: response.ok,
      data: response.data
    });
    
  } catch (error) {
    logStep('STEP 1', `❌ Period validation error: ${error.message}`, 'error');
    testResults.errors.push(`Period validation error: ${error.message}`);
    testResults.steps.push({
      step: 1,
      name: 'Period Validation',
      success: false,
      error: error.message
    });
  }
  
  log('');
}

async function testUserInteractionScores() {
  logStep('STEP 2', 'Testing User Interaction Scores', 'info');
  
  if (!testResults.period) {
    logStep('STEP 2', '⚠️ Skipping - no valid period found', 'warning');
    testResults.warnings.push('Skipped user interaction scores test - no valid period');
    return;
  }
  
  try {
    const response = await makeRequest(`${CONFIG.APP_URL}/api/admin/revenue/period-interaction-score`, {
      method: 'POST',
      body: {
        periodStart: testResults.period.start,
        periodEnd: testResults.period.end
      }
    });
    
    if (response.ok) {
      logStep('STEP 2', `✅ User interaction scores calculated`, 'success');
      logVerbose(`Total users processed: ${response.data.summary?.totalUsers || 'N/A'}`);
      logVerbose(`Total score: ${response.data.summary?.totalScore || 'N/A'}`);
      logVerbose(`Average score: ${response.data.summary?.averageScore || 'N/A'}`);
      
      if (response.data.errors && response.data.errors.length > 0) {
        logStep('STEP 2', `⚠️ ${response.data.errors.length} user processing errors`, 'warning');
        response.data.errors.forEach(error => {
          logVerbose(`  - ${error}`);
          testResults.warnings.push(`User processing error: ${error}`);
        });
      }
    } else {
      logStep('STEP 2', `❌ User interaction scores failed: ${response.data.error || 'Unknown error'}`, 'error');
      testResults.errors.push(`User interaction scores failed: ${response.data.error || 'Unknown error'}`);
    }
    
    testResults.steps.push({
      step: 2,
      name: 'User Interaction Scores',
      success: response.ok,
      data: response.data
    });
    
  } catch (error) {
    logStep('STEP 2', `❌ User interaction scores error: ${error.message}`, 'error');
    testResults.errors.push(`User interaction scores error: ${error.message}`);
    testResults.steps.push({
      step: 2,
      name: 'User Interaction Scores',
      success: false,
      error: error.message
    });
  }
  
  log('');
}

async function testPumpFunPeriodFees() {
  logStep('STEP 3A', 'Testing PumpFun Period Fees', 'info');
  
  if (!testResults.period) {
    logStep('STEP 3A', '⚠️ Skipping - no valid period found', 'warning');
    testResults.warnings.push('Skipped PumpFun fees test - no valid period');
    return;
  }
  
  // Get PumpFun wallet from period data
  const periodStep = testResults.steps.find(s => s.name === 'Period Validation');
  const pumpfunWallet = periodStep?.data?.steps?.[0]?.data?.pumpfunCreatorWallet;
  
  if (!pumpfunWallet) {
    logStep('STEP 3A', '⚠️ Skipping - no PumpFun wallet found', 'warning');
    testResults.warnings.push('Skipped PumpFun fees test - no PumpFun wallet');
    return;
  }
  
  try {
    const response = await makeRequest(`${CONFIG.APP_URL}/api/admin/revenue/pumpfun-period-fees`, {
      method: 'POST',
      body: {
        walletAddress: pumpfunWallet,
        periodStart: testResults.period.start,
        periodEnd: testResults.period.end
      }
    });
    
    if (response.ok) {
      logStep('STEP 3A', `✅ PumpFun period fees calculated`, 'success');
      logVerbose(`PumpFun fees: ${response.data.pumpfunFees || 'N/A'} SOL`);
      logVerbose(`PumpFun pool: ${response.data.pumpfunPool || 'N/A'} SOL`);
      logVerbose(`Total pool: ${response.data.totalPool || 'N/A'} SOL`);
    } else {
      logStep('STEP 3A', `❌ PumpFun period fees failed: ${response.data.error || 'Unknown error'}`, 'error');
      testResults.errors.push(`PumpFun period fees failed: ${response.data.error || 'Unknown error'}`);
    }
    
    testResults.steps.push({
      step: 3,
      name: 'PumpFun Period Fees',
      success: response.ok,
      data: response.data
    });
    
  } catch (error) {
    logStep('STEP 3A', `❌ PumpFun period fees error: ${error.message}`, 'error');
    testResults.errors.push(`PumpFun period fees error: ${error.message}`);
    testResults.steps.push({
      step: 3,
      name: 'PumpFun Period Fees',
      success: false,
      error: error.message
    });
  }
  
  log('');
}

async function testPlatformPeriodFees() {
  logStep('STEP 3B', 'Testing Platform Period Fees', 'info');
  
  if (!testResults.period) {
    logStep('STEP 3B', '⚠️ Skipping - no valid period found', 'warning');
    testResults.warnings.push('Skipped platform fees test - no valid period');
    return;
  }
  
  try {
    const response = await makeRequest(`${CONFIG.APP_URL}/api/admin/revenue/platform-period-fees`, {
      method: 'POST',
      body: {
        periodStart: testResults.period.start,
        periodEnd: testResults.period.end
      }
    });
    
    if (response.ok) {
      logStep('STEP 3B', `✅ Platform period fees calculated`, 'success');
      logVerbose(`Featured tokens revenue: ${response.data.breakdown?.featuredTokens?.revenue || 'N/A'} SOL`);
      logVerbose(`Pro subscriptions revenue: ${response.data.breakdown?.proSubscriptions?.revenue || 'N/A'} SOL`);
      logVerbose(`Total platform revenue: ${response.data.breakdown?.total || 'N/A'} SOL`);
      logVerbose(`Platform pool: ${response.data.breakdown?.platformPool || 'N/A'} SOL`);
    } else {
      logStep('STEP 3B', `❌ Platform period fees failed: ${response.data.error || 'Unknown error'}`, 'error');
      testResults.errors.push(`Platform period fees failed: ${response.data.error || 'Unknown error'}`);
    }
    
    testResults.steps.push({
      step: 3,
      name: 'Platform Period Fees',
      success: response.ok,
      data: response.data
    });
    
  } catch (error) {
    logStep('STEP 3B', `❌ Platform period fees error: ${error.message}`, 'error');
    testResults.errors.push(`Platform period fees error: ${error.message}`);
    testResults.steps.push({
      step: 3,
      name: 'Platform Period Fees',
      success: false,
      error: error.message
    });
  }
  
  log('');
}

async function testUserPayouts() {
  logStep('STEP 4', 'Testing User Payouts', 'info');
  
  if (!testResults.period) {
    logStep('STEP 4', '⚠️ Skipping - no valid period found', 'warning');
    testResults.warnings.push('Skipped user payouts test - no valid period');
    return;
  }
  
  try {
    const response = await makeRequest(`${CONFIG.APP_URL}/api/admin/revenue/user-payouts`, {
      method: 'POST',
      body: {
        periodStart: testResults.period.start,
        periodEnd: testResults.period.end
      }
    });
    
    if (response.ok) {
      logStep('STEP 4', `✅ User payouts calculated`, 'success');
      logVerbose(`Total users: ${response.data.payoutSummary?.totalUsers || 'N/A'}`);
      logVerbose(`Total score: ${response.data.payoutSummary?.totalScore || 'N/A'}`);
      logVerbose(`Total calculated payout: ${response.data.payoutSummary?.totalCalculatedPayout || 'N/A'} SOL`);
      logVerbose(`Is balanced: ${response.data.payoutSummary?.verification?.isBalanced || 'N/A'}`);
      
      if (response.data.payoutSummary?.verification?.balanceDifference) {
        logVerbose(`Balance difference: ${response.data.payoutSummary.verification.balanceDifference} SOL`);
      }
    } else {
      logStep('STEP 4', `❌ User payouts failed: ${response.data.error || 'Unknown error'}`, 'error');
      testResults.errors.push(`User payouts failed: ${response.data.error || 'Unknown error'}`);
    }
    
    testResults.steps.push({
      step: 4,
      name: 'User Payouts',
      success: response.ok,
      data: response.data
    });
    
  } catch (error) {
    logStep('STEP 4', `❌ User payouts error: ${error.message}`, 'error');
    testResults.errors.push(`User payouts error: ${error.message}`);
    testResults.steps.push({
      step: 4,
      name: 'User Payouts',
      success: false,
      error: error.message
    });
  }
  
  log('');
}

function generateFinalReport() {
  log('📊 FINAL TEST REPORT', 'bright');
  log('='.repeat(50), 'blue');
  
  // Update summary
  testResults.summary.totalSteps = testResults.steps.length;
  testResults.summary.successfulSteps = testResults.steps.filter(s => s.success).length;
  testResults.summary.failedSteps = testResults.steps.filter(s => !s.success).length;
  testResults.summary.warnings = testResults.warnings.length;
  
  // Period info
  if (testResults.period) {
    log(`📅 Period: ${testResults.period.start} to ${testResults.period.end}`, 'green');
  } else {
    log('📅 Period: Not found', 'red');
  }
  
  // Summary stats
  log(`📈 Steps: ${testResults.summary.successfulSteps}/${testResults.summary.totalSteps} successful`, 
      testResults.summary.failedSteps === 0 ? 'green' : 'yellow');
  log(`⚠️ Warnings: ${testResults.summary.warnings}`, testResults.summary.warnings === 0 ? 'green' : 'yellow');
  log(`❌ Errors: ${testResults.errors.length}`, testResults.errors.length === 0 ? 'green' : 'red');
  
  log('');
  
  // Step details
  log('📋 STEP DETAILS:', 'bright');
  testResults.steps.forEach(step => {
    const status = step.success ? '✅' : '❌';
    const color = step.success ? 'green' : 'red';
    log(`  ${status} Step ${step.step}: ${step.name}`, color);
    
    if (step.error) {
      log(`     Error: ${step.error}`, 'red');
    }
  });
  
  log('');
  
  // Warnings
  if (testResults.warnings.length > 0) {
    log('⚠️ WARNINGS:', 'yellow');
    testResults.warnings.forEach(warning => {
      log(`  - ${warning}`, 'yellow');
    });
    log('');
  }
  
  // Errors
  if (testResults.errors.length > 0) {
    log('❌ ERRORS:', 'red');
    testResults.errors.forEach(error => {
      log(`  - ${error}`, 'red');
    });
    log('');
  }
  
  // Recommendations
  log('💡 RECOMMENDATIONS:', 'bright');
  
  if (testResults.summary.failedSteps === 0) {
    log('  ✅ All tests passed! The orchestrator is ready for production.', 'green');
  } else {
    log('  🔧 Fix the errors above before running the orchestrator in production.', 'yellow');
  }
  
  if (testResults.warnings.length > 0) {
    log('  ⚠️ Review warnings to ensure optimal performance.', 'yellow');
  }
  
  if (!testResults.period) {
    log('  📅 Ensure biweekly_periods table has valid data.', 'yellow');
  }
  
  log('');
  log('🏁 Test completed!', 'bright');
}

// Help text
function showHelp() {
  log('Payout Orchestration Test Script', 'bright');
  log('');
  log('Usage:', 'blue');
  log('  node test-orchestrator.js [periodStart] [periodEnd] [options]');
  log('');
  log('Arguments:', 'blue');
  log('  periodStart    Start date in YYYY-MM-DD format (optional)');
  log('  periodEnd      End date in YYYY-MM-DD format (optional)');
  log('');
  log('Options:', 'blue');
  log('  --verbose, -v  Show detailed output');
  log('  --help, -h     Show this help message');
  log('');
  log('Environment Variables:', 'blue');
  log('  APP_URL        Your app URL (default: http://localhost:3000)');
  log('  API_SECRET_KEY Your API secret key (default: test-key)');
  log('');
  log('Examples:', 'blue');
  log('  node test-orchestrator.js');
  log('  node test-orchestrator.js 2025-10-01 2025-10-14');
  log('  node test-orchestrator.js --verbose');
  log('');
}

// Main execution
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the test
testOrchestrator().catch(error => {
  log(`💥 Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
