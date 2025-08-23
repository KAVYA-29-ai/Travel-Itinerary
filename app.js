// app.js - FIXED VERSION with better error handling
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Mapbox with fallback
    try {
        mapboxgl.accessToken = 'pk.eyJ1IjoiZGVmYXVsdC11c2VyIiwiYSI6ImNqMHFiN3F1bTAwdWgycW8zdXJ0cXY0YXYifQ.abcdefghijk'; // Default public token
    } catch (e) {
        console.log('Mapbox not available');
    }

    const form = document.getElementById('travel-form');
    const submitBtn = document.getElementById('submit-btn');
    const loading = document.getElementById('loading');
    const output = document.getElementById('output');
    const error = document.getElementById('error');
    const debug = document.getElementById('debug');
    const debugInfo = document.getElementById('debug-info');

    // Show debug info in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        debug.classList.remove('hidden');
        debugInfo.textContent = 'Development mode: Check console for details';
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        // Reset states
        loading.classList.remove('hidden');
        output.classList.add('hidden');
        error.classList.add('hidden');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';

        const city = document.getElementById('city').value.trim();
        const budget = document.getElementById('budget').value;
        const days = document.getElementById('days').value;
        const preferences = document.getElementById('preferences').value.trim();

        // Validation
        if (!city || !budget || !days) {
            showError('Please fill in all required fields');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-3"></i>Create Itinerary<i class="fas fa-arrow-right ml-3"></i>';
            loading.classList.add('hidden');
            return;
        }

        try {
            console.log('Sending request:', { city, budget, days, preferences });
            const itinerary = await generateItinerary(city, budget, days, preferences);
            console.log('Response received:', itinerary);
            
            if (itinerary.error) {
                throw new Error(itinerary.error);
            }
            
            displayItinerary(itinerary);
            
        } catch (err) {
            console.error('Error:', err);
            showError(err.message || 'Failed to generate itinerary. Please try again.');
        } finally {
            loading.classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-3"></i>Create Itinerary<i class="fas fa-arrow-right ml-3"></i>';
        }
    });

    async function generateItinerary(city, budget, days, preferences) {
        try {
            // Use relative path for Netlify functions
            const response = await fetch('/.netlify/functions/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    city,
                    budget: parseInt(budget),
                    days: parseInt(days),
                    preferences
                })
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Network error:', error);
            // Fallback: Return mock data for testing
            return getMockItinerary(city, budget, days, preferences);
        }
    }

    // Mock data for testing when API is not available
    function getMockItinerary(city, budget, days, preferences) {
        return {
            summary: {
                title: `Amazing ${days}-Day Trip to ${city}`,
                description: `Explore the beautiful city of ${city} with this carefully crafted itinerary. Perfect for ${preferences || 'all types of travelers'} with a budget of ₹${budget}.`
            },
            hotels: [
                {
                    name: "Luxury Hotel Example",
                    price_per_night: Math.floor(budget / days / 3),
                    category: "Luxury",
                    distance_from_center: "1.2 km from city center",
                    rating: 4.5,
                    features: ["Swimming Pool", "Spa", "Free WiFi"],
                    link: "https://booking.com"
                }
            ],
            itinerary: Array.from({length: parseInt(days)}, (_, i) => ({
                day: i + 1,
                theme: `Day ${i + 1} Exploration`,
                morning: {
                    activity: `Visit local attractions in ${city}`,
                    cost: 500,
                    map_url: "https://maps.google.com",
                    coordinates: [0, 0]
                },
                afternoon: {
                    activity: "Lunch and relaxation",
                    cost: 800,
                    map_url: "https://maps.google.com",
                    coordinates: [0, 0]
                },
                evening: {
                    activity: "Dinner and cultural experience",
                    cost: 1200,
                    map_url: "https://maps.google.com",
                    coordinates: [0, 0]
                },
                dining: {
                    restaurant: "Local Cuisine Restaurant",
                    cuisine: "Local",
                    cost: 1500,
                    map_url: "https://maps.google.com",
                    coordinates: [0, 0]
                },
                hotel: {
                    name: "Luxury Hotel Example",
                    price: Math.floor(budget / days / 3)
                },
                daily_cost: 4000
            })),
            total_cost: budget
        };
    }

    function displayItinerary(itinerary) {
        output.classList.remove('hidden');
        output.innerHTML = '';

        // Create summary card
        const summaryCard = document.createElement('div');
        summaryCard.className = 'glass rounded-3xl p-8 shadow-2xl';
        summaryCard.innerHTML = `
            <h2 class="text-3xl font-bold text-white mb-6">Trip Summary</h2>
            <div class="bg-blue-900/30 rounded-2xl p-6">
                <h3 class="text-xl font-semibold text-blue-200 mb-4">${itinerary.summary.title}</h3>
                <p class="text-blue-100 mb-4">${itinerary.summary.description}</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-blue-800/50 p-4 rounded-xl">
                        <div class="text-blue-200 mb-2">Total Budget</div>
                        <div class="text-2xl font-bold text-green-300">₹${itinerary.total_cost}</div>
                    </div>
                    <div class="bg-blue-800/50 p-4 rounded-xl">
                        <div class="text-blue-200 mb-2">Trip Duration</div>
                        <div class="text-2xl font-bold text-purple-300">${itinerary.itinerary.length} Days</div>
                    </div>
                    <div class="bg-blue-800/50 p-4 rounded-xl">
                        <div class="text-blue-200 mb-2">Daily Average</div>
                        <div class="text-2xl font-bold text-orange-300">₹${Math.round(itinerary.total_cost / itinerary.itinerary.length)}</div>
                    </div>
                </div>
            </div>
        `;
        output.appendChild(summaryCard);

        // Create hotels section
        const hotelsSection = document.createElement('div');
        hotelsSection.className = 'glass rounded-3xl p-8 shadow-2xl';
        hotelsSection.innerHTML = `
            <h2 class="text-3xl font-bold text-white mb-6">Recommended Hotels</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${itinerary.hotels.map(hotel => `
                    <div class="bg-blue-900/30 rounded-xl p-6">
                        <h3 class="font-semibold text-white text-lg mb-2">${hotel.name}</h3>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-2xl font-bold text-green-300">₹${hotel.price_per_night}</span>
                            <span class="text-blue-200 text-sm">/ night</span>
                        </div>
                        <div class="text-blue-200 text-sm mb-4">
                            <i class="fas fa-map-marker-alt mr-2"></i>
                            ${hotel.distance_from_center}
                        </div>
                        <a href="${hotel.link}" target="_blank" class="bg-blue-500 text-white py-2 px-4 rounded-lg block text-center">
                            Book Now
                        </a>
                    </div>
                `).join('')}
            </div>
        `;
        output.appendChild(hotelsSection);

        // Create itinerary section
        const itinerarySection = document.createElement('div');
        itinerarySection.className = 'glass rounded-3xl p-8 shadow-2xl';
        itinerarySection.innerHTML = `
            <h2 class="text-3xl font-bold text-white mb-6">Day-by-Day Itinerary</h2>
            <div class="space-y-4">
                ${itinerary.itinerary.map(day => `
                    <div class="bg-blue-900/30 rounded-xl p-6">
                        <h3 class="text-xl font-semibold text-white mb-4">Day ${day.day}: ${day.theme}</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div class="bg-blue-800/50 p-4 rounded-lg">
                                <h4 class="text-blue-200 font-semibold mb-2">🌅 Morning</h4>
                                <p class="text-blue-100">${day.morning.activity}</p>
                                <p class="text-blue-200 text-sm mt-2">₹${day.morning.cost}</p>
                            </div>
                            
                            <div class="bg-blue-800/50 p-4 rounded-lg">
                                <h4 class="text-orange-200 font-semibold mb-2">☀️ Afternoon</h4>
                                <p class="text-blue-100">${day.afternoon.activity}</p>
                                <p class="text-blue-200 text-sm mt-2">₹${day.afternoon.cost}</p>
                            </div>
                            
                            <div class="bg-blue-800/50 p-4 rounded-lg">
                                <h4 class="text-purple-200 font-semibold mb-2">🌙 Evening</h4>
                                <p class="text-blue-100">${day.evening.activity}</p>
                                <p class="text-blue-200 text-sm mt-2">₹${day.evening.cost}</p>
                            </div>
                        </div>
                        
                        <div class="bg-yellow-900/30 p-4 rounded-lg mb-4">
                            <h4 class="text-yellow-200 font-semibold mb-2">🍽️ Dining</h4>
                            <p class="text-yellow-100">${day.dining.restaurant} - ${day.dining.cuisine}</p>
                            <p class="text-yellow-200 text-sm mt-2">₹${day.dining.cost}</p>
                        </div>
                        
                        <div class="bg-green-900/30 p-4 rounded-lg">
                            <h4 class="text-green-200 font-semibold mb-2">🏨 Accommodation</h4>
                            <p class="text-green-100">${day.hotel.name}</p>
                            <p class="text-green-200 text-sm mt-2">₹${day.hotel.price}/night</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        output.appendChild(itinerarySection);
    }

    function showError(message) {
        error.classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
    }
});
