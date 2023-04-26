// Initialize the map
var map = L.map("map", {
  center: [51.5074, -0.1278], // London, UK (default center)
  zoom: 13 // default zoom level
});

// Add a tile layer to the map
var tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
});
tileLayer.addTo(map);

// Make an HTTP request to the Overpass API
var xmlhttp = new XMLHttpRequest();
var url = "https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(node['amenity'='pharmacy']({{bbox}});node['amenity'='library']({{bbox}});node['amenity'='post_office']({{bbox}});node['amenity'='bus_stop']({{bbox}});node['shop'='retail']({{bbox}});node['healthcare'='doctor']({{bbox}}););out body;>;out skel qt;";
xmlhttp.onreadystatechange = function() {
  if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
    // Parse the GeoJSON data
    var data = JSON.parse(xmlhttp.responseText);
    // Create a Leaflet GeoJSON layer
    var geoJsonLayer = L.geoJSON(data, {
      // Define the point-to-layer function
      pointToLayer: function(feature, latlng) {
        // Create a custom marker icon based on the feature properties
        var iconUrl = "icons/" + feature.properties.amenity + ".png";
        var iconSize = [32, 32];
        var iconAnchor = [16, 16];
        var icon = L.icon({
          iconUrl: iconUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor
        });
        // Create a Leaflet marker with the custom icon
        var marker = L.marker(latlng, { icon: icon });
        // Bind a popup to the marker with the feature properties
        marker.bindPopup(feature.properties.name);
        // Return the marker to be added to the layer
        return marker;
      }
    });
    // Add the GeoJSON layer to the map
    geoJsonLayer.addTo(map);
  }
};
xmlhttp.open("GET", url, true);
xmlhttp.send();

// Create a Leaflet Routing Machine control
var control = L.Routing.control({
  waypoints: [
    L.latLng(51.5074, -0.1278) // London, UK (default starting point)
  ],
  routeWhileDragging: true,
  router: L.Routing.osrmv1({
    serviceUrl: "http://router.project-osrm.org/route/v1"
  })
});
// Add the control to the map
control.addTo(map);

// Add an event listener for when a route is calculated
map.on("routingerror", function(e) {
  alert(e.error.message);
});

// Add an event listener for when the user drops a pin
map.on("click", function(e) {
  // Set the waypoint to the dropped pin location
  control.setWaypoints([
    L.latLng(e.latlng.lat, e.latlng.lng)
  ]);
});

// Add an event listener for when the route is recalculated
control.on("routesfound", function(e) {
  // Extract the route distance and duration
  var distance = e.routes[0].summary.totalDistance / 1000; // kilometers
  var duration = e.routes[0].summary.totalTime / 60; // minutes
  // Filter the GeoJSON layer to include only the amenities within the 10-minute walking distance
  var amenities = geoJsonLayer.toGeoJSON().features.filter(function(feature) {
    var distanceToAmenity = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]).distanceTo(e.waypoints[0].latLng);
    return distanceToAmenity <= 1000 * 10; // meters
  });
  // Display the number of accessible amenities within the 10-minute walking distance
  alert("You can access " + amenities.length + " amenities within a 10-minute walking distance.");
});

