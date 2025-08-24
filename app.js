document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("travel-form");
  const outputDiv = document.getElementById("output");
  const errorDiv = document.getElementById("error");
  const errorMsg = document.getElementById("error-message");
  const loadingDiv = document.getElementById("loading");
  const debugDiv = document.getElementById("debug-info");
  const mapPreview = document.getElementById("preview-map");

  let map, marker;

  // --- Fetch Mapbox token ---
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
    container: "preview-map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [0, 0],
    zoom: 2
  });

  function showError(msg) {
    errorDiv.style.display = "block";
    errorMsg.textContent = msg;
    setTimeout(() => { errorDiv.style.display = "none"; }, 5000);
  }

  function displayTrip(trip) {
    outputDiv.style.display = "block";
    outputDiv.innerHTML = `
      <div class="glass p-6 rounded-2xl">
        <h2 class="text-white font-bold text-2xl mb-2">Trip Summary</h2>
        <p class="text-blue-100">${trip.summary}</p>
        <p class="text-blue-200 font-semibold mt-2">Estimated Cost: ₹${trip.totalCost}</p>
      </div>
      <div class="glass p-6 rounded-2xl mt-4">
        <h2 class="text-white font-bold text-2xl mb-2">Day by Day Itinerary</h2>
        ${trip.itinerary.map(day => `<pre class="text-blue-100 whitespace-pre-wrap">${day}</pre>`).join("")}
      </div>
    `;

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
    } finally {
      loadingDiv.classList.add("hidden");
    }
  });
});
