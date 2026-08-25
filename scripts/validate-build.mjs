import { access, readFile } from 'node:fs/promises';

const requiredFiles = ['index.html', 'style.css', 'app.js', 'netlify/functions/generate.js', 'netlify/functions/get-mapbox-token.js'];
for (const file of requiredFiles) await access(file);

const app = await readFile('app.js', 'utf8');
if (app.includes('innerHTML')) throw new Error('Unsafe innerHTML usage found in app.js');
if (app.includes('GOOGLE_AI_API_KEY') || app.includes('GEMINI_API_KEY')) throw new Error('Frontend references private Gemini keys');

const generate = await readFile('netlify/functions/generate.js', 'utf8');
if (generate.includes('@google/generative-ai')) throw new Error('Old Gemini SDK reference found');
if (!generate.includes('@google/genai')) throw new Error('New Gemini SDK is not used');

console.log('Static build validation passed.');
