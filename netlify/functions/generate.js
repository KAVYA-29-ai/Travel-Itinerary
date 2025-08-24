// netlify/functions/generate.js
const fetch = require("node-fetch");

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY; // Google Places API key
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;  // Mapbox token

// Helper: Fetch POIs from Google Places API
async function fetchPOIs(city, type = "tourist_attraction", maxResults = 5) {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(city + " " + type)}&key=${GOOGLE_API_KEY}&type=${type}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results) {
            return data.results.slice(0, maxResults).map(place => ({
                name: place.name,
                type: type,
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                cost: Math.floor(Math.random() * 2000) + 500 // Random cost 500-2500
            }));
        }
        return [];
    } catch (err) {
        console.error("POI fetch error:", err);
        return [];
    }
}

// Helper: Fetch hotels from Google Places API
async function fetchHotels(city, maxResults = 3) {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(city + " hotels")}&key=${GOOGLE_API_KEY}&type=lodging`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results) {
            return data.results.slice(0, maxResults).map(hotel => ({
                name: hotel.name,
                lat: hotel.geometry.location.lat,
                lng: hotel.geometry.location.lng,
                cost: Math.floor(Math.random() * 20000) + 10000, // Random hotel cost
                description: hotel.formatted_address || "Comfortable stay"
            }));
        }
        return [];
    } catch (err) {
        console.error("Hotel fetch error:", err);
        return [];
    }
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { city, budget, days, preferences } = JSON.parse(event.body);
        const dayCount = parseInt(days) || 1;
        const totalBudget = parseInt(budget) || 50000;

        // Fetch dynamic POIs & Restaurants
        let pois = await fetchPOIs(city, "tourist_attraction", 6);
        let restaurants = await fetchPOIs(city, "restaurant", 4);
        let hotels = await fetchHotels(city, 2);

        // Fallback mock if API fails
        if (!pois.length) pois = [{ name: `Explore ${city}`, type: "sightseeing", lat: 0, lng: 0, cost: 0 }];
        if (!restaurants.length) restaurants = [{ name: "Local Restaurant", type: "dining", lat: 0, lng: 0, cost: 500 }];
        if (!hotels.length) hotels = [{ name: `${city} Hotel`, lat: 0, lng: 0, cost: 15000, description: "Standard stay" }];

        // City center coordinates for Mapbox
        const cityCoordinates = pois.length ? [pois[0].lng, pois[0].lat] : [0,0];

        // Generate day-wise itinerary
        const itinerary = Array.from({ length: dayCount }, (_, i) => ({
            day: i + 1,
            activities: [
                ...(pois.slice(i*2, i*2 + 2) || pois),       // Morning/afternoon sightseeing
                ...(restaurants.slice(i, i+1) || restaurants) // Dining
            ]
        }));

        // Budget allocation
        const hotelCostPerDay = hotels[0].cost;
        const remainingBudgetPerDay = (totalBudget - (hotelCostPerDay * dayCount)) / dayCount;
        itinerary.forEach(day => {
            day.activities.forEach(act => {
                if(!act.cost) act.cost = Math.floor(Math.random() * remainingBudgetPerDay/2) + 500;
            });
        });

        const response = {
            summary: `Amazing ${dayCount}-Day ${city} Adventure. Budget: ₹${totalBudget}. ${preferences ? `Special focus: ${preferences}` : ''}`,
            totalCost: totalBudget,
            cityCoordinates: cityCoordinates,
            hotels: hotels,
            itinerary: itinerary
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error("Generate error:", error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ error: 'Failed to generate itinerary', details: error.message })
        };
    }
};
