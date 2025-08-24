// netlify/functions/generate.js
const citiesData = {
  paris: {
    coordinates: [2.3522, 48.8566],
    landmarks: [
      { name: "Eiffel Tower", type: "Landmark", lng: 2.2945, lat: 48.8584 },
      { name: "Louvre Museum", type: "Landmark", lng: 2.3364, lat: 48.8606 },
      { name: "Notre Dame Cathedral", type: "Landmark", lng: 2.3499, lat: 48.8527 }
    ],
    restaurants: [
      { name: "Le Meurice", cuisine: "French", lng: 2.3286, lat: 48.8655 },
      { name: "L'Ambroisie", cuisine: "French", lng: 2.3605, lat: 48.8556 }
    ],
    hotels: [
      { name: "Luxury Palace Hotel", pricePerNight: 25000, rating: 4.7, distanceFromCenter: "1.5 km", lng: 2.3372, lat: 48.8600 },
      { name: "Mid-range Comfort Inn", pricePerNight: 16666, rating: 4.2, distanceFromCenter: "2.8 km", lng: 2.3450, lat: 48.8580 }
    ]
  },
  delhi: {
    coordinates: [77.2090, 28.6139],
    landmarks: [
      { name: "India Gate", type: "Landmark", lng: 77.2295, lat: 28.6129 },
      { name: "Red Fort", type: "Landmark", lng: 77.2410, lat: 28.6562 },
      { name: "Qutub Minar", type: "Landmark", lng: 77.1855, lat: 28.5245 }
    ],
    restaurants: [
      { name: "Indian Accent", cuisine: "Indian", lng: 77.2167, lat: 28.6158 },
      { name: "Bukhara", cuisine: "Indian", lng: 77.2100, lat: 28.5985 }
    ],
    hotels: [
      { name: "Taj Palace Hotel", pricePerNight: 20000, rating: 4.8, distanceFromCenter: "1.2 km", lng: 77.2190, lat: 28.6130 },
      { name: "Midtown Comfort Inn", pricePerNight: 12000, rating: 4.3, distanceFromCenter: "3 km", lng: 77.2050, lat: 28.6170 }
    ]
  },
  london: {
    coordinates: [-0.1276, 51.5074],
    landmarks: [
      { name: "Big Ben", type: "Landmark", lng: -0.1246, lat: 51.5007 },
      { name: "London Eye", type: "Landmark", lng: -0.1196, lat: 51.5033 },
      { name: "Tower of London", type: "Landmark", lng: -0.0761, lat: 51.5081 }
    ],
    restaurants: [
      { name: "The Ivy", cuisine: "British", lng: -0.1312, lat: 51.5138 },
      { name: "Dishoom", cuisine: "Indian", lng: -0.0971, lat: 51.5131 }
    ],
    hotels: [
      { name: "Luxury London Hotel", pricePerNight: 30000, rating: 4.9, distanceFromCenter: "1 km", lng: -0.1240, lat: 51.5070 },
      { name: "Comfort Inn London", pricePerNight: 18000, rating: 4.2, distanceFromCenter: "2 km", lng: -0.1300, lat: 51.5090 }
    ]
  },
  tokyo: {
    coordinates: [139.6917, 35.6895],
    landmarks: [
      { name: "Tokyo Tower", type: "Landmark", lng: 139.7447, lat: 35.6586 },
      { name: "Senso-ji Temple", type: "Landmark", lng: 139.7966, lat: 35.7148 },
      { name: "Shibuya Crossing", type: "Landmark", lng: 139.7005, lat: 35.6595 }
    ],
    restaurants: [
      { name: "Sukiyabashi Jiro", cuisine: "Japanese", lng: 139.7628, lat: 35.6733 },
      { name: "Ichiran Ramen", cuisine: "Japanese", lng: 139.7036, lat: 35.6614 }
    ],
    hotels: [
      { name: "Tokyo Luxury Hotel", pricePerNight: 28000, rating: 4.8, distanceFromCenter: "1 km", lng: 139.6920, lat: 35.6890 },
      { name: "Midtown Comfort Inn", pricePerNight: 15000, rating: 4.3, distanceFromCenter: "2.5 km", lng: 139.6950, lat: 35.6900 }
    ]
  }
};

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { city, budget, days, preferences } = JSON.parse(event.body);
    const cityKey = city.toLowerCase();

    const cityData = citiesData[cityKey] || {
      coordinates: [0,0],
      landmarks: [],
      restaurants: [],
      hotels: []
    };

    const totalCost = parseInt(budget);

    const mockItinerary = Array.from({ length: parseInt(days) }, (_, i) => ({
      day: i + 1,
      dailyCost: Math.floor(totalCost / days),
      morning: { activity: `Visit famous landmarks of ${city}`, cost: Math.floor(totalCost / days / 4) },
      afternoon: { activity: "Enjoy local cuisine", cost: Math.floor(totalCost / days / 5) },
      evening: { activity: "Evening entertainment", cost: Math.floor(totalCost / days / 4) },
      dining: { restaurant: "Authentic Local Restaurant", cuisine: "Local Specialties", cost: Math.floor(totalCost / days / 6) },
      hotel: cityData.hotels[i % cityData.hotels.length] || { name: "Local Stay", price: Math.floor(totalCost / days / 2) }
    }));

    const response = {
      summary: `Amazing ${days}-Day ${city} Adventure. Budget: ₹${budget}. ${preferences ? `Focus: ${preferences}` : ''}`,
      totalCost,
      cityCoordinates: cityData.coordinates,
      landmarks: cityData.landmarks,
      restaurants: cityData.restaurants,
      hotels: cityData.hotels,
      itinerary: mockItinerary
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to generate itinerary', details: error.message })
    };
  }
};
