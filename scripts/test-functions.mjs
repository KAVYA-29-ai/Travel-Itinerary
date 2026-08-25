import assert from 'node:assert/strict';

const originalFetch = global.fetch;
const { handler: generate } = await import('../netlify/functions/generate.js');
const { handler: mapbox } = await import('../netlify/functions/get-mapbox-token.js');

const callGenerate = (body, method = 'POST') => generate({ httpMethod: method, body: JSON.stringify(body) });

let res = await callGenerate({}, 'GET');
assert.equal(res.statusCode, 405);

res = await generate({ httpMethod: 'POST', body: '{bad json' });
assert.equal(res.statusCode, 400);

res = await callGenerate({ city: 'A', budget: 1000, days: 2 });
assert.equal(res.statusCode, 400);

res = await callGenerate({ city: 'Paris', budget: 200, days: 2 });
assert.equal(res.statusCode, 400);

const oldGemini = process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_AI_API_KEY;
res = await callGenerate({ city: 'Paris', budget: 20000, days: 2 });
assert.equal(res.statusCode, 503);
if (oldGemini) process.env.GEMINI_API_KEY = oldGemini;

const oldMapbox = process.env.MAPBOX_ACCESS_TOKEN;
delete process.env.MAPBOX_ACCESS_TOKEN;
res = await mapbox({ httpMethod: 'GET' });
assert.equal(res.statusCode, 200);
assert.equal(JSON.parse(res.body).configured, false);
if (oldMapbox) process.env.MAPBOX_ACCESS_TOKEN = oldMapbox;

global.fetch = async () => ({ ok: false, json: async () => ({}) });
process.env.GEMINI_API_KEY = 'test-key';
res = await callGenerate({ city: 'Paris', budget: 20000, days: 2 });
assert.equal(res.statusCode, 502);
global.fetch = originalFetch;

console.log('Function behavior tests passed.');
