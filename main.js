// Initialize the map
const map = L.map('map').setView([51.5074, -0.1278], 13); // Set the view to London, UK

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a marker layer group
const markers = L.layerGroup().addTo(map);

// Function to handle map click
map.on('click', async function (e) {
    markers.clearLayers(); // Clear any previous markers
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const marker = L.marker([lat, lng]).addTo(markers);

    // Get post offices within a 30-minute walking distance
    const postOffices = await getNearbyPostOffices(lat, lng);
});

// Function to get nearby post offices
async function getNearbyPostOffices(lat, lng) {
  const radiusInMeters = 30 * 60 * 80; // 30 minutes * 60 seconds * 80 meters per second (average walking speed)
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="post_office"](around:${radiusInMeters},${lat},${lng});
      way["amenity"="post_office"](around:${radiusInMeters},${lat},${lng});
      relation["amenity"="post_office"](around:${radiusInMeters},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  const response = await fetch(overpassUrl);
  const data = await response.json();

  const postOffices = data.elements
    .filter(element => element.type === "node" && element.tags.amenity === "post_office")
    .map(element => ({
      id: element.id,
      lat: element.lat,
      lon: element.lon,
      name: element.tags.name || "Unnamed Post Office"
    }));

  postOffices.forEach(postOffice => {
    L.marker([postOffice.lat, postOffice.lon], { title: postOffice.name }).addTo(markers);
  });

  return postOffices;
}
