// netlify/functions/generate.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { city, budget, days, preferences } = JSON.parse(event.body);
        
        if (!city || !budget || !days) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: city, budget, days' })
            };
        }

        // Initialize Google AI
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
        Generate a detailed travel itinerary for ${city} with a total budget of ₹${budget} for ${days} days.
        Preferences: ${preferences || 'None specified'}.
        
        Return ONLY valid JSON in this exact structure:
        {
          "summary": {
            "title": "Brief trip title",
            "description": "Detailed description of the trip including highlights, best time to visit, travel tips, and overall experience."
          },
          "hotels": [
            {
              "name": "Hotel Name",
              "price_per_night": 2500,
              "category": "Budget/Mid-range/Luxury",
              "distance_from_center": "2.5 km from city center",
              "rating": 4.2,
              "features": ["Free WiFi", "Breakfast", "Swimming Pool"],
              "link": "https://booking.com/hotel-example"
            }
          ],
          "itinerary": [
            {
              "day": 1,
              "theme": "City Exploration",
              "morning": {
                "activity": "Visit local landmarks and museums",
                "cost": 500,
                "map_url": "https://goo.gl/maps/example",
                "coordinates": [longitude, latitude]
              },
              "afternoon": {
                "activity": "Lunch and shopping",
                "cost": 800,
                "map_url": "https://goo.gl/maps/example",
                "coordinates": [longitude, latitude]
              },
              "evening": {
                "activity": "Dinner and local entertainment",
                "cost": 1200,
                "map_url": "https://goo.gl/maps/example",
                "coordinates": [longitude, latitude]
              },
              "dining": {
                "restaurant": "Local Restaurant Name",
                "cuisine": "Local/International",
                "cost": 1500,
                "map_url": "https://goo.gl/maps/example",
                "coordinates": [longitude, latitude]
              },
              "hotel": {
                "name": "Hotel Name",
                "price": 2500
              },
              "daily_cost": 6500
            }
          ],
          "total_cost": ${budget}
        }

        Important:
        - Ensure total_cost does NOT exceed ₹${budget}
        - Include realistic prices for Indian travelers
        - Add map URLs (Google Maps) and approximate coordinates
        - Make hotels and activities fit the budget category
        - Include diverse activities based on preferences
        - Return ONLY the JSON, no additional text
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI');
        }

        const itinerary = JSON.parse(jsonMatch[0]);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify(itinerary)
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ 
                error: 'Failed to generate itinerary', 
                details: error.message 
            })
        };
    }
};
