// generate.js - Netlify Function
export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { city, budget, days, preferences } = JSON.parse(event.body);

    if (!budget || !days) throw new Error("Missing budget or days");

    const MIN_DAILY_COST = 500;
    const minBudget = days * MIN_DAILY_COST;
    if (budget < minBudget) throw new Error(`Budget too low! Minimum ₹${minBudget} needed for ${days} days`);

    // Default coordinates in case Mapbox fails
    let cityCoordinates = [77.209, 28.6139]; // Delhi

    // Mapbox geocoding
    if (city) {
      try {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&limit=1`
        );
        const geoData = await geoRes.json();
        if (geoData?.features?.[0]?.center) cityCoordinates = geoData.features[0].center;
      } catch (err) {
        console.error("Mapbox failed:", err.message);
      }
    }

    // Gemini prompt
    const detailedPrompt = `
You are a travel planning expert.
Create a ${days}-day itinerary for ${city || "a destination"} with a total budget of ₹${budget}.
Travel preferences: ${preferences || "sightseeing, food, culture"}.

Output ONLY valid JSON in this format:
{
  "summary": "",
  "totalCost": 0,
  "hotels": [
    {"name":"","pricePerNight":0,"description":"","rating":0,"distanceFromCenter":""}
  ],
  "itinerary": [
    {
      "day":1,
      "dailyCost":0,
      "morning":{"activity":"","cost":0},
      "afternoon":{"activity":"","cost":0},
      "evening":{"activity":"","cost":0},
      "dining":{"restaurant":"","cuisine":"","cost":0},
      "hotel":{"name":"","price":0}
    }
  ]
}

Guidelines:
- Allocate all costs within the total budget ₹${budget}.
- Daily activities, dining, hotels must fit realistic budget.
- Use budget-friendly options if budget is low.
- Minimum dailyCost per day: ₹${MIN_DAILY_COST}.
- Include 2-3 hotels with different price ranges.
- Use ₹ for all costs.
`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: detailedPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" }
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

    let parsedItinerary = JSON.parse(generatedText);

    // Dynamic dailyCost and budget enforcement
    parsedItinerary.itinerary = parsedItinerary.itinerary.map((day) => {
      const morningCost = day.morning?.cost || 0;
      const afternoonCost = day.afternoon?.cost || 0;
      const eveningCost = day.evening?.cost || 0;
      const diningCost = day.dining?.cost || 0;
      const hotelPrice = day.hotel?.price || 0;

      let dailyCost = morningCost + afternoonCost + eveningCost + diningCost + hotelPrice;

      // ensure minimum daily cost
      if (dailyCost < MIN_DAILY_COST) {
        const diff = MIN_DAILY_COST - dailyCost;
        if (day.dining) day.dining.cost += diff;
        else if (day.hotel) day.hotel.price += diff;
        dailyCost = MIN_DAILY_COST;
      }

      // enforce budget cap per day
      if (dailyCost > budget / parsedItinerary.itinerary.length) {
        const cap = Math.floor(budget / parsedItinerary.itinerary.length);
        const scale = cap / dailyCost;
        day.morning.cost = Math.floor(day.morning.cost * scale);
        day.afternoon.cost = Math.floor(day.afternoon.cost * scale);
        day.evening.cost = Math.floor(day.evening.cost * scale);
        day.dining.cost = Math.floor(day.dining.cost * scale);
        day.hotel.price = Math.floor(day.hotel.price * scale);
        dailyCost = cap;
      }

      return {
        ...day,
        dailyCost,
        morning: day.morning || { activity: "Explore local area", cost: 0 },
        afternoon: day.afternoon || { activity: "Sightseeing", cost: 0 },
        evening: day.evening || { activity: "Evening activity", cost: 0 },
        dining: day.dining || { restaurant: "Local eatery", cuisine: "Local cuisine", cost: 0 },
        hotel: day.hotel || { name: "Budget hotel", price: 0 },
      };
    });

    // Total cost
    parsedItinerary.totalCost = parsedItinerary.itinerary.reduce((sum, d) => sum + d.dailyCost, 0);
    parsedItinerary.cityCoordinates = cityCoordinates;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(parsedItinerary),
    };
  } catch (err) {
    console.error("Error:", err);

    // fallback
    const fallback = {
      summary: "Your budget-friendly travel plan will appear here.",
      totalCost: event.body ? JSON.parse(event.body).budget : 0,
      hotels: [],
      itinerary: [],
      cityCoordinates: [77.209, 28.6139],
      _fallback: true,
      _error: err.message,
    };
    return { statusCode: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(fallback) };
  }
};
