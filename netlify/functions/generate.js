export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { city, budget, days, preferences } = JSON.parse(event.body);
    if (!city || !budget || !days) throw new Error("Missing required fields");

    // --- Get coordinates from Mapbox ---
    let coordinates = [77.2090, 28.6139]; // default Delhi
    try {
      const geoRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&limit=1`
      );
      const geoData = await geoRes.json();
      if (geoData?.features?.[0]?.center) {
        coordinates = geoData.features[0].center; // [lng, lat]
      }
    } catch (err) {
      console.error("Mapbox geocoding failed:", err.message);
    }

    // --- Call Google AI Studio ---
    let itineraryAI = [];
    try {
      const aiResponse = await fetch(
        "https://generativeai.googleapis.com/v1beta2/models/text-bison-001:generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GOOGLE_AI_API_KEY}`
          },
          body: JSON.stringify({
            prompt: `Create a detailed ${days}-day itinerary for ${city} with budget ₹${budget}. Include morning, afternoon, evening, dining, and hotel recommendations. Travel preferences: ${preferences || "general"}.`,
            temperature: 0.7,
            maxOutputTokens: 800
          })
        }
      );
      const aiData = await aiResponse.json();
      const text = aiData?.candidates?.[0]?.content || "";
      itineraryAI = text.split("\n").filter(l => l.trim() !== "");
    } catch (err) {
      console.error("Google AI failed, using fallback:", err.message);
    }

    // --- Fallback itinerary ---
    if (itineraryAI.length === 0) {
      const dailyBudget = Math.floor(budget / days);
      itineraryAI = Array.from({ length: days }, (_, i) => {
        return `Day ${i + 1} - ₹${dailyBudget}
🌞 Morning: Visit famous landmarks of ${city} - ₹${Math.floor(dailyBudget/4)}
🍴 Lunch/Afternoon: Enjoy local cuisine - ₹${Math.floor(dailyBudget/5)}
🌆 Evening: Entertainment - ₹${Math.floor(dailyBudget/4)}
🍽 Dining: Local Restaurant - ₹${Math.floor(dailyBudget/6)}
🏨 Stay: Local Stay - ₹${Math.floor(dailyBudget/2)}`;
      });
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        summary: `Amazing ${days}-Day ${city} Adventure. Budget: ₹${budget}. ${preferences ? `Focus: ${preferences}` : ""}`,
        totalCost: parseInt(budget),
        cityCoordinates: coordinates,
        itinerary: itineraryAI
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Failed to generate itinerary", details: err.message })
    };
  }
};
