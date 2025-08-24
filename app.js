document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("travel-form");
  const outputDiv = document.getElementById("output");
  const errorDiv = document.getElementById("error");
  const errorMsg = document.getElementById("error-message");
  const loadingDiv = document.getElementById("loading");
  const debugDiv = document.getElementById("debug-info");
  const mapPreview = document.getElementById("preview-map");

  let map, marker;

  // Fetch Mapbox token
  let mapboxToken = "";
  try {
    const res = await fetch("/.netlify/functions/get-mapbox-token");
    const data = await res.json();
    mapboxToken = data.token;
  } catch (err) {
    console.error("Failed to fetch Mapbox token:", err);
  }

  mapboxgl.accessToken = mapboxToken;
  map = new mapboxgl.Map({
    container: 'preview-map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [77.2090, 28.6139],
    zoom: 4
  });

  function showError(message) {
    errorDiv.style.display = "block";
    errorMsg.textContent = message;
    setTimeout(() => { errorDiv.style.display = "none"; }, 5000);
  }

  function displayTrip(trip) {
    outputDiv.style.display = "block";
    outputDiv.innerHTML = `
      <div class="glass rounded-3xl p-8 shadow-2xl mb-8 slide-in">
        <h2 class="text-3xl font-bold text-white mb-4">Trip Summary</h2>
        <p class="text-blue-100">${trip.summary}</p>
        <p class="text-blue-200 font-semibold mt-2">Estimated Cost: ₹${trip.totalCost}</p>
      </div>

      <div class="glass rounded-3xl p-8 shadow-2xl mb-8 slide-in">
        <h2 class="text-3xl font-bold text-white mb-4">Recommended Hotels</h2>
        ${trip.hotels.map(hotel => `
          <div class="mb-4 p-4 glass card-hover">
            <h3 class="text-xl font-semibold text-white">${hotel.name} - ₹${hotel.pricePerNight}/night</h3>
            <p class="text-blue-100">${hotel.description}</p>
            <p class="text-blue-200 font-semibold mt-1">Rating: ${hotel.rating} ⭐ | ${hotel.distanceFromCenter}</p>
          </div>
        `).join('')}
      </div>

      <div class="glass rounded-3xl p-8 shadow-2xl mb-8 slide-in">
        <h2 class="text-3xl font-bold text-white mb-4">Day by Day Itinerary</h2>
        ${trip.itinerary.map(day => `
          <div class="mb-6 p-4 glass card-hover">
            <h3 class="text-xl font-semibold text-white mb-2">Day ${day.day} - ₹${day.dailyCost}</h3>
            <ul class="list-disc list-inside text-blue-100">
              <li>🌞 Morning: ${day.morning.activity} - ₹${day.morning.cost}</li>
              <li>🍴 Lunch/Afternoon: ${day.afternoon.activity} - ₹${day.afternoon.cost}</li>
              <li>🌆 Evening: ${day.evening.activity} - ₹${day.evening.cost}</li>
              <li>🍽 Dining: ${day.dining.restaurant} (${day.dining.cuisine}) - ₹${day.dining.cost}</li>
              <li>🏨 Stay: ${day.hotel.name} - ₹${day.hotel.price}</li>
            </ul>
          </div>
        `).join('')}
      </div>
    `;

    // Map marker
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
    const budget = parseInt(document.getElementById("budget").value.trim());
    const days = parseInt(document.getElementById("days").value.trim());
    const preferences = document.getElementById("preferences").value.trim();

    if (!city || !budget || !days) {
      showError("Please fill all required fields!");
      return;
    }

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

      // Fallback with detailed pricing
      const fallbackTrip = {
        summary: `${days}-day trip to ${city} with full breakdown`,
        totalCost: budget,
        cityCoordinates: city.toLowerCase() === "paris" ? [2.3522, 48.8566] : [77.2090, 28.6139],
        hotels: [
          { name: "Luxury Palace Hotel", pricePerNight: Math.floor(budget/2), description: "5-star hotel with pool", rating: 4.7, distanceFromCenter: "1.5 km from center" },
          { name: "Mid-range Comfort Inn", pricePerNight: Math.floor(budget/3), description: "Comfortable & cozy", rating: 4.2, distanceFromCenter: "2.8 km from center" }
        ],
        itinerary: Array.from({ length: days }, (_, i) => ({
          day: i+1,
          dailyCost: Math.floor(budget/days),
          morning: { activity: `Visit famous landmarks of ${city}`, cost: Math.floor(budget/days/4) },
          afternoon: { activity: "Enjoy local cuisine", cost: Math.floor(budget/days/5) },
          evening: { activity: "Evening entertainment", cost: Math.floor(budget/days/4) },
          dining: { restaurant: "Authentic Local Restaurant", cuisine: "Local Specialties", cost: Math.floor(budget/days/6) },
          hotel: { name: i % 2 === 0 ? "Luxury Palace Hotel" : "Mid-range Comfort Inn", price: i % 2 === 0 ? Math.floor(budget/days/2) : Math.floor(budget/days/3) }
        }))
      };
      displayTrip(fallbackTrip);
    } finally {
      loadingDiv.classList.add("hidden");
    }
  });
});
