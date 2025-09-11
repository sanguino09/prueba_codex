let map;
let geojsonLayer;
let visited = new Map();
let addingMode = false;
let addTripBtn;

let dateModal;
let visitDateInput;
let saveDateBtn;
let cancelDateBtn;
let pendingCode = null;
let menuBtn;
let menuDropdown;

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
    dateModal.classList.add('hidden');
    document.getElementById('menuDropdown').classList.add('hidden');
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
    addTripBtn.innerHTML = '<span class="material-icons">add</span>';
    document.getElementById('menuDropdown').classList.add('hidden');
    if (dateModal) {
      dateModal.classList.add('hidden');
    }

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
  const layer = e.target;
  const code = layer.feature.properties.ISO_A3;
  const name = layer.feature.properties.ADMIN;
  if (addingMode) {
    const token = getToken();
    if (!token) {
      alert('Debes iniciar sesión');
      return;
    }
    if (visited.has(code)) {
      alert(`Ya visitado el ${visited.get(code)}`);
      return;
    }

    pendingCode = code;
    visitDateInput.value = '';
    dateModal.classList.remove('hidden');
  } else {
    let content = `<strong>${name}</strong>`;
    if (visited.has(code)) {
      content += `<br/>Visitado el ${visited.get(code)}`;
    } else {
      content += '<br/>No visitado';
    }
    layer.bindPopup(content).openPopup();
  }
}

function colorVisited() {
  if (!geojsonLayer) return;
  geojsonLayer.eachLayer(layer => {
    const code = layer.feature.properties.ISO_A3;
    const name = layer.feature.properties.ADMIN;
    if (visited.has(code)) {
      layer.setStyle({ fillColor: '#3388ff', fillOpacity: 0.5 });
      layer.bindTooltip(`<strong>${name}</strong><br/>${visited.get(code)}`);
    } else {
      layer.setStyle({ fillOpacity: 0 });
      layer.bindTooltip(`<strong>${name}</strong><br/>No visitado`);
    }
  });
}

function loadTrips() {
  const token = getToken();
  if (!token) return;
  fetch('/api/trips', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('token');
      showMessage('Sesión inválida', true);
      updateAuthUI();
      return [];
    }
    return res.json();
  })
    .then(data => {
      visited = new Map(data.map(t => [t.country_code, t.visited_at]));
      colorVisited();
    })
    .catch(() => {});
}

function setupForms() {
  const regForm = document.getElementById('registerForm');
  const logForm = document.getElementById('loginForm');
  const loginToggle = document.getElementById('loginToggle');
  const registerToggle = document.getElementById('registerToggle');
  addTripBtn = document.getElementById('addTripBtn');
  menuBtn = document.getElementById('menuBtn');
  menuDropdown = document.getElementById('menuDropdown');
  const logoutOption = document.getElementById('logoutOption');
  const settingsOption = document.getElementById('settingsOption');
  const helpOption = document.getElementById('helpOption');

  dateModal = document.getElementById('dateModal');
  visitDateInput = document.getElementById('visitDate');
  saveDateBtn = document.getElementById('saveDateBtn');
  cancelDateBtn = document.getElementById('cancelDateBtn');


  addTripBtn.addEventListener('click', () => {
    addingMode = !addingMode;
    addTripBtn.classList.toggle('active', addingMode);
    addTripBtn.innerHTML = addingMode ? '<span class="material-icons">close</span>' : '<span class="material-icons">add</span>';

    colorVisited();
  });

  menuBtn.addEventListener('click', () => {
    menuDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', e => {
    if (!menuDropdown.contains(e.target) && !menuBtn.contains(e.target)) {
      menuDropdown.classList.add('hidden');
    }
  });

  logoutOption.addEventListener('click', () => {
    menuDropdown.classList.add('hidden');
    localStorage.removeItem('token');
    visited.clear();
    colorVisited();
    showMessage('Sesión cerrada');
    updateAuthUI();
  });

  settingsOption.addEventListener('click', () => {
    menuDropdown.classList.add('hidden');
    showMessage('Ajustes no disponibles', true);
  });

  helpOption.addEventListener('click', () => {
    menuDropdown.classList.add('hidden');
    window.location.href = 'help.html';
  });

  saveDateBtn.addEventListener('click', async () => {
    const date = visitDateInput.value;
    if (!pendingCode || !date) {
      dateModal.classList.add('hidden');
      pendingCode = null;
      return;
    }
    const token = getToken();
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ country_code: pendingCode, visited_at: date })
      });
      if (res.ok) {
        visited.set(pendingCode, date);
        colorVisited();
        addingMode = false;
        addTripBtn.classList.remove('active');
        addTripBtn.innerHTML = '<span class="material-icons">add</span>';
      } else if (res.status === 401) {
        showMessage('Sesión inválida', true);
        localStorage.removeItem('token');
        updateAuthUI();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage(data.error || 'Error al guardar', true);
      }
    } catch {
      showMessage('Error al guardar', true);
    } finally {
      dateModal.classList.add('hidden');
      pendingCode = null;
    }
  });

  cancelDateBtn.addEventListener('click', () => {
    dateModal.classList.add('hidden');
    pendingCode = null;

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

}

document.addEventListener('DOMContentLoaded', () => {
  setupForms();
  updateAuthUI();
});
