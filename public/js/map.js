let map;
let geojsonLayer;
let visited = new Map();
let addingMode = false;
let addTripBtn;

function getToken() {
  return localStorage.getItem('token');
}

function getUsernameFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    let payload = token.split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    while (payload.length % 4) {
      payload += '=';
    }
    const decoded = JSON.parse(atob(payload));
    return decoded.username;
  } catch {
    return null;
  }
}

function showMessage(msg, isError = false) {
  const div = document.getElementById('message');
  div.textContent = msg;
  div.style.color = isError ? 'red' : 'green';
}

function updateAuthUI() {
  const auth = document.getElementById('auth');
  const navbar = document.getElementById('navbar');
  const mapDiv = document.getElementById('map');
  const usernameSpan = document.getElementById('username');
  const username = getUsernameFromToken();
  if (username) {
    auth.classList.add('hidden');
    navbar.classList.remove('hidden');
    mapDiv.classList.remove('hidden');
    addTripBtn.classList.remove('hidden');
    usernameSpan.textContent = username;
    if (!map) {
      initMap();
    }
    setTimeout(() => map.invalidateSize(), 0);
    loadTrips();
  } else {
    auth.classList.remove('hidden');
    navbar.classList.add('hidden');
    mapDiv.classList.add('hidden');
    addTripBtn.classList.add('hidden');
    usernameSpan.textContent = '';
    addingMode = false;
    addTripBtn.classList.remove('active');
    addTripBtn.textContent = '+';
  }
}

function initMap() {
  // Set a default view so the map is visible even if the GeoJSON data fails
  // to load for some reason.
  map = L.map('map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  fetch('data/countries.geojson')
    .then(res => res.json())
    .then(data => {
      geojsonLayer = L.geoJSON(data, {
        style: { color: '#555', weight: 1, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          layer.on('click', onCountryClick);
        }
      }).addTo(map);
      map.fitBounds(geojsonLayer.getBounds());
      colorVisited();
    });
}

function onCountryClick(e) {
  if (!addingMode) return;
  const code = e.target.feature.properties.ISO_A3;
  const token = getToken();
  if (!token) {
    alert('Debes iniciar sesión');
    return;
  }
  if (visited.has(code)) {
    alert(`Ya visitado el ${visited.get(code)}`);
    return;
  }
  const date = prompt('Fecha de visita (YYYY-MM-DD):');
  if (!date) return;
  fetch('/api/trips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ country_code: code, visited_at: date })
  }).then(res => {
    if (res.ok) {
      visited.set(code, date);
      colorVisited();
      addingMode = false;
      addTripBtn.classList.remove('active');
      addTripBtn.textContent = '+';
      loadTrips();
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
      layer.bindTooltip(visited.get(code));
    } else {
      layer.setStyle({ fillOpacity: 0 });
      layer.unbindTooltip();
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
      visited = new Map(data.map(t => [t.country_code, t.visited_at]));
      colorVisited();
    })
    .catch(() => {});
}

function setupForms() {
  const regForm = document.getElementById('registerForm');
  const logForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginToggle = document.getElementById('loginToggle');
  const registerToggle = document.getElementById('registerToggle');
  addTripBtn = document.getElementById('addTripBtn');

  addTripBtn.addEventListener('click', () => {
    addingMode = !addingMode;
    addTripBtn.classList.toggle('active', addingMode);
    addTripBtn.textContent = addingMode ? '×' : '+';
  });

  loginToggle.addEventListener('click', () => {
    logForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    loginToggle.classList.add('active');
    registerToggle.classList.remove('active');
  });

  registerToggle.addEventListener('click', () => {
    regForm.classList.remove('hidden');
    logForm.classList.add('hidden');
    registerToggle.classList.add('active');
    loginToggle.classList.remove('active');
  });

  regForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      showMessage('Usuario registrado, ahora puedes iniciar sesión');
      regForm.reset();
    } else {
      showMessage('Error al registrar', true);
    }
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
      showMessage('Sesión iniciada');
      logForm.reset();
      updateAuthUI();
    } else {
      showMessage('Error de autenticación', true);
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    visited.clear();
    colorVisited();
    showMessage('Sesión cerrada');
    updateAuthUI();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupForms();
  updateAuthUI();
});
