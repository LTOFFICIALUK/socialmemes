#!/usr/bin/env node

/**
 * Script to manually unflag expired users
 * Usage: node scripts/unflag-users.js
 * 
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function unflagExpiredUsers() {
  try {
    console.log('🔍 Checking for expired flags...');
    
    // Get all flagged users whose flag has expired (older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: expiredFlags, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, moderation_status, moderated_at, moderation_reason')
      .eq('moderation_status', 'flagged')
      .lt('moderated_at', twentyFourHoursAgo);
    
    if (fetchError) {
      console.error('❌ Error fetching expired flags:', fetchError);
      process.exit(1);
    }
    
    if (!expiredFlags || expiredFlags.length === 0) {
      console.log('✅ No expired flags found');
      return;
    }
    
    console.log(`📋 Found ${expiredFlags.length} expired flag(s):`);
    expiredFlags.forEach(user => {
      const flaggedAt = new Date(user.moderated_at);
      const hoursAgo = Math.floor((Date.now() - flaggedAt.getTime()) / (1000 * 60 * 60));
      console.log(`   - ${user.username} (flagged ${hoursAgo}h ago: "${user.moderation_reason}")`);
    });
    
    // Unflag all expired users
    const userIds = expiredFlags.map(u => u.id);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        moderation_status: 'active',
        moderation_reason: null,
        moderated_by: null,
        moderated_at: null
      })
      .in('id', userIds);
    
    if (updateError) {
      console.error('❌ Error unflagging users:', updateError);
      process.exit(1);
    }
    
    console.log(`✅ Successfully unflagged ${expiredFlags.length} user(s)`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Also show current flagged users for reference
async function showCurrentFlags() {
  try {
    const { data: currentFlags, error } = await supabase
      .from('profiles')
      .select('id, username, moderation_status, moderated_at, moderation_reason')
      .eq('moderation_status', 'flagged')
      .order('moderated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching current flags:', error);
      return;
    }
    
    if (currentFlags && currentFlags.length > 0) {
      console.log(`\n📊 Currently flagged users (${currentFlags.length}):`);
      currentFlags.forEach(user => {
        const flaggedAt = new Date(user.moderated_at);
        const hoursAgo = Math.floor((Date.now() - flaggedAt.getTime()) / (1000 * 60 * 60));
        const status = hoursAgo >= 24 ? '🔴 EXPIRED' : `🟡 ${24 - hoursAgo}h remaining`;
        console.log(`   - ${user.username} (${status}): "${user.moderation_reason}"`);
      });
    } else {
      console.log('\n📊 No currently flagged users');
    }
  } catch (error) {
    console.error('Error showing current flags:', error);
  }
}

async function main() {
  console.log('🚀 Starting unflag process...\n');
  
  await showCurrentFlags();
  console.log('\n' + '='.repeat(50) + '\n');
  await unflagExpiredUsers();
  
  console.log('\n🎉 Unflag process completed!');
}

main();
