import fetch from "node-fetch";

export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { city, budget, days, preferences } = JSON.parse(event.body);

    if (!budget || !days) {
      throw new Error("Missing budget or days");
    }

    // Gemini prompt
    const detailedPrompt = `
You are a travel planning expert.
Create a ${days}-day detailed itinerary for ${city || "a destination"}.
Total budget: ₹${budget}.
Travel preferences: ${preferences || "sightseeing, food, culture"}.

Output ONLY valid JSON with this structure:
{
  "summary": "Short exciting trip description",
  "totalCost": 0,
  "hotels": [
    {"name":"", "pricePerNight":0, "description":"", "rating":0, "distanceFromCenter":""}
  ],
  "itinerary": [
    {
      "day": 1,
      "dailyCost":0,
      "morning":{"activity":"", "cost":0},
      "afternoon":{"activity":"", "cost":0},
      "evening":{"activity":"", "cost":0},
      "dining":{"restaurant":"", "cuisine":"", "cost":0},
      "hotel":{"name":"", "price":0}
    }
  ]
}
Guidelines:
- Use real hotels, restaurants, attractions if possible
- Hotel prices per night should be realistic
- Activities and dining should be relevant to the city or destination
- Daily costs must sum within total budget
- Include 2-3 hotels with different price ranges
- Use ₹ for all costs
`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: detailedPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      throw new Error(`Gemini API failed: ${geminiResponse.status} ${errorData}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) throw new Error("No content from Gemini");

    const parsedItinerary = JSON.parse(generatedText);
    parsedItinerary.totalCost = parseInt(budget);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(parsedItinerary),
    };
  } catch (err) {
    console.error("Error:", err);
    // Minimal fallback structure
    const fallback = {
      summary: "Your travel plan will appear here.",
      totalCost: event.body ? JSON.parse(event.body).budget : 0,
      hotels: [],
      itinerary: [],
      _fallback: true,
      _error: err.message,
    };
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(fallback) };
  }
};
