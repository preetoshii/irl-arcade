#!/usr/bin/env node

/**
 * Automated TTS Cache Builder
 * 
 * This script automatically generates all TTS audio during build time
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Phrases to pre-generate
const PHRASES_TO_CACHE = [
  // Game names
  'Simon Says',
  'Audio Tag',
  'Sexy Mama',
  
  // Common UI phrases
  'Start Game',
  'Game Over',
  'You Win',
  'You Lose',
  'Next Round',
  'Final Round',
  
  // Player phrases
  'Player 1',
  'Player 2', 
  'Player 3',
  'Player 4',
  'Red Team',
  'Blue Team',
  
  // Numbers and rounds
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4',
  'Round 5',
  
  // Simon Says specific
  'Simon says',
  'Do not',
  'Freeze',
  'Jump',
  'Clap your hands',
  'Touch your toes',
  'Spin around',
  
  // Add more phrases as needed
];

async function buildTTSCache() {
  console.log('🎙️  Building TTS Cache...\n');
  
  // Check if ElevenLabs is configured
  if (!process.env.VITE_ELEVENLABS_API_KEY) {
    console.log('⚠️  No ElevenLabs API key found in .env');
    console.log('   Skipping TTS cache generation');
    return;
  }
  
  // Launch headless browser
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    // Set localStorage to use ElevenLabs
    storageState: {
      origins: [{
        origin: 'http://localhost:5173',
        localStorage: [{
          name: 'tts_provider',
          value: 'elevenlabs'
        }]
      }]
    }
  });
  
  const page = await context.newPage();
  
  // Start dev server URL
  const devUrl = process.env.VITE_DEV_URL || 'http://localhost:5173';
  
  try {
    // Navigate to app
    console.log(`📱 Loading app at ${devUrl}`);
    await page.goto(devUrl, { waitUntil: 'networkidle' });
    
    // Wait for TTS service to initialize
    await page.waitForTimeout(2000);
    
    // Inject cache generation script
    await page.evaluate((phrases) => {
      return new Promise(async (resolve) => {
        console.log('Generating TTS cache for phrases:', phrases);
        
        // Generate audio for each phrase
        for (const phrase of phrases) {
          try {
            console.log(`Generating: "${phrase}"`);
            await window.Game.speak(phrase);
            // Wait between generations to avoid rate limits
            await new Promise(r => setTimeout(r, 1000));
          } catch (error) {
            console.error(`Failed to generate "${phrase}":`, error);
          }
        }
        
        resolve();
      });
    }, PHRASES_TO_CACHE);
    
    console.log('\n✅ Audio generation complete');
    
    // Extract the cache
    const cacheData = await page.evaluate(() => {
      const cachePrefix = 'tts_cache_';
      const cacheIndexKey = 'tts_cache_index';
      const cache = {};
      
      // Get all TTS cache entries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(cachePrefix)) {
          cache[key] = localStorage.getItem(key);
        }
      });
      
      // Get the index
      const index = localStorage.getItem(cacheIndexKey);
      if (index) {
        cache[cacheIndexKey] = index;
      }
      
      return {
        version: 1,
        exportDate: new Date().toISOString(),
        entries: Object.keys(cache).length,
        cache: cache
      };
    });
    
    // Save cache to file
    const outputPath = path.join(__dirname, '../public/tts-cache-preload.json');
    fs.writeFileSync(outputPath, JSON.stringify(cacheData, null, 2));
    
    console.log(`\n📦 Cache saved to: public/tts-cache-preload.json`);
    console.log(`   ${cacheData.entries} entries cached`);
    console.log(`   Size: ${(JSON.stringify(cacheData).length / 1024).toFixed(1)}KB`);
    
  } catch (error) {
    console.error('❌ Error building cache:', error);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildTTSCache().catch(console.error);
}

export default buildTTSCache;