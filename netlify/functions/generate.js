const MIN_DAILY_BUDGET = 500;
const MAX_DAYS = 21;
const MAX_BUDGET = 10_000_000;
const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const itinerarySchema = {
  type: 'object',
  required: ['summary', 'totalCost', 'hotels', 'itinerary'],
  properties: {
    summary: { type: 'string' },
    totalCost: { type: 'number' },
    hotels: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'pricePerNight', 'description', 'rating', 'distanceFromCenter'],
        properties: {
          name: { type: 'string' },
          pricePerNight: { type: 'number' },
          description: { type: 'string' },
          rating: { type: 'number' },
          distanceFromCenter: { type: 'string' }
        }
      }
    },
    itinerary: {
      type: 'array',
      items: {
        type: 'object',
        required: ['day', 'dailyCost', 'morning', 'afternoon', 'evening', 'dining', 'hotel'],
        properties: {
          day: { type: 'number' },
          dailyCost: { type: 'number' },
          morning: { type: 'object', required: ['activity', 'cost'], properties: { activity: { type: 'string' }, cost: { type: 'number' } } },
          afternoon: { type: 'object', required: ['activity', 'cost'], properties: { activity: { type: 'string' }, cost: { type: 'number' } } },
          evening: { type: 'object', required: ['activity', 'cost'], properties: { activity: { type: 'string' }, cost: { type: 'number' } } },
          dining: { type: 'object', required: ['restaurant', 'cuisine', 'cost'], properties: { restaurant: { type: 'string' }, cuisine: { type: 'string' }, cost: { type: 'number' } } },
          hotel: { type: 'object', required: ['name', 'price'], properties: { name: { type: 'string' }, price: { type: 'number' } } }
        }
      }
    }
  }
};

const response = (statusCode, body) => ({ statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) });
const toPositiveInteger = (value) => Number.isInteger(Number(value)) ? Number(value) : NaN;
const money = (value) => Math.max(0, Math.round(Number(value) || 0));

function parseBody(body) {
  try { return JSON.parse(body || '{}'); } catch { return null; }
}

function validateRequest(payload) {
  if (!payload) return 'Request body must be valid JSON.';
  const city = String(payload.city || '').trim();
  const budget = toPositiveInteger(payload.budget);
  const days = toPositiveInteger(payload.days);
  if (city.length < 2 || city.length > 80) return 'Enter a destination city between 2 and 80 characters.';
  if (!Number.isFinite(budget) || budget <= 0 || budget > MAX_BUDGET) return `Budget must be a positive whole number up to ₹${MAX_BUDGET}.`;
  if (!Number.isFinite(days) || days < 1 || days > MAX_DAYS) return `Trip duration must be between 1 and ${MAX_DAYS} days.`;
  const minimumBudget = days * MIN_DAILY_BUDGET;
  if (budget < minimumBudget) return `Budget is too low for ${days} days. Minimum realistic budget is ₹${minimumBudget}.`;
  return '';
}

async function geocodeCity(city) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return { coordinates: null, warning: 'Mapbox token is not configured, so the map preview is unavailable.' };

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('limit', '1');
  url.searchParams.set('types', 'place,locality');

  try {
    const res = await fetch(url);
    if (!res.ok) return { coordinates: null, warning: 'Mapbox could not geocode this destination.' };
    const data = await res.json();
    const center = data?.features?.[0]?.center;
    return Array.isArray(center) && center.length === 2 ? { coordinates: center, warning: null } : { coordinates: null, warning: 'No Mapbox coordinates were found for this destination.' };
  } catch (error) {
    console.error('Mapbox geocoding failed:', error);
    return { coordinates: null, warning: 'Mapbox geocoding is temporarily unavailable.' };
  }
}

function normalizePlan(plan, days, budget) {
  if (!plan || !Array.isArray(plan.itinerary) || plan.itinerary.length !== days) {
    throw new Error('Gemini returned an itinerary with the wrong number of days.');
  }
  if (!Array.isArray(plan.hotels) || plan.hotels.length === 0) {
    throw new Error('Gemini did not return hotel recommendations.');
  }

  const itinerary = plan.itinerary.map((day, index) => {
    for (const key of ['morning', 'afternoon', 'evening', 'dining', 'hotel']) {
      if (!day?.[key] || typeof day[key] !== 'object') throw new Error(`Day ${index + 1} is missing ${key} details.`);
    }
    const normalized = {
      day: index + 1,
      morning: { activity: String(day.morning.activity || '').trim(), cost: money(day.morning.cost) },
      afternoon: { activity: String(day.afternoon.activity || '').trim(), cost: money(day.afternoon.cost) },
      evening: { activity: String(day.evening.activity || '').trim(), cost: money(day.evening.cost) },
      dining: { restaurant: String(day.dining.restaurant || '').trim(), cuisine: String(day.dining.cuisine || '').trim(), cost: money(day.dining.cost) },
      hotel: { name: String(day.hotel.name || '').trim(), price: money(day.hotel.price) }
    };
    if (!normalized.morning.activity || !normalized.afternoon.activity || !normalized.evening.activity || !normalized.dining.restaurant || !normalized.hotel.name) {
      throw new Error(`Day ${index + 1} contains incomplete itinerary details.`);
    }
    normalized.dailyCost = normalized.morning.cost + normalized.afternoon.cost + normalized.evening.cost + normalized.dining.cost + normalized.hotel.price;
    if (normalized.dailyCost < MIN_DAILY_BUDGET) throw new Error(`Day ${index + 1} is below the minimum realistic daily budget.`);
    return normalized;
  });

  const totalCost = itinerary.reduce((sum, day) => sum + day.dailyCost, 0);
  if (totalCost > budget) throw new Error('Gemini returned a plan that exceeds the requested budget.');

  const hotels = plan.hotels.slice(0, 4).map((hotel) => ({
    name: String(hotel.name || '').trim(),
    pricePerNight: money(hotel.pricePerNight),
    description: String(hotel.description || '').trim(),
    rating: Math.min(5, Math.max(0, Number(hotel.rating) || 0)),
    distanceFromCenter: String(hotel.distanceFromCenter || '').trim()
  })).filter((hotel) => hotel.name && hotel.description && hotel.pricePerNight > 0);
  if (!hotels.length) throw new Error('Gemini returned malformed hotel data.');

  return { summary: String(plan.summary || '').trim(), totalCost, hotels, itinerary };
}

async function createItinerary({ city, budget, days, preferences }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini API key is not configured.');
    error.statusCode = 503;
    throw error;
  }

  let GoogleGenAI;
  try {
    ({ GoogleGenAI } = await import('@google/genai'));
  } catch (error) {
    console.error('Gemini SDK failed to load:', error);
    const wrapped = new Error('Gemini service dependency is unavailable.');
    wrapped.statusCode = 502;
    throw wrapped;
  }
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Create a practical ${days}-day travel itinerary for ${city} within a hard total budget of ₹${budget}. Preferences: ${preferences || 'balanced sightseeing, food, culture, and local experiences'}. Use realistic India-friendly INR estimates. Return exactly ${days} itinerary items. The sum of every dailyCost must be <= ₹${budget}, and every dailyCost must be at least ₹${MIN_DAILY_BUDGET}. Do not invent unavailable hotels; recommend plausible real hotel categories or known properties only when appropriate.`;

  let result;
  try {
    result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.45,
        responseMimeType: 'application/json',
        responseSchema: itinerarySchema
      }
    });
  } catch (error) {
    console.error('Gemini generation failed:', error);
    const wrapped = new Error('Gemini could not generate an itinerary right now. Please try again later.');
    wrapped.statusCode = 502;
    throw wrapped;
  }

  try {
    return normalizePlan(JSON.parse(result.text || '{}'), days, budget);
  } catch (error) {
    console.error('Invalid Gemini JSON:', error);
    const wrapped = new Error('Gemini returned an invalid itinerary. Please try a different destination or budget.');
    wrapped.statusCode = 502;
    throw wrapped;
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed.' });

  const payload = parseBody(event.body);
  const validationError = validateRequest(payload);
  if (validationError) return response(400, { error: validationError });

  const city = String(payload.city).trim();
  const budget = toPositiveInteger(payload.budget);
  const days = toPositiveInteger(payload.days);
  const preferences = String(payload.preferences || '').trim().slice(0, 300);

  try {
    const [plan, geocode] = await Promise.all([
      createItinerary({ city, budget, days, preferences }),
      geocodeCity(city)
    ]);
    return response(200, { ...plan, city, budget, days, cityCoordinates: geocode.coordinates, mapboxWarning: geocode.warning });
  } catch (error) {
    return response(error.statusCode || 500, { error: error.message || 'Unable to generate itinerary.' });
  }
};
