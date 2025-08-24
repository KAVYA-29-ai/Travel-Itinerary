// app.js - Full Working Version with Mapbox

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("travel-form");
  const outputDiv = document.getElementById("output");
  const errorDiv = document.getElementById("error");
  const errorMsg = document.getElementById("error-message");
  const loadingDiv = document.getElementById("loading");
  const debugDiv = document.getElementById("debug-info");
  const mapPreview = document.getElementById("preview-map");

  let map, marker;

  // Initialize Mapbox
  mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
  map = new mapboxgl.Map({
    container: 'preview-map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [77.2090, 28.6139], // Default Delhi
    zoom: 4
  });

  function showError(message) {
    errorDiv.style.display = "block";
    errorMsg.textContent = message;
    setTimeout(() => { errorDiv.style.display = "none"; }, 5000);
  }

  function displayTrip(trip) {
    // Show output
    outputDiv.style.display = "block";
    outputDiv.innerHTML = `
      <div class="glass rounded-3xl p-8 shadow-2xl">
        <h2 class="text-3xl font-bold text-white mb-4">Trip Summary</h2>
        <p class="text-blue-100">${trip.summary || "No summary available"}</p>
        <p class="text-blue-200 font-semibold mt-2">Estimated Cost: ₹${trip.totalCost || 0}</p>
      </div>

      <div class="glass rounded-3xl p-8 shadow-2xl">
        <h2 class="text-3xl font-bold text-white mb-4">Recommended Hotels</h2>
        ${Array.isArray(trip.hotels) && trip.hotels.length > 0 ? trip.hotels.map(hotel => `
          <div class="mb-4">
            <h3 class="text-xl font-semibold text-white">${hotel.name || "Unnamed Hotel"}</h3>
            <p class="text-blue-100">${hotel.description || "No description available"}</p>
          </div>
        `).join('') : "<p class='text-blue-200'>No hotels recommended.</p>"}
      </div>

      <div class="glass rounded-3xl p-8 shadow-2xl">
        <h2 class="text-3xl font-bold text-white mb-4">Day by Day Itinerary</h2>
        ${Array.isArray(trip.itinerary) && trip.itinerary.length > 0 ? trip.itinerary.map(day => `
          <div class="mb-4">
            <h3 class="text-xl font-semibold text-white">Day ${day.day || "?"}</h3>
            <ul class="list-disc list-inside text-blue-100">
              ${(Array.isArray(day.activities) ? day.activities : []).map(act => `<li>${act}</li>`).join('')}
            </ul>
          </div>
        `).join('') : "<p class='text-blue-200'>No itinerary available.</p>"}
      </div>
    `;

    // Update Mapbox marker
    if (trip.cityCoordinates) {
      const [lng, lat] = trip.cityCoordinates;
      map.flyTo({ center: [lng, lat], zoom: 10 });
      if (marker) marker.remove();
      marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const city = document.getElementById("city").value.trim();
    const budget = document.getElementById("budget").value.trim();
    const days = document.getElementById("days").value.trim();
    const preferences = document.getElementById("preferences").value.trim();

    if (!city || !budget || !days) {
      showError("Please fill all required fields!");
      return;
    }

    // Show loading
    loadingDiv.classList.remove("hidden");
    outputDiv.style.display = "none";

    try {
      const response = await fetch("/.netlify/functions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, budget, days, preferences })
      });

      if (!response.ok) throw new Error("Failed to generate itinerary!");

      const trip = await response.json();
      displayTrip(trip);

    } catch (err) {
      showError(err.message);
      debugDiv.textContent = err.message;

      // fallback mock data with coordinates for Mapbox
      const mockTrip = {
        city: city,
        cityCoordinates: [77.2090, 28.6139], // Delhi default, change if needed
        summary: `${days}-day adventure trip to ${city}`,
        totalCost: budget,
        hotels: [
          { name: "Luxury Palace Hotel", description: "5-star hotel with pool" },
          { name: "Mid-range Comfort Inn", description: "Affordable and cozy" }
        ],
        itinerary: Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          activities: ["Sample Activity 1", "Sample Activity 2"]
        }))
      };

      displayTrip(mockTrip);
    } finally {
      loadingDiv.classList.add("hidden");
    }
  });
});
