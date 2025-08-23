// app.js - Travel Planner Pro (Final Fixed)

// Form + Elements
const form = document.getElementById("travel-form");
const output = document.getElementById("output");
const errorBox = document.getElementById("error");
const errorMessage = document.getElementById("error-message");
const loading = document.getElementById("loading");
const debugInfo = document.getElementById("debug-info");

// Mapbox
let map;

// Load Map with Geocoding
async function loadMap(city) {
  try {
    const tokenRes = await fetch("/.netlify/functions/get-mapbox-token");
    const { token } = await tokenRes.json();

    // Geocode City → Lat/Lng
    const geoRes = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${token}`
    );
    const geoData = await geoRes.json();

    if (!geoData.features || geoData.features.length === 0) {
      throw new Error("Location not found");
    }

    const [lng, lat] = geoData.features[0].center;

    // Init map if not already
    if (!map) {
      mapboxgl.accessToken = token;
      map = new mapboxgl.Map({
        container: "preview-map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: [lng, lat],
        zoom: 10,
      });
    } else {
      map.setCenter([lng, lat]);
    }

    // Clear old markers
    const markers = document.querySelectorAll(".mapboxgl-marker");
    markers.forEach(m => m.remove());

    // Add new marker
    new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

  } catch (err) {
    console.error("Map load error:", err);
    document.getElementById("preview-map").innerHTML =
      "<p class='text-red-400'>Map failed to load</p>";
  }
}

// Display Itinerary
function displayItinerary(data) {
  output.innerHTML = "";

  // Trip Summary
  const summaryCard = document.createElement("div");
  summaryCard.className = "glass rounded-3xl p-6 shadow-2xl";
  summaryCard.innerHTML = `
    <h2 class="text-2xl font-bold text-white mb-4">Trip Summary</h2>
    <p class="text-blue-100">${data.summary}</p>
    <p class="text-green-300 font-semibold mt-2">Estimated Cost: ₹${data.total_cost}</p>
  `;
  output.appendChild(summaryCard);

  // Hotels
  const hotelsCard = document.createElement("div");
  hotelsCard.className = "glass rounded-3xl p-6 shadow-2xl";
  hotelsCard.innerHTML = `<h2 class="text-2xl font-bold text-white mb-4">Recommended Hotels</h2>`;
  data.hotels.forEach(hotel => {
    const div = document.createElement("div");
    div.className = "p-4 mb-3 bg-blue-800/40 rounded-2xl text-blue-100";
    div.innerHTML = `<p class="font-semibold">${hotel.name}</p><p>${hotel.address}</p>`;
    hotelsCard.appendChild(div);
  });
  output.appendChild(hotelsCard);

  // Day-wise Plan
  const planCard = document.createElement("div");
  planCard.className = "glass rounded-3xl p-6 shadow-2xl";
  planCard.innerHTML = `<h2 class="text-2xl font-bold text-white mb-4">Day by Day Itinerary</h2>`;
  data.itinerary.forEach(day => {
    const div = document.createElement("div");
    div.className = "p-4 mb-3 bg-purple-800/40 rounded-2xl text-purple-100";
    div.innerHTML = `<p class="font-semibold">${day.day}</p><p>${day.activities}</p>`;
    planCard.appendChild(div);
  });
  output.appendChild(planCard);

  output.classList.remove("hidden");
}

// Handle Form Submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Values
  const city = document.getElementById("city").value.trim();
  const budget = document.getElementById("budget").value.trim();
  const days = document.getElementById("days").value.trim();
  const preferences = document.getElementById("preferences").value.trim();

  // Validation
  if (!city || !budget || !days) {
    errorMessage.innerText = "⚠️ Please fill all required fields!";
    errorBox.classList.remove("hidden");
    return;
  }

  errorBox.classList.add("hidden");
  output.classList.add("hidden");
  loading.classList.remove("hidden");

  try {
    // Show city on map
    loadMap(city);

    // API Call (AI itinerary)
    const res = await fetch("/.netlify/functions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, budget, days, preferences }),
    });

    if (!res.ok) throw new Error("API request failed");

    const data = await res.json();

    displayItinerary(data);
  } catch (err) {
    console.error(err);
    errorMessage.innerText = "❌ Failed to generate itinerary. Try again.";
    errorBox.classList.remove("hidden");
  } finally {
    loading.classList.add("hidden");
  }
});
