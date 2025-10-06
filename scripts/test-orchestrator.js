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
    // Call the orchestration endpoint once (exactly like GitHub Actions)
    await runFullOrchestration();
    
    // Generate final report
    generateFinalReport();
    
  } catch (error) {
    log(`❌ Test failed with error: ${error.message}`, 'red');
    testResults.errors.push(`Test execution failed: ${error.message}`);
    generateFinalReport();
  }
}

async function runFullOrchestration() {
  log('📡 Calling orchestration endpoint (exactly like GitHub Actions)...', 'cyan');
  
  try {
    const body = CONFIG.PERIOD_START && CONFIG.PERIOD_END 
      ? { periodStart: CONFIG.PERIOD_START, periodEnd: CONFIG.PERIOD_END }
      : {};
    
    logVerbose(`Request body: ${JSON.stringify(body)}`);
    
    const response = await makeRequest(`${CONFIG.APP_URL}/api/admin/revenue/run-payout-orchestration`, {
      method: 'POST',
      body
    });
    
    log('');
    log(`HTTP Status: ${response.status}`, response.ok ? 'green' : 'red');
    logVerbose(`Full Response: ${JSON.stringify(response.data, null, 2)}`);
    log('');
    
    if (!response.ok) {
      log(`❌ API call failed with status ${response.status}`, 'red');
      log(`Response: ${JSON.stringify(response.data)}`, 'red');
      testResults.errors.push(`API call failed: ${response.data.error || 'Unknown error'}`);
      return;
    }
    
    // Extract period info
    if (response.data.period) {
      testResults.period = response.data.period;
      log(`📅 Period: ${response.data.period.start} to ${response.data.period.end}`, 'green');
    }
    
    // Parse all steps from response
    if (response.data.steps && Array.isArray(response.data.steps)) {
      log(`📈 Steps completed: ${response.data.steps.filter(s => s.success).length}/${response.data.steps.length}`, 'blue');
      log('');
      
      response.data.steps.forEach(step => {
        const status = step.success ? '✅' : '❌';
        const color = step.success ? 'green' : 'red';
        
        logStep(`STEP ${step.step}`, `${status} ${step.name}`, color);
        
        // Log step-specific data
        if (step.data) {
          if (step.name === 'Period Validation') {
            logVerbose(`  Period name: ${step.data.periodName || 'N/A'}`);
            logVerbose(`  PumpFun wallet: ${step.data.pumpfunCreatorWallet || 'N/A'}`);
            logVerbose(`  Revenue status: ${step.data.currentRevenueStatus || 'N/A'}`);
            logVerbose(`  Is current: ${step.data.isCurrent ?? 'N/A'}`);
          } else if (step.name === 'Calculate Interaction Scores') {
            logVerbose(`  Processed users: ${step.data.processedUsers || 0}`);
            logVerbose(`  Total pro users: ${step.data.totalProUsers || 0}`);
            logVerbose(`  Errors: ${step.data.errors || 0}`);
          } else if (step.name === 'Calculate PumpFun Period Fees') {
            logVerbose(`  PumpFun fees: ${step.data.pumpfunFees || 0} SOL`);
            logVerbose(`  PumpFun pool: ${step.data.pumpfunPool || 0} SOL`);
            logVerbose(`  Total pool: ${step.data.totalPool || 0} SOL`);
          } else if (step.name === 'Calculate Platform Period Fees') {
            logVerbose(`  Featured tokens revenue: ${step.data.featuredTokensRevenue || 0} SOL`);
            logVerbose(`  Pro subscriptions revenue: ${step.data.proSubscriptionsRevenue || 0} SOL`);
            logVerbose(`  Total platform revenue: ${step.data.totalPlatformRevenue || 0} SOL`);
            logVerbose(`  Platform pool: ${step.data.platformPool || 0} SOL`);
          } else if (step.name === 'Calculate User Payouts') {
            logVerbose(`  Total users: ${step.data.totalUsers || 0}`);
            logVerbose(`  Total score: ${step.data.totalScore || 0}`);
            logVerbose(`  Total calculated payout: ${step.data.totalCalculatedPayout || 0} SOL`);
            logVerbose(`  Is balanced: ${step.data.isBalanced ?? 'N/A'}`);
          }
        }
        
        if (step.error) {
          log(`  Error: ${step.error}`, 'red');
        }
        
        testResults.steps.push(step);
        log('');
      });
    }
    
    // Extract final results
    if (response.data.finalResults) {
      log('💰 FINAL RESULTS:', 'bright');
      log(`  Total pool: ${response.data.finalResults.totalPool || 0} SOL`, 'cyan');
      log(`  Total users: ${response.data.finalResults.totalUsers || 0}`, 'cyan');
      log(`  Total payout: ${response.data.finalResults.totalPayout || 0} SOL`, 'cyan');
      log(`  Balanced: ${response.data.finalResults.isBalanced ?? 'N/A'}`, 'cyan');
      log('');
    }
    
    // Check overall success
    if (response.data.success) {
      log(`✅ Orchestration completed successfully`, 'green');
    } else {
      log(`❌ Orchestration failed`, 'red');
      if (response.data.errors && response.data.errors.length > 0) {
        response.data.errors.forEach(error => {
          testResults.errors.push(error);
        });
      }
    }
    
    log('');
    log(`📝 Message: ${response.data.message || 'N/A'}`, 'blue');
    
  } catch (error) {
    log(`❌ Orchestration error: ${error.message}`, 'red');
    testResults.errors.push(`Orchestration error: ${error.message}`);
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
