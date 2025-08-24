import fetch from "node-fetch";

export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { city, budget, days, preferences } = JSON.parse(event.body);
    if (!city || !budget || !days) throw new Error("Missing required fields");

    let coordinates = [0, 0];

    // 1️⃣ Ask Google AI Studio / Gemini for coordinates
    try {
      const aiResponse = await fetch(
        "https://generativeai.googleapis.com/v1beta2/models/text-bison-001:generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GOOGLE_AI_API_KEY}`,
          },
          body: JSON.stringify({
            prompt: `Provide the exact latitude and longitude of "${city}" in JSON format as {"lat": ..., "lng": ...}.`,
            temperature: 0,
            maxOutputTokens: 50,
          }),
        }
      );

      const aiData = await aiResponse.json();
      const text = aiData?.candidates?.[0]?.content || "";
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        coordinates = [parsed.lng, parsed.lat];
      }
    } catch (err) {
      console.error("AI coordinate fetch failed:", err.message);
    }

    // 2️⃣ Ask AI for itinerary
    let itineraryAI = [];
    try {
      const aiItinerary = await fetch(
        "https://generativeai.googleapis.com/v1beta2/models/text-bison-001:generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GOOGLE_AI_API_KEY}`,
          },
          body: JSON.stringify({
            prompt: `Create a detailed ${days}-day itinerary for ${city} with budget ₹${budget}. Include morning, afternoon, evening, dining, and hotel. Travel preferences: ${preferences || "general"}.`,
            temperature: 0.7,
            maxOutputTokens: 800,
          }),
        }
      );
      const itineraryData = await aiItinerary.json();
      const text = itineraryData?.candidates?.[0]?.content || "";
      itineraryAI = text.split("\n").filter(l => l.trim() !== "");
    } catch (err) {
      console.error("AI itinerary fetch failed:", err.message);
    }

    // 3️⃣ Fallback
    if (itineraryAI.length === 0) {
      const dailyBudget = Math.floor(budget / days);
      itineraryAI = Array.from({ length: days }, (_, i) => {
        return `Day ${i + 1} - ₹${dailyBudget}
🌞 Morning: Visit landmarks of ${city} - ₹${Math.floor(dailyBudget/4)}
🍴 Lunch/Afternoon: Enjoy local cuisine - ₹${Math.floor(dailyBudget/5)}
🌆 Evening: Entertainment - ₹${Math.floor(dailyBudget/4)}
🍽 Dining: Local Restaurant - ₹${Math.floor(dailyBudget/6)}
🏨 Stay: Hotel - ₹${Math.floor(dailyBudget/2)}`;
      });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        summary: `Amazing ${days}-Day ${city} Adventure. Budget: ₹${budget}. ${preferences ? `Focus: ${preferences}` : ""}`,
        totalCost: parseInt(budget),
        cityCoordinates: coordinates,
        itinerary: itineraryAI
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to generate itinerary", details: err.message }),
    };
  }
};
