export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { city, budget, days, preferences } = JSON.parse(event.body);
    
    if (!city || !budget || !days) {
      throw new Error("Missing required fields");
    }

    // Budget validation - minimum realistic budget
    const minBudget = days * 5000; // ₹5000 per day minimum
    if (budget < minBudget) {
      throw new Error(`Budget too low! Minimum ₹${minBudget} needed for ${days} days in ${city}`);
    }

    // Get coordinates from Mapbox
    let coordinates = [77.2090, 28.6139]; // default Delhi
    try {
      const geoRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&limit=1`
      );
      const geoData = await geoRes.json();
      if (geoData?.features?.[0]?.center) {
        coordinates = geoData.features[0].center;
      }
    } catch (err) {
      console.error("Mapbox geocoding failed:", err.message);
    }

    // Generate realistic pricing based on city
    const cityMultiplier = getCityMultiplier(city.toLowerCase());
    const dailyBudget = Math.floor(budget / days);
    
    // Create structured hotels data
    const hotels = generateHotels(city, dailyBudget, cityMultiplier);
    
    // Create structured itinerary data
    const itinerary = generateItinerary(city, days, dailyBudget, cityMultiplier, preferences);

    // Try Google AI for enhanced descriptions (optional)
    let aiEnhancedSummary = `Amazing ${days}-Day ${city} Adventure. Budget: ₹${budget.toLocaleString('en-IN')}. ${preferences ? `Focus: ${preferences}` : ""}`;
    
    try {
      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Create a brief exciting summary for a ${days}-day trip to ${city} with budget ₹${budget}. Preferences: ${preferences || "general travel"}. Keep it under 100 words.`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200
            }
          })
        }
      );
      
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText && aiText.trim()) {
          aiEnhancedSummary = aiText.trim();
        }
      }
    } catch (err) {
      console.log("AI enhancement failed, using fallback:", err.message);
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({
        summary: aiEnhancedSummary,
        totalCost: parseInt(budget),
        cityCoordinates: coordinates,
        hotels: hotels,
        itinerary: itinerary
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        error: "Failed to generate itinerary", 
        details: err.message 
      })
    };
  }
};

// Helper function to get city price multiplier
function getCityMultiplier(city) {
  const cityMultipliers = {
    'paris': 2.5,
    'london': 2.3,
    'tokyo': 2.0,
    'new york': 2.2,
    'dubai': 1.8,
    'singapore': 1.7,
    'mumbai': 1.2,
    'delhi': 1.0,
    'goa': 1.3,
    'bangalore': 1.1,
    'thailand': 0.8,
    'bali': 0.9,
    'vietnam': 0.7
  };
  
  return cityMultipliers[city] || 1.0;
}

// Generate realistic hotels with proper structure
function generateHotels(city, dailyBudget, multiplier) {
  const baseHotelPrice = Math.floor(dailyBudget * 0.4 * multiplier);
  
  return [
    {
      name: `${city} Grand Palace Hotel`,
      pricePerNight: Math.floor(baseHotelPrice * 1.5),
      description: "Luxury 5-star hotel with spa, pool, and premium amenities",
      rating: 4.7,
      distanceFromCenter: "0.8 km from city center"
    },
    {
      name: `${city} Business Inn`,
      pricePerNight: baseHotelPrice,
      description: "Modern 4-star hotel with business facilities and comfort",
      rating: 4.3,
      distanceFromCenter: "1.5 km from city center"
    },
    {
      name: `${city} Budget Stay`,
      pricePerNight: Math.floor(baseHotelPrice * 0.6),
      description: "Clean and comfortable 3-star accommodation",
      rating: 4.0,
      distanceFromCenter: "2.5 km from city center"
    }
  ];
}

// Generate structured itinerary
function generateItinerary(city, days, dailyBudget, multiplier, preferences) {
  const activities = getActivitiesByCity(city, preferences);
  
  return Array.from({ length: days }, (_, i) => {
    const dayNumber = i + 1;
    const adjustedBudget = Math.floor(dailyBudget * multiplier);
    
    return {
      day: dayNumber,
      dailyCost: adjustedBudget,
      morning: {
        activity: activities.morning[i % activities.morning.length],
        cost: Math.floor(adjustedBudget * 0.25)
      },
      afternoon: {
        activity: activities.afternoon[i % activities.afternoon.length],
        cost: Math.floor(adjustedBudget * 0.2)
      },
      evening: {
        activity: activities.evening[i % activities.evening.length],
        cost: Math.floor(adjustedBudget * 0.25)
      },
      dining: {
        restaurant: activities.dining[i % activities.dining.length].name,
        cuisine: activities.dining[i % activities.dining.length].cuisine,
        cost: Math.floor(adjustedBudget * 0.15)
      },
      hotel: {
        name: i % 3 === 0 ? `${city} Grand Palace Hotel` : 
              i % 3 === 1 ? `${city} Business Inn` : `${city} Budget Stay`,
        price: Math.floor(adjustedBudget * 0.15)
      }
    };
  });
}

// Get activities based on city and preferences
function getActivitiesByCity(city, preferences = "") {
  const cityLower = city.toLowerCase();
  const pref = preferences.toLowerCase();
  
  // Base activities
  let activities = {
    morning: [
      `Explore ${city}'s historic landmarks and monuments`,
      `Visit ${city}'s famous museums and cultural sites`,
      `Walking tour of ${city}'s old town district`,
      `Photography tour of ${city}'s iconic locations`
    ],
    afternoon: [
      `Local food tour and market exploration in ${city}`,
      `Shopping at ${city}'s popular markets and malls`,
      `Visit ${city}'s parks and recreational areas`,
      `Cultural workshop or local craft experience`
    ],
    evening: [
      `Sunset viewpoint and evening photography`,
      `Traditional music and dance performance`,
      `Night market exploration and street food`,
      `Rooftop dining with city views`
    ],
    dining: [
      { name: `${city} Heritage Restaurant`, cuisine: "Traditional Local" },
      { name: `Modern Fusion Bistro`, cuisine: "International Fusion" },
      { name: `Street Food Paradise`, cuisine: "Local Street Food" },
      { name: `Fine Dining Experience`, cuisine: "Gourmet" }
    ]
  };

  // Customize based on preferences
  if (pref.includes('adventure')) {
    activities.morning.push(`Adventure sports and outdoor activities near ${city}`);
    activities.afternoon.push(`Hiking or trekking excursion`);
    activities.evening.push(`Adventure nightlife and activities`);
  }
  
  if (pref.includes('culture')) {
    activities.morning.push(`Deep dive into ${city}'s cultural heritage`);
    activities.afternoon.push(`Traditional arts and crafts workshops`);
    activities.evening.push(`Classical performances and cultural shows`);
  }
  
  if (pref.includes('food')) {
    activities.dining.push(
      { name: `${city} Culinary Master Class`, cuisine: "Cooking Experience" },
      { name: `Food Festival Venue`, cuisine: "Multi-cuisine Festival" }
    );
  }

  return activities;
}
