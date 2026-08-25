# ✨ Travel Planner Pro

A premium dark-cosmic travel planner that uses **server-side Gemini** to generate structured itineraries, budget breakdowns, hotel recommendations, and **Mapbox** destination previews without changing the core AI itinerary concept.

## Highlights

- 🤖 AI itinerary generation with `@google/genai`
- 🧾 Structured JSON output validated by a Netlify Function
- 💸 INR budget guardrails and exact trip-duration enforcement
- 🏨 Hotel recommendations returned only from Gemini output (no fake fallback data)
- 🗺️ Server-side Mapbox geocoding plus frontend map preview
- 🔐 Gemini API key stays server-side only
- 🌌 Premium responsive glassmorphism UI
- 🧪 Static build checks and function behavior tests

## Screenshots

Add screenshots here after deploying or running locally:

| Planner | Generated itinerary | Mobile |
| --- | --- | --- |
| `screenshots/planner.png` | `screenshots/itinerary.png` | `screenshots/mobile.png` |

## Architecture

```text
Browser UI
  ├─ requests public Mapbox token from /.netlify/functions/get-mapbox-token
  ├─ submits city, budget, days, preferences to /.netlify/functions/generate
  └─ renders results with safe DOM APIs, not unsafe HTML injection

Netlify Functions
  ├─ validate inputs and realistic budget/day
  ├─ call Gemini with structured JSON schema
  ├─ normalize and verify Gemini data
  ├─ geocode destination with Mapbox server-side
  └─ return only safe trip data to the browser
```

## Tech Stack

- HTML, CSS, modern vanilla JavaScript
- Netlify Functions
- Google Gemini via `@google/genai`
- Mapbox GL JS and Mapbox Geocoding API
- Node.js 20

## Local Setup

```bash
git clone https://github.com/KAVYA-29-ai/Travel-Itinerary.git
cd Travel-Itinerary
npm install
cp .env.example .env
```

Fill in `.env`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

Run locally with Netlify Functions:

```bash
npm run dev
```

Then open the Netlify Dev URL printed in your terminal.

## Environment Variables

| Variable | Required | Visibility | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Server only | Authenticates Gemini itinerary generation. |
| `MAPBOX_ACCESS_TOKEN` | Recommended | Public token returned to frontend | Powers the Mapbox preview and server-side geocoding. |

`GOOGLE_AI_API_KEY` is accepted only as a backwards-compatible server-side alias, but `GEMINI_API_KEY` is preferred.

## Netlify Deployment

1. Import the repository into Netlify.
2. Set build command to `npm run build`.
3. Set publish directory to `.`.
4. Set functions directory to `netlify/functions`.
5. Add environment variables in Netlify Site settings.
6. Deploy.

The included `netlify.toml` configures Node 20, the publish directory, and the functions directory.

## API and Security Notes

- Gemini runs only in `netlify/functions/generate.js`.
- The frontend never references Gemini keys.
- Gemini output is parsed as JSON, normalized, and rejected if malformed.
- The frontend uses DOM creation and `textContent` instead of injecting model output with `innerHTML`.
- Missing API keys return clear service errors instead of fake fallback results.
- Mapbox token absence is handled gracefully: itinerary generation can continue while the map preview is disabled.

## Project Structure

```text
.
├── app.js                          # Frontend interactions and safe rendering
├── index.html                      # App shell
├── style.css                       # Premium responsive cosmic UI
├── netlify/functions/generate.js   # Gemini itinerary API + Mapbox geocoding
├── netlify/functions/get-mapbox-token.js
├── scripts/validate-build.mjs      # Static safety checks
├── scripts/test-functions.mjs      # Function behavior tests
├── .env.example
├── .gitignore
├── netlify.toml
└── package.json
```

## How Gemini + Mapbox Work

1. The user submits a destination, total budget, trip length, and preferences.
2. The Netlify Function validates the request and calls Gemini using a JSON response schema.
3. The function rejects malformed JSON, wrong day counts, incomplete hotels, or plans exceeding budget.
4. In parallel, Mapbox geocodes the city on the server.
5. The frontend receives a safe JSON response and renders itinerary cards, hotel cards, budget progress, and map position.

## Author

Built by **KAVYA-29-ai** as a recruiter-friendly AI travel planning project.
