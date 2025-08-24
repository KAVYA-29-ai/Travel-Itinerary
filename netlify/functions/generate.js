// netlify/functions/generate.js
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { city, budget, days, preferences } = JSON.parse(event.body);

        // Map coordinates fallback
        let cityCoordinates;
        switch(city.toLowerCase()) {
            case "paris": cityCoordinates = [2.3522, 48.8566]; break;
            case "delhi": cityCoordinates = [77.2090, 28.6139]; break;
            default: cityCoordinates = [0,0];
        }

        const mockResponse = {
            summary: `Amazing ${days}-Day ${city} Adventure. Explore ${city} with this perfect itinerary designed for a budget of ₹${budget}. ${preferences ? `Special focus on: ${preferences}` : ''}`,
            totalCost: parseInt(budget),
            cityCoordinates: cityCoordinates,
            hotels: [
                { name: "Luxury Palace Hotel", description: "5-star hotel with pool" },
                { name: "Mid-range Comfort Inn", description: "Comfortable & cozy" }
            ],
            itinerary: Array.from({ length: parseInt(days) }, (_, i) => ({
                day: i + 1,
                activities: [
                    `Visit famous landmarks of ${city}`,
                    `Enjoy local cuisine`,
                    `Evening entertainment`
                ]
            }))
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify(mockResponse)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ 
                error: 'Test mode: Using mock data',
                details: error.message 
            })
        };
    }
};
