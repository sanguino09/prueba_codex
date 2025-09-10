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
