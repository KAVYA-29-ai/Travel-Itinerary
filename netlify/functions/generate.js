// netlify/functions/generate.js - SIMPLIFIED VERSION
exports.handler = async function(event, context) {
    console.log('Function called with:', event.body);
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { city, budget, days, preferences } = JSON.parse(event.body);
        
        console.log('Generating itinerary for:', { city, budget, days, preferences });

        // Mock response for testing
        const mockResponse = {
            summary: {
                title: `Amazing ${days}-Day ${city} Adventure`,
                description: `Explore ${city} with this perfect ${days}-day itinerary designed for a budget of ₹${budget}. ${preferences ? `Special focus on: ${preferences}` : ''}`
            },
            hotels: [
                {
                    name: "Luxury Palace Hotel",
                    price_per_night: Math.floor(budget / days / 2),
                    category: "Luxury",
                    distance_from_center: "1.5 km from center",
                    rating: 4.7,
                    features: ["Pool", "Spa", "Free WiFi"],
                    link: "https://booking.com"
                },
                {
                    name: "Mid-range Comfort Inn",
                    price_per_night: Math.floor(budget / days / 3),
                    category: "Mid-range",
                    distance_from_center: "2.8 km from center",
                    rating: 4.2,
                    features: ["Breakfast", "Parking", "AC"],
                    link: "https://booking.com"
                }
            ],
            itinerary: Array.from({length: parseInt(days)}, (_, i) => ({
                day: i + 1,
                theme: `${city} Exploration Day ${i + 1}`,
                morning: {
                    activity: `Visit ${city}'s famous landmarks`,
                    cost: Math.floor(budget / days / 4),
                    map_url: "https://maps.google.com",
                    coordinates: [0, 0]
                },
                afternoon: {
                    activity: "Lunch and local experience",
                    cost: Math.floor(budget / days / 5),
                    map_url: "https://maps.google.com",
                    coordinates: [0, 0]
                },
                evening: {
                    activity: "Dinner and entertainment",
                    cost: Math.floor(budget / days / 4),
                    map_url: "https://maps.google.com",
                    coordinates: [0, 0]
                },
                dining: {
                    restaurant: "Authentic Local Restaurant",
                    cuisine: "Local Specialties",
                    cost: Math.floor(budget / days / 6),
                    map_url: "https://maps.google.com",
                    coordinates: [0, 0]
                },
                hotel: {
                    name: i % 2 === 0 ? "Luxury Palace Hotel" : "Mid-range Comfort Inn",
                    price: Math.floor(budget / days / (i % 2 === 0 ? 2 : 3))
                },
                daily_cost: Math.floor(budget / days)
            })),
            total_cost: parseInt(budget)
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
        console.error('Error:', error);
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
