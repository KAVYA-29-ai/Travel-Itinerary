// app.js - Fixed version for Travel Planner Pro

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trip-form");
  const summaryDiv = document.getElementById("trip-summary");
  const hotelsDiv = document.getElementById("recommended-hotels");
  const itineraryDiv = document.getElementById("day-itinerary");
  const totalCostDiv = document.getElementById("total-cost");
  const errorDiv = document.getElementById("error-msg");
  const destinationPreview = document.getElementById("destination-preview");

  // Helper function to show error messages
  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    setTimeout(() => { errorDiv.style.display = "none"; }, 5000);
  }

  // Function to display trip data
  function displayTrip(trip) {
    // Trip Summary
    summaryDiv.textContent = trip.summary || "No summary available";

    // Total Cost
    totalCostDiv.textContent = `Estimated Cost: ₹${trip.totalCost || 0}`;

    // Recommended Hotels
    if (Array.isArray(trip.hotels)) {
      hotelsDiv.innerHTML = trip.hotels.map(hotel => `
        <div class="hotel-card">
          <h3>${hotel.name || "Unnamed Hotel"}</h3>
          <p>${hotel.description || "No description available"}</p>
        </div>
      `).join('');
    } else {
      hotelsDiv.innerHTML = "<p>No hotels recommended.</p>";
    }

    // Day-by-Day Itinerary
    if (Array.isArray(trip.itinerary)) {
      itineraryDiv.innerHTML = trip.itinerary.map(day => `
        <div class="day-card">
          <h4>Day ${day.day || "?"}</h4>
          <ul>
            ${(Array.isArray(day.activities) ? day.activities : []).map(act => `<li>${act}</li>`).join('')}
          </ul>
        </div>
      `).join('');
    } else {
      itineraryDiv.innerHTML = "<p>No itinerary available.</p>";
    }

    // Destination Preview (Mapbox or image URL)
    if (trip.city) {
      destinationPreview.textContent = `Destination: ${trip.city}`;
    } else {
      destinationPreview.textContent = "Destination Preview";
    }
  }

  // Form submission
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

    // Show loading state
    summaryDiv.textContent = "Generating your itinerary...";
    hotelsDiv.innerHTML = "";
    itineraryDiv.innerHTML = "";
    totalCostDiv.textContent = "";

    try {
      const response = await fetch("/.netlify/functions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, budget, days, preferences })
      });

      if (!response.ok) throw new Error("Failed to generate itinerary!");

      const trip = await response.json();

      // Display trip data
      displayTrip(trip);

    } catch (err) {
      showError(err.message);
      // Optionally fallback to mock data
      const mockTrip = {
        city: city,
        summary: `7-day adventure trip to ${city}`,
        totalCost: budget,
        hotels: [
          { name: "Luxury Palace Hotel", description: "5-star hotel with pool" },
          { name: "Mid-range Comfort Inn", description: "Affordable and cozy" }
        ],
        itinerary: [
          { day: 1, activities: ["Visit Red Fort", "Street food tour"] },
          { day: 2, activities: ["Hiking", "Museum visit"] },
          { day: 3, activities: ["Market shopping", "Local cuisine tasting"] },
          { day: 4, activities: ["Adventure park", "Boat ride"] },
          { day: 5, activities: ["Temple visit", "Sunset viewpoint"] },
          { day: 6, activities: ["Cultural show", "Night market"] },
          { day: 7, activities: ["Relax at spa", "Souvenir shopping"] }
        ]
      };
      displayTrip(mockTrip);
    }
  });
});
