document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("travel-form");
  const outputDiv = document.getElementById("output");
  const errorDiv = document.getElementById("error");
  const errorMsg = document.getElementById("error-message");
  const loadingDiv = document.getElementById("loading");
  const debugDiv = document.getElementById("debug-info");
  const mapPreview = document.getElementById("preview-map");

  let map, markers = [];

  // Initialize Mapbox
  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN; // From your env
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

  function clearMarkers() {
    markers.forEach(m => m.remove());
    markers = [];
  }

  function addMarker(lat, lng, popupText) {
    const popup = new mapboxgl.Popup({ offset: 25 }).setText(popupText);
    const marker = new mapboxgl.Marker().setLngLat([lng, lat]).setPopup(popup).addTo(map);
    markers.push(marker);
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
            <h3 class="text-xl font-semibold text-white">${hotel.name} - ₹${hotel.cost}</h3>
            <p class="text-blue-100">${hotel.description}</p>
          </div>
        `).join('')}
      </div>

      <div class="glass rounded-3xl p-8 shadow-2xl mb-8 slide-in">
        <h2 class="text-3xl font-bold text-white mb-4">Day by Day Itinerary</h2>
        ${trip.itinerary.map(day => `
          <div class="mb-6 p-4 glass card-hover">
            <h3 class="text-xl font-semibold text-white mb-2">Day ${day.day}</h3>
            <ul class="list-disc list-inside text-blue-100">
              ${day.activities.map(act => `<li>${act.type}: ${act.name} - ₹${act.cost}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;

    // Map: Clear old markers
    clearMarkers();

    // Add POIs markers
    trip.itinerary.forEach(day => {
      day.activities.forEach(act => addMarker(act.lat, act.lng, `${act.name} (${act.type}) - ₹${act.cost}`));
    });

    // Add Hotels markers
    trip.hotels.forEach(hotel => addMarker(hotel.lat, hotel.lng, `${hotel.name} - ₹${hotel.cost}`));

    // Fly to city center
    if (trip.cityCoordinates) {
      const [lng, lat] = trip.cityCoordinates;
      map.flyTo({ center: [lng, lat], zoom: 10 });
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
    } finally {
      loadingDiv.classList.add("hidden");
    }
  });
});
