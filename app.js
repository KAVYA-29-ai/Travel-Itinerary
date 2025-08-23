// app.js

// DOM Elements
const form = document.getElementById("travel-form");
const output = document.getElementById("output");
const errorBox = document.getElementById("error");
const errorMessage = document.getElementById("error-message");
const loading = document.getElementById("loading");
const debugInfo = document.getElementById("debug-info");
const debugBox = document.getElementById("debug");

// Initialize Mapbox (will be set later)
let map;

// 🔹 Fetch Mapbox Token securely from Netlify Function
async function getMapboxToken() {
    try {
        const res = await fetch("/.netlify/functions/get-mapbox-token");
        const data = await res.json();
        return data.token;
    } catch (err) {
        console.error("Error fetching Mapbox token:", err);
        return null;
    }
}

// 🔹 Show error
function showError(message) {
    errorBox.classList.remove("hidden");
    errorMessage.textContent = message;
    loading.classList.add("hidden");
}

// 🔹 Hide error
function hideError() {
    errorBox.classList.add("hidden");
    errorMessage.textContent = "";
}

// 🔹 Show debug
function logDebug(message) {
    debugBox.classList.remove("hidden");
    debugInfo.textContent = message;
}

// 🔹 Hide debug
function hideDebug() {
    debugBox.classList.add("hidden");
    debugInfo.textContent = "";
}

// 🔹 Render Map
async function renderMap(coordinates = [77.2090, 28.6139]) { // Default Delhi
    const token = await getMapboxToken();
    if (!token) {
        showError("Mapbox token not found. Please check Netlify env settings.");
        return;
    }

    mapboxgl.accessToken = token;

    if (!map) {
        map = new mapboxgl.Map({
            container: "preview-map",
            style: "mapbox://styles/mapbox/streets-v11",
            center: coordinates,
            zoom: 10
        });
    } else {
        map.setCenter(coordinates);
    }

    new mapboxgl.Marker().setLngLat(coordinates).addTo(map);
}

// 🔹 Display itinerary
function displayItinerary(data) {
    output.innerHTML = "";

    // Trip Summary
    const summaryCard = document.createElement("div");
    summaryCard.className = "glass rounded-3xl p-6 shadow-lg";
    summaryCard.innerHTML = `
        <h2 class="text-2xl font-bold text-white mb-2">${data.summary.title}</h2>
        <p class="text-blue-100">${data.summary.description}</p>
        <p class="text-green-300 font-bold mt-3">💰 Total Cost: ₹${data.total_cost}</p>
    `;
    output.appendChild(summaryCard);

    // Hotels
    const hotelsCard = document.createElement("div");
    hotelsCard.className = "glass rounded-3xl p-6 shadow-lg";
    hotelsCard.innerHTML = `<h3 class="text-xl font-bold text-white mb-4">🏨 Recommended Hotels</h3>`;
    data.hotels.forEach(hotel => {
        const div = document.createElement("div");
        div.className = "mb-3 p-3 bg-blue-800/40 rounded-lg";
        div.innerHTML = `
            <p class="text-white font-semibold">${hotel.name} (${hotel.category})</p>
            <p class="text-blue-200">₹${hotel.price_per_night} per night | ⭐ ${hotel.rating}</p>
            <p class="text-sm text-blue-300">${hotel.distance_from_center}</p>
            <a href="${hotel.link}" target="_blank" class="text-purple-300 underline">Book Now</a>
        `;
        hotelsCard.appendChild(div);
    });
    output.appendChild(hotelsCard);

    // Daily Itinerary
    data.itinerary.forEach(day => {
        const dayCard = document.createElement("div");
        dayCard.className = "glass rounded-3xl p-6 shadow-lg";
        dayCard.innerHTML = `
            <h3 class="text-xl font-bold text-white mb-3">Day ${day.day}: ${day.theme}</h3>
            <p class="text-blue-200"><b>🌅 Morning:</b> ${day.morning.activity} (₹${day.morning.cost})</p>
            <p class="text-blue-200"><b>☀️ Afternoon:</b> ${day.afternoon.activity} (₹${day.afternoon.cost})</p>
            <p class="text-blue-200"><b>🌙 Evening:</b> ${day.evening.activity} (₹${day.evening.cost})</p>
            <p class="text-blue-200"><b>🍽 Dining:</b> ${day.dining.restaurant} - ${day.dining.cuisine} (₹${day.dining.cost})</p>
            <p class="text-green-300 font-semibold">Hotel: ${day.hotel.name} (₹${day.hotel.price})</p>
            <p class="text-purple-300 font-semibold mt-2">💰 Daily Cost: ₹${day.daily_cost}</p>
        `;
        output.appendChild(dayCard);
    });

    output.classList.remove("hidden");
}

// 🔹 Form Submit
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    hideDebug();
    output.classList.add("hidden");
    loading.classList.remove("hidden");

    const city = document.getElementById("city").value.trim();
    const budget = document.getElementById("budget").value.trim();
    const days = document.getElementById("days").value.trim();
    const preferences = document.getElementById("preferences").value.trim();

    if (!city || !budget || !days) {
        showError("⚠️ Please fill in all required fields!");
        return;
    }

    try {
        const response = await fetch("/.netlify/functions/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ city, budget, days, preferences })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "API Error");

        displayItinerary(data);

        // Show map (mock coords for now)
        renderMap([77.2090, 28.6139]);

        loading.classList.add("hidden");
    } catch (err) {
        showError("Error generating itinerary: " + err.message);
        logDebug(err.stack);
    }
});
