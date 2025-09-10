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
