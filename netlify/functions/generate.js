import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { city, budget, days, preferences } = JSON.parse(event.body);

    // Gemini API
    const prompt = `Generate a JSON itinerary for ${days} days in ${city}, budget ${budget} INR. 
    Preferences: ${preferences}. 
    Format: { "city": "...", "budget": "...", "days": ..., "preferences": "...", "itinerary": [ { "activities": [] } ], "locations": [ { "name": "", "type": "", "lat": 0, "lng": 0 } ] }`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const itinerary = JSON.parse(text);

    return {
      statusCode: 200,
      body: JSON.stringify(itinerary)
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate itinerary" }) };
  }
}
