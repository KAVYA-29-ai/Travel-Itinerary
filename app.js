// app.js - CLIENT SIDE
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Mapbox
    mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN || 'pk.your_mapbox_token_here';
    
    let map = new mapboxgl.Map({
        container: 'preview-map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [0, 20],
        zoom: 1,
        interactive: false
    });

    const form = document.getElementById('travel-form');
    const submitBtn = document.getElementById('submit-btn');
    const loading = document.getElementById('loading');
    const output = document.getElementById('output');
    const error = document.getElementById('error');
    const cityInput = document.getElementById('city');

    // City input geocoding
    cityInput.addEventListener('blur', async function() {
        const city = cityInput.value.trim();
        if (city) {
            try {
                const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${mapboxgl.accessToken}&limit=1`);
                const data = await response.json();
                
                if (data.features.length > 0) {
                    const [lng, lat] = data.features[0].center;
                    map.flyTo({
                        center: [lng, lat],
                        zoom: 10,
                        duration: 2000
                    });
                    
                    new mapboxgl.Marker({ color: '#3b82f6' })
                        .setLngLat([lng, lat])
                        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${city}</h3><p>Your destination</p>`))
                        .addTo(map);
                }
            } catch (err) {
                console.log('Geocoding error:', err);
            }
        }
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        // Show loading animation
        loading.classList.remove('hidden');
        output.classList.add('hidden');
        error.classList.add('hidden');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Magic...';

        const city = document.getElementById('city').value;
        const budget = document.getElementById('budget').value;
        const days = document.getElementById('days').value;
        const preferences = document.getElementById('preferences').value;

        try {
            const itinerary = await generateItinerary(city, budget, days, preferences);
            displayItinerary(itinerary);
            
            // Add entrance animations
            setTimeout(() => {
                document.querySelectorAll('#output > *').forEach((element, index) => {
                    element.style.animationDelay = `${index * 0.2}s`;
                    element.classList.add('slide-in');
                });
            }, 100);
            
        } catch (err) {
            showError(err.message);
        } finally {
            loading.classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles group-hover:rotate-180 transition-transform duration-700 mr-3"></i>Create Magic Itinerary<i class="fas fa-arrow-right group-hover:translate-x-2 transition-transform duration-300 ml-3"></i>';
        }
    });

    async function generateItinerary(city, budget, days, preferences) {
        try {
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate itinerary');
            }

            return await response.json();
        } catch (error) {
            throw new Error('Network error. Please check your connection and try again.');
        }
    }

    function displayItinerary(itinerary) {
        output.classList.remove('hidden');
        output.innerHTML = '';

        // Display summary
        const summaryCard = createSummaryCard(itinerary);
        output.appendChild(summaryCard);

        // Display hotels
        const hotelsSection = createHotelsSection(itinerary.hotels);
        output.appendChild(hotelsSection);

        // Display itinerary
        const itinerarySection = createItinerarySection(itinerary.itinerary);
        output.appendChild(itinerarySection);

        // Display map with all locations
        const mapSection = createMapSection(itinerary);
        output.appendChild(mapSection);
    }

    function createSummaryCard(itinerary) {
        const div = document.createElement('div');
        div.className = 'glass rounded-3xl p-8 shadow-2xl card-hover';
        div.innerHTML = `
            <h2 class="text-3xl font-bold text-white mb-6 flex items-center">
                <i class="fas fa-map-marked-alt text-blue-300 mr-3"></i>
                Trip Summary
            </h2>
            <div class="bg-blue-900/30 rounded-2xl p-6 mb-6">
                <h3 class="text-xl font-semibold text-blue-200 mb-4">✨ ${itinerary.summary.title}</h3>
                <p class="text-blue-100 leading-relaxed mb-4">${itinerary.summary.description}</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-blue-800/50 p-4 rounded-xl border border-blue-600/30">
                        <div class="text-blue-300 font-semibold mb-2">Total Budget</div>
                        <div class="text-2xl font-bold text-green-300">₹${itinerary.total_cost.toLocaleString()}</div>
                    </div>
                    <div class="bg-blue-800/50 p-4 rounded-xl border border-blue-600/30">
                        <div class="text-blue-300 font-semibold mb-2">Trip Duration</div>
                        <div class="text-2xl font-bold text-purple-300">${itinerary.itinerary.length} Days</div>
                    </div>
                    <div class="bg-blue-800/50 p-4 rounded-xl border border-blue-600/30">
                        <div class="text-blue-300 font-semibold mb-2">Daily Average</div>
                        <div class="text-2xl font-bold text-orange-300">₹${Math.round(itinerary.total_cost / itinerary.itinerary.length).toLocaleString()}</div>
                    </div>
                </div>
            </div>
        `;
        return div;
    }

    function createHotelsSection(hotels) {
        const div = document.createElement('div');
        div.className = 'glass rounded-3xl p-8 shadow-2xl card-hover';
        div.innerHTML = `
            <h2 class="text-3xl font-bold text-white mb-6 flex items-center">
                <i class="fas fa-hotel text-green-300 mr-3"></i>
                Recommended Hotels
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${hotels.map(hotel => `
                    <div class="bg-blue-900/30 rounded-xl p-6 border border-blue-600/30 hover:border-blue-400 transition-all duration-300">
                        <div class="h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mb-4 relative overflow-hidden">
                            <div class="absolute inset-0 bg-black/20"></div>
                            <div class="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
                                ${hotel.category}
                            </div>
                            <div class="absolute bottom-3 right-3 bg-white/90 px-2 py-1 rounded text-xs text-blue-600">
                                ⭐ ${hotel.rating || '4.2'}
                            </div>
                        </div>
                        <h3 class="font-semibold text-white text-lg mb-2">${hotel.name}</h3>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-2xl font-bold text-green-300">₹${hotel.price_per_night.toLocaleString()}</span>
                            <span class="text-blue-300 text-sm">/ night</span>
                        </div>
                        <div class="flex items-center text-blue-200 text-sm mb-4">
                            <i class="fas fa-map-marker-alt mr-2"></i>
                            ${hotel.distance_from_center}
                        </div>
                        ${hotel.features ? `
                            <div class="flex flex-wrap gap-1 mb-4">
                                ${hotel.features.map(feature => `
                                    <span class="bg-blue-700/50 text-blue-200 text-xs px-2 py-1 rounded">${feature}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                        <a href="${hotel.link}" target="_blank" 
                           class="block w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-center py-3 rounded-xl transition-all duration-300 transform hover:scale-105">
                            <i class="fas fa-external-link-alt mr-2"></i>Book Now
                        </a>
                    </div>
                `).join('')}
            </div>
        `;
        return div;
    }

    function createItinerarySection(itinerary) {
        const div = document.createElement('div');
        div.className = 'glass rounded-3xl p-8 shadow-2xl card-hover';
        div.innerHTML = `
            <h2 class="text-3xl font-bold text-white mb-6 flex items-center">
                <i class="fas fa-calendar-check text-orange-300 mr-3"></i>
                Day-by-Day Itinerary
            </h2>
            <div class="space-y-4">
                ${itinerary.map((day, index) => `
                    <div class="bg-blue-900/30 rounded-xl overflow-hidden border border-blue-600/30">
                        <div class="collapsible bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white font-semibold flex items-center justify-between cursor-pointer">
                            <div class="flex items-center">
                                <span class="text-2xl mr-3">${index + 1}</span>
                                <div>
                                    <div class="text-lg">${day.theme}</div>
                                    <div class="text-blue-200 text-sm font-normal">₹${day.daily_cost.toLocaleString()} • ${day.activities.length} activities</div>
                                </div>
                            </div>
                            <i class="fas fa-chevron-down transition-transform duration-300"></i>
                        </div>
                        <div class="content p-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                ${['morning', 'afternoon', 'evening'].map(period => `
                                    <div class="bg-blue-800/50 p-4 rounded-xl border border-blue-600/30">
                                        <div class="text-${period === 'morning' ? 'blue' : period === 'afternoon' ? 'orange' : 'purple'}-300 font-semibold mb-3 flex items-center">
                                            <i class="fas fa-${period === 'morning' ? 'sun' : period === 'afternoon' ? 'sun' : 'moon'} mr-2"></i>
                                            ${period.charAt(0).toUpperCase() + period.slice(1)}
                                        </div>
                                        <p class="text-blue-100 mb-2">${day[period].activity}</p>
                                                                                <div class="text-blue-200 text-sm mb-3">
                                            <i class="fas fa-rupee-sign mr-1"></i>
                                            ₹${day[period].cost.toLocaleString()}
                                        </div>
                                        ${day[period].map_url ? `
                                            <a href="${day[period].map_url}" target="_blank" 
                                               class="inline-flex items-center text-blue-300 text-sm hover:text-blue-200 transition-colors">
                                                <i class="fas fa-map-marker-alt mr-1"></i>
                                                View on Map
                                            </a>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="bg-yellow-900/30 p-4 rounded-xl border border-yellow-600/30 mb-4">
                                <div class="text-yellow-300 font-semibold mb-3 flex items-center">
                                    <i class="fas fa-utensils mr-2"></i>
                                    Dining Recommendation
                                </div>
                                <div class="text-yellow-100 mb-2">${day.dining.restaurant}</div>
                                <div class="text-yellow-200 text-sm mb-2">${day.dining.cuisine} • ₹${day.dining.cost.toLocaleString()}</div>
                                ${day.dining.map_url ? `
                                    <a href="${day.dining.map_url}" target="_blank" 
                                       class="inline-flex items-center text-yellow-300 text-sm hover:text-yellow-200 transition-colors">
                                        <i class="fas fa-map-marker-alt mr-1"></i>
                                        Directions
                                    </a>
                                ` : ''}
                            </div>
                            
                            <div class="bg-green-900/30 p-4 rounded-xl border border-green-600/30">
                                <div class="text-green-300 font-semibold mb-2 flex items-center">
                                    <i class="fas fa-bed mr-2"></i>
                                    Accommodation
                                </div>
                                <div class="text-green-100">${day.hotel.name}</div>
                                <div class="text-green-200 text-sm">₹${day.hotel.price.toLocaleString()}/night</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add collapsible functionality
        setTimeout(() => {
            const collapsibles = div.querySelectorAll('.collapsible');
            collapsibles.forEach(collapsible => {
                collapsible.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    const icon = this.querySelector('i');
                    
                    if (content.style.maxHeight) {
                        content.style.maxHeight = null;
                        icon.style.transform = 'rotate(0deg)';
                    } else {
                        content.style.maxHeight = content.scrollHeight + 'px';
                        icon.style.transform = 'rotate(180deg)';
                    }
                });
            });
        }, 100);

        return div;
    }

    function createMapSection(itinerary) {
        const div = document.createElement('div');
        div.className = 'glass rounded-3xl p-8 shadow-2xl card-hover';
        div.innerHTML = `
            <h2 class="text-3xl font-bold text-white mb-6 flex items-center">
                <i class="fas fa-map-marked-alt text-red-300 mr-3"></i>
                Trip Map Overview
            </h2>
            <div id="trip-map" class="h-96 rounded-2xl overflow-hidden border-2 border-blue-600/30 mb-6"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${itinerary.itinerary.flatMap(day => 
                    Object.values(day).filter(item => item.map_url).map((item, index) => `
                        <div class="bg-blue-900/30 p-3 rounded-xl border border-blue-600/30">
                            <div class="text-blue-200 text-sm mb-1">Day ${day.day} • ${item.time || 'Activity'}</div>
                            <div class="text-white font-semibold truncate">${item.activity || item.restaurant}</div>
                        </div>
                    `)
                ).join('')}
            </div>
        `;

        // Initialize map with all locations
        setTimeout(() => {
            const tripMap = new mapboxgl.Map({
                container: 'trip-map',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [0, 20],
                zoom: 2
            });

            tripMap.on('load', function() {
                // Add markers for each location
                itinerary.itinerary.forEach(day => {
                    Object.values(day).forEach(item => {
                        if (item.map_url && item.coordinates) {
                            new mapboxgl.Marker({
                                color: getMarkerColor(day.day)
                            })
                            .setLngLat(item.coordinates)
                            .setPopup(new mapboxgl.Popup().setHTML(`
                                <h3 class="font-semibold">${item.activity || item.restaurant}</h3>
                                <p class="text-sm">Day ${day.day} • ₹${item.cost}</p>
                            `))
                            .addTo(tripMap);
                        }
                    });
                });
            });
        }, 500);

        return div;
    }

    function getMarkerColor(day) {
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
        return colors[(day - 1) % colors.length];
    }

    function showError(message) {
        error.classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
    }
});
