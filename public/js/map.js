let map;
let geojsonLayer;
let visited = new Set();

function getToken() {
  return localStorage.getItem('token');
}

function initMap() {
  map = L.map('map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
    .then(res => res.json())
    .then(data => {
      geojsonLayer = L.geoJSON(data, {
        style: { color: '#555', weight: 1, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          layer.on('click', onCountryClick);
        }
      }).addTo(map);
      colorVisited();
    });
}

function onCountryClick(e) {
  const code = e.target.feature.properties.ISO_A3;
  const token = getToken();
  if (!token) {
    alert('Debes iniciar sesión');
    return;
  }
  fetch('/api/trips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ country_code: code })
  }).then(res => {
    if (res.ok) {
      visited.add(code);
      e.target.setStyle({ fillColor: '#3388ff', fillOpacity: 0.5 });
    } else if (res.status === 401) {
      alert('Sesión inválida');
    }
  });
}

function colorVisited() {
  if (!geojsonLayer) return;
  geojsonLayer.eachLayer(layer => {
    const code = layer.feature.properties.ISO_A3;
    if (visited.has(code)) {
      layer.setStyle({ fillColor: '#3388ff', fillOpacity: 0.5 });
    }
  });
}

function loadTrips() {
  const token = getToken();
  if (!token) return;
  fetch('/api/trips', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(res => res.json())
    .then(data => {
      visited = new Set(data.map(t => t.country_code));
      colorVisited();
    })
    .catch(() => {});
}

function setupForms() {
  const regForm = document.getElementById('registerForm');
  const logForm = document.getElementById('loginForm');

  regForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    alert('Registrado');
  });

  logForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('logUsername').value;
    const password = document.getElementById('logPassword').value;
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.token);
      loadTrips();
    } else {
      alert('Error de autenticación');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupForms();
  initMap();
  loadTrips();
});
