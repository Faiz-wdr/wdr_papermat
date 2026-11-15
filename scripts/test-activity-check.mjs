#!/usr/bin/env node

/**
 * Manual Test Script for Supabase daily-activity-check Edge Function
 * 
 * Usage:
 *   node scripts/test-activity-check.mjs <FUNCTION_URL> <SECRET_TOKEN>
 * 
 * Example:
 *   node scripts/test-activity-check.mjs \
 *     https://fidtfvfwnqofhwnoxluq.supabase.co/functions/v1/daily-activity-check \
 *     my-super-secret-token-123
 */

const [,, functionUrl, secretToken] = process.argv;

if (!functionUrl || !secretToken) {
  console.log(`
Usage:
  node scripts/test-activity-check.mjs <FUNCTION_URL> <SECRET_TOKEN>

Example:
  node scripts/test-activity-check.mjs https://<project-ref>.supabase.co/functions/v1/daily-activity-check your-secret-token

Manual curl commands:
  # 1. Authorized Request (Expected: HTTP 200)
  curl -i -X POST "https://<project-ref>.supabase.co/functions/v1/daily-activity-check" \\
    -H "Authorization: Bearer <YOUR_SECRET>"

  # 2. Unauthorized Request (Expected: HTTP 401)
  curl -i -X POST "https://<project-ref>.supabase.co/functions/v1/daily-activity-check" \\
    -H "Authorization: Bearer invalid-token"
`);
  process.exit(1);
}

async function runTests() {
  console.log('--- Testing Supabase daily-activity-check ---');
  console.log(`Target URL: ${functionUrl}\n`);

  // Test 1: Unauthorized Request
  console.log('1. Testing Unauthorized Request (Expect 401)...');
  try {
    const unauthRes = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer wrong-secret-token',
        'Content-Type': 'application/json',
      },
    });
    const unauthBody = await unauthRes.json().catch(() => ({}));
    console.log(`   Status: ${unauthRes.status}`);
    console.log(`   Response:`, unauthBody);
    if (unauthRes.status === 401) {
      console.log('   ✅ Unauthorized check passed (returned 401 as expected)\n');
    } else {
      console.warn(`   ⚠️ Unexpected status code: ${unauthRes.status}\n`);
    }
  } catch (err) {
    console.error('   ❌ Error contacting function:', err.message);
  }

  // Test 2: Authorized Request
  console.log('2. Testing Authorized Request (Expect 200)...');
  try {
    const authRes = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretToken}`,
        'Content-Type': 'application/json',
      },
    });
    const authBody = await authRes.json().catch(() => ({}));
    console.log(`   Status: ${authRes.status}`);
    console.log(`   Response:`, authBody);
    if (authRes.status === 200 && authBody.success) {
      console.log('   ✅ Authorized check passed! Database query executed successfully.\n');
    } else {
      console.error(`   ❌ Failed with status ${authRes.status}. Check Edge Function logs.\n`);
    }
  } catch (err) {
    console.error('   ❌ Error contacting function:', err.message);
  }
}

runTests();

