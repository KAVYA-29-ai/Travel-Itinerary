// ===== MAPBOX INIT =====
mapboxgl.accessToken = "PASTE_YOUR_MAPBOX_TOKEN_HERE"; // your Mapbox token
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [77.2090, 28.6139], // Default: Delhi
  zoom: 9
});

// ===== FORM HANDLER =====
const form = document.getElementById("tripForm");
const resultsDiv = document.getElementById("results");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const mapStatus = document.getElementById("map-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  generateBtn.disabled = true;
  generateBtn.innerText = "Generating…";

  const city = document.getElementById("city").value;
  const budget = document.getElementById("budget").value;
  const days = document.getElementById("days").value;
  const preferences = document.getElementById("preferences").value;

  try {
    const res = await fetch("/.netlify/functions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, budget, days, preferences })
    });
    const data = await res.json();
    renderResults(data);
    plotMap(data);
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = `<div class="card">❌ Error generating itinerary</div>`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerText = "Generate Itinerary";
  }
});

clearBtn.addEventListener("click", () => {
  resultsDiv.innerHTML = "";
  form.reset();
});

// ===== RENDER RESULTS =====
function renderResults(data) {
  resultsDiv.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "card summary-card";
  summary.innerHTML = `<h3>✨ Your ${data.city} Itinerary</h3>
    <p><strong>Budget:</strong> ₹${data.budget} | <strong>Days:</strong> ${data.days}</p>
    <p><strong>Preferences:</strong> ${data.preferences || "—"}</p>`;
  resultsDiv.appendChild(summary);

  data.itinerary.forEach((day, i) => {
    const dayCard = document.createElement("div");
    dayCard.className = "card day-card";
    dayCard.innerHTML = `<h4>Day ${i+1}</h4><p>${day.activities.join("<br>")}</p>`;
    resultsDiv.appendChild(dayCard);
  });
}

// ===== MAP PINS =====
function plotMap(data) {
  mapStatus.textContent = "📍 Plotting pins…";

  if (!data.locations) {
    mapStatus.textContent = "No locations returned.";
    return;
  }

  // Clear old markers
  document.querySelectorAll(".mapboxgl-marker").forEach(m => m.remove());

  data.locations.forEach(loc => {
    new mapboxgl.Marker({ color: "#6a5acd" })
      .setLngLat([loc.lng, loc.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${loc.name}</strong><br>${loc.type}`))
      .addTo(map);
  });

  if (data.locations.length > 0) {
    map.flyTo({ center: [data.locations[0].lng, data.locations[0].lat], zoom: 12 });
  }

  mapStatus.textContent = "✅ Pins added to map!";
}
