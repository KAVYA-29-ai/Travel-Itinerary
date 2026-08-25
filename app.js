const $ = (selector) => document.querySelector(selector);
const create = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
let map;
let marker;

async function initMapbox() {
  const status = $('#map-status');
  try {
    const response = await fetch('/.netlify/functions/get-mapbox-token');
    const data = await response.json();
    const token = String(data.token || '').trim();
    if (!data.configured || !token || !window.mapboxgl) {
      status.textContent = 'Mapbox token is not configured. Itinerary generation still works.';
      $('#preview-map').textContent = 'Map preview unavailable.';
      return;
    }

    mapboxgl.accessToken = token;
    map = new mapboxgl.Map({
      container: 'preview-map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [77.209, 28.6139],
      zoom: 3.2,
      attributionControl: false
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.once('load', () => {
      map.resize();
      status.textContent = 'Ready to preview your destination.';
    });
    map.on('error', () => {
      status.textContent = 'Mapbox tiles could not load. Check the public token and domain restrictions.';
    });
    requestAnimationFrame(() => map.resize());
  } catch (error) {
    status.textContent = 'Map preview unavailable. Check your Mapbox configuration.';
    $('#preview-map').textContent = 'Map preview unavailable.';
  }
}

function setBusy(isBusy) {
  $('#loading').classList.toggle('hidden', !isBusy);
  $('#submit-btn').disabled = isBusy;
  $('#submit-btn span:first-child').textContent = isBusy ? 'Creating...' : 'Create itinerary';
}

function showError(message) {
  $('#error-message').textContent = message;
  $('#error').classList.remove('hidden');
}

function hideError() {
  $('#error').classList.add('hidden');
  $('#error-message').textContent = '';
}

function addMetric(parent, label, value) {
  const item = create('div', 'metric');
  item.append(create('span', '', label), create('strong', '', value));
  parent.append(item);
}

function renderTrip(trip) {
  const output = $('#output');
  output.replaceChildren();
  $('#empty-state').classList.add('hidden');

  const summary = create('article', 'glass-panel summary-card reveal');
  summary.append(create('p', 'eyebrow', `${trip.days} days in ${trip.city}`), create('h2', '', 'Trip summary'), create('p', 'summary-copy', trip.summary));
  const metrics = create('div', 'metrics-grid');
  addMetric(metrics, 'Budget', formatMoney(trip.budget));
  addMetric(metrics, 'Estimated total', formatMoney(trip.totalCost));
  addMetric(metrics, 'Remaining', formatMoney(Math.max(0, trip.budget - trip.totalCost)));
  summary.append(metrics);
  if (trip.mapboxWarning) summary.append(create('p', 'soft-warning', trip.mapboxWarning));
  output.append(summary);

  const budgetCard = create('article', 'glass-panel reveal');
  budgetCard.append(create('h2', '', 'Budget control'));
  const percent = Math.min(100, Math.round((trip.totalCost / trip.budget) * 100));
  const bar = create('div', 'budget-bar');
  const fill = create('span');
  fill.style.width = `${percent}%`;
  bar.append(fill);
  budgetCard.append(bar, create('p', 'muted', `${percent}% of your budget is allocated across stays, food, and activities.`));
  output.append(budgetCard);

  const hotels = create('section', 'results-section reveal');
  hotels.append(create('h2', '', 'Recommended hotels'));
  const hotelGrid = create('div', 'hotel-grid');
  trip.hotels.forEach((hotel) => {
    const card = create('article', 'hotel-card glass-panel');
    card.append(create('p', 'rating', `${Number(hotel.rating).toFixed(1)} ★`), create('h3', '', hotel.name), create('p', 'muted', hotel.description), create('strong', 'price', `${formatMoney(hotel.pricePerNight)} / night`), create('p', 'muted', hotel.distanceFromCenter));
    hotelGrid.append(card);
  });
  hotels.append(hotelGrid);
  output.append(hotels);

  const days = create('section', 'results-section reveal');
  days.append(create('h2', '', 'Day-by-day itinerary'));
  trip.itinerary.forEach((day) => {
    const card = create('article', 'day-card glass-panel');
    card.append(create('h3', '', `Day ${day.day}`), create('p', 'day-cost', formatMoney(day.dailyCost)));
    const list = create('div', 'timeline');
    [
      ['Morning', day.morning.activity, day.morning.cost],
      ['Afternoon', day.afternoon.activity, day.afternoon.cost],
      ['Evening', day.evening.activity, day.evening.cost],
      ['Dining', `${day.dining.restaurant} • ${day.dining.cuisine}`, day.dining.cost],
      ['Stay', day.hotel.name, day.hotel.price]
    ].forEach(([label, text, cost]) => {
      const row = create('div', 'timeline-item');
      row.append(create('span', 'timeline-label', label), create('p', '', text), create('strong', '', formatMoney(cost)));
      list.append(row);
    });
    card.append(list);
    days.append(card);
  });
  output.append(days);
  output.classList.remove('hidden');

  if (map && Array.isArray(trip.cityCoordinates)) {
    map.flyTo({ center: trip.cityCoordinates, zoom: 10, essential: true });
    if (marker) marker.remove();
    marker = new mapboxgl.Marker({ color: '#a78bfa' }).setLngLat(trip.cityCoordinates).addTo(map);
    $('#map-status').textContent = `Previewing ${trip.city}.`;
  }
}

function validateClient(city, budget, days) {
  if (city.length < 2) return 'Please enter a valid destination city.';
  if (!Number.isInteger(budget) || budget <= 0) return 'Please enter a valid total budget.';
  if (!Number.isInteger(days) || days < 1 || days > 21) return 'Trip duration must be between 1 and 21 days.';
  if (budget < days * 500) return `Budget is too low. Use at least ${formatMoney(days * 500)} for ${days} days.`;
  return '';
}

document.addEventListener('DOMContentLoaded', () => {
  initMapbox();
  $('#travel-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError();
    const city = $('#city').value.trim();
    const budget = Number($('#budget').value);
    const days = Number($('#days').value);
    const preferences = $('#preferences').value.trim();
    const clientError = validateClient(city, budget, days);
    if (clientError) return showError(clientError);

    setBusy(true);
    $('#output').classList.add('hidden');
    try {
      const response = await fetch('/.netlify/functions/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city, budget, days, preferences }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to generate itinerary.');
      renderTrip(data);
    } catch (error) {
      showError(error.message);
      $('#empty-state').classList.remove('hidden');
    } finally {
      setBusy(false);
    }
  });
});
