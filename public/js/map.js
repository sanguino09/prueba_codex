
const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const selectedCountries = [];

function toggleCountry(e) {
  const layer = e.target;
  const code = layer.feature.properties.ISO_A3;
  const index = selectedCountries.indexOf(code);

  if (index === -1) {
    selectedCountries.push(code);
    layer.setStyle({ fillColor: '#3388ff', fillOpacity: 0.5 });
  } else {
    selectedCountries.splice(index, 1);
    layer.setStyle({ fillOpacity: 0 });
  }
}

function onEachFeature(feature, layer) {
  layer.on({ click: toggleCountry });
}

fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
  .then((res) => res.json())
  .then((data) => {
    L.geoJSON(data, {
      style: {
        color: '#555',
        weight: 1,
        fillOpacity: 0,
      },
      onEachFeature,
    }).addTo(map);
  })
  .catch((err) => console.error('Error loading GeoJSON', err));

// Expose the selected countries array for later use
window.getSelectedCountries = () => selectedCountries.slice();

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadTrips();
});

function getToken() {
  return localStorage.getItem('token');
}

async function loadTrips() {
  const token = getToken();
  if (!token) {
    showAuthError();
    return;
  }
  try {
    const resp = await fetch('/api/trips', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!resp.ok) {
      if (resp.status === 401) showAuthError();
      return;
    }
    const data = await resp.json();
    const trips = Array.isArray(data.trips) ? data.trips : data;
    if (Array.isArray(trips)) {
      trips.forEach(colorCountry);
    }
  } catch (err) {
    console.error('Failed to load trips', err);
  }
}

function initMap() {
  document.querySelectorAll('.country').forEach(el => {
    el.addEventListener('click', () => selectCountry(el.dataset.code));
  });
}

async function selectCountry(country_code) {
  const token = getToken();
  if (!token) {
    showAuthError();
    return;
  }
  try {
    const resp = await fetch('/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ country_code })
    });
    if (!resp.ok) {
      if (resp.status === 401) showAuthError();
      return;
    }
    colorCountry(country_code);
  } catch (err) {
    console.error('Failed to save trip', err);
  }
}

function colorCountry(code) {
  const el = document.querySelector(`[data-code="${code}"]`);
  if (el) {
    el.classList.add('visited');
  }
}

function showAuthError() {
  alert('Tu sesión ha expirado o es inválida. Inicia sesión nuevamente.');
}

