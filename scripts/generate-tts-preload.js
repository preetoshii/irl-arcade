#!/usr/bin/env node

/**
 * Generate TTS Preload Cache
 * 
 * This script helps create a preload cache for common phrases
 * Run this after you've tested the app and have a good cache built up
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common phrases to preload (add more as needed)
const COMMON_PHRASES = [
  // Game names
  'Simon Says',
  'Audio Tag', 
  'Sexy Mama',
  
  // Common commands
  'Start Game',
  'Game Over',
  'You Win',
  'You Lose',
  'Player 1',
  'Player 2',
  'Round 1',
  'Round 2',
  'Round 3',
  
  // Add more phrases you want preloaded
];

console.log('TTS Cache Preload Generator');
console.log('===========================');
console.log('');
console.log('To generate a preload cache:');
console.log('');
console.log('1. Make sure you have ElevenLabs enabled in .env');
console.log('2. Open the app in your browser');
console.log('3. Navigate through all games and features to generate cache');
console.log('4. Open browser console and run:');
console.log('');
console.log('--- COPY THIS TO BROWSER CONSOLE ---');

// Output the export script
const exportScript = fs.readFileSync(
  path.join(__dirname, 'export-tts-cache.js'), 
  'utf-8'
);
console.log(exportScript);

console.log('--- END COPY ---');
console.log('');
console.log('5. Save the downloaded file as: public/tts-cache-preload.json');
console.log('6. Commit the file to your repository');
console.log('');
console.log('The cache will now be preloaded for all new users!');