let map;
let userMarker;
let serviceMarkers = [];
let floodZoneLayers = [];
let currentFilter = "all";
let userLocation = null;

// Flood Zones Data
const floodZones = [
  {
    name: "Hiranandani Gardens Basin",
    risk: "LOW",
    coordinates: [
      [19.120, 72.910],
      [19.125, 72.915],
      [19.122, 72.920],
      [19.117, 72.915],
    ],
  },
  {
    name: "IIT Bombay Low-lying Area",
    risk: "MEDIUM",
    coordinates: [
      [19.132, 72.911],
      [19.137, 72.917],
      [19.134, 72.922],
      [19.129, 72.916],
    ],
  },
];

// Utility Functions
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); // Distance in km
}

function getServiceType(tags) {
  if (tags.amenity === "hospital" || tags.building === "hospital") return "medical";
  if (tags.amenity === "fire_station") return "rescue";
  if (tags.amenity === "police") return "rescue";
  if (tags.amenity === "shelter") return "shelter";
  return "other";
}

function getMarkerColor(type) {
  switch (type) {
    case "medical": return "#2ecc71";
    case "rescue": return "#f1c40f";
    case "shelter": return "#3498db";
    default: return "#e74c3c";
  }
}

function createServiceMarker(service) {
  const type = getServiceType(service.tags);
  const markerColor = getMarkerColor(type);

  if (!service.tags.name) return null; // Exclude unknown services

  const address = service.tags["addr:full"] || 
                  (service.tags["addr:district"] + ", " + service.tags["addr:state"] + ", " + service.tags["addr:postcode"]);
  
  const marker = L.marker([service.lat, service.lon], {
    icon: L.divIcon({
      className: "service-marker",
      html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [24, 24],
    }),
  });

  const popupContent = `
    <div class="popup-content">
      <div class="popup-title">${service.tags.name}</div>
      <div class="popup-details">${address || "No address available"}</div>
      <div class="popup-details">Distance: ${calculateDistance(userLocation.lat, userLocation.lng, service.lat, service.lon)} km</div>
      <div class="popup-details">Flood Risk: LOW</div>
    </div>
  `;

  marker.bindPopup(popupContent);
  return { marker, type, details: popupContent, source: service.tags.source };
}

// Sort Services by Source (OpenGovernmentData first)
function sortServicesBySource(services) {
  return services.sort((a, b) => {
    if (a.source === "OpenGovernmentData" && b.source !== "OpenGovernmentData") {
      return -1;
    }
    if (b.source === "OpenGovernmentData" && a.source !== "OpenGovernmentData") {
      return 1;
    }
    return 0; // No change if both or neither are OpenGovernmentData
  });
}

async function fetchNearbyServices(lat, lon, radius) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lon});
      node["amenity"="fire_station"](around:${radius},${lat},${lon});
      node["amenity"="police"](around:${radius},${lat},${lon});
      node["amenity"="shelter"](around:${radius},${lat},${lon});
      node["building"="hospital"](around:${radius},${lat},${lon});
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });

  const data = await response.json();
  return data.elements;
}

// Flood Zones Handling
function addFloodZones() {
  floodZoneLayers.forEach(layer => map.removeLayer(layer)); // Remove existing flood zone layers
  floodZoneLayers = []; // Reset layers array

  floodZones.forEach(zone => {
    const polygon = L.polygon(zone.coordinates, {
      color: zone.risk === "HIGH" ? "red" : zone.risk === "MEDIUM" ? "orange" : "yellow",
      fillColor: zone.risk === "HIGH" ? "red" : zone.risk === "MEDIUM" ? "orange" : "yellow",
      fillOpacity: 0.3,
      weight: 2,
    });

    polygon.bindPopup(`
      <strong>${zone.name}</strong><br>
      Flood Risk Level: ${zone.risk}<br>
      <small>Stay alert during heavy rainfall</small>
    `);

    polygon.addTo(map);
    floodZoneLayers.push(polygon); // Add to array of layers
  });
}

function toggleFloodZones(show) {
  if (show) {
    addFloodZones(); // Show flood zones
  } else {
    floodZoneLayers.forEach(layer => map.removeLayer(layer)); // Hide flood zones
  }
}

// Populate Services List
function populateServicesList() {
  const container = document.getElementById("services-list");
  container.innerHTML = ""; // Clear the list

  // Sort services so "OpenGovernmentData" sources come first
  const sortedServices = sortServicesBySource(serviceMarkers);

  sortedServices.forEach(({ marker, type, details }) => {
    if (currentFilter === "all" || type === currentFilter) {
      const card = document.createElement("div");
      card.className = "service-card";
      card.innerHTML = `<div class="service-info">${details}</div>`;
      card.addEventListener("click", () => {
        map.setView(marker.getLatLng(), 16);
        marker.openPopup();
      });
      container.appendChild(card);
    }
  });

  if (currentFilter === "floodzones") {
    floodZones.forEach(zone => {
      const card = document.createElement("div");
      card.className = "service-card";
      card.innerHTML = `
        <div class="service-info">
          <strong>${zone.name}</strong><br>
          Flood Risk: ${zone.risk}<br>
          Distance: ${calculateDistance(userLocation.lat, userLocation.lng, zone.coordinates[0][0], zone.coordinates[0][1])} km
        </div>`;
      card.addEventListener("click", () => {
        map.fitBounds(zone.coordinates); // Zoom to the flood zone
      });
      container.appendChild(card);
    });
  }
}

// Filter Markers by Type
function filterMarkers(filterType) {
  serviceMarkers.forEach(({ marker, type }) => {
    if (filterType === "all" || type === filterType) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });

  toggleFloodZones(filterType === "floodzones"); // Toggle flood zones visibility
  populateServicesList();
}

function addLegend() {
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");
    div.innerHTML = `
      <h4>Flood Risk Levels</h4>
      <div class="legend-item">
        <div class="legend-color" style="background: rgba(255, 0, 0, 0.5);"></div>
        High Risk
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: rgba(255, 165, 0, 0.5);"></div>
        Medium Risk
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: rgba(255, 255, 0, 0.5);"></div>
        Low Risk
      </div>
    `;
    return div;
  };
  legend.addTo(map);
}

// Map Initialization
async function initMap() {
  map = L.map("map").setView([userLocation.lat, userLocation.lng], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  userMarker = L.marker([userLocation.lat, userLocation.lng], {
    icon: L.divIcon({
      className: "user-marker",
      html: "📍",
      iconSize: [25, 25],
    }),
  }).addTo(map);
  userMarker.bindPopup("Your Location").openPopup();

  addLegend();

  try {
    const services = await fetchNearbyServices(userLocation.lat, userLocation.lng, 5000);
    services.forEach((service) => {
      const markerData = createServiceMarker(service);
      if (markerData) {
        const { marker, type, details, source } = markerData;
        marker.addTo(map);
        serviceMarkers.push({ marker, type, details, source });
      }
    });
    populateServicesList();
  } catch (error) {
    console.error("Error fetching services:", error);
    document.getElementById("locationStatus").textContent = "Error loading nearby services.";
  }
}

function getUserLocation() {
  const locationStatus = document.getElementById("locationStatus");

  if (!navigator.geolocation) {
    locationStatus.textContent = "Geolocation is not supported by your browser.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      locationStatus.textContent = "Location detected! Showing nearby services...";
      initMap();
    },
    () => {
      locationStatus.textContent = "Unable to get your location. Showing default area...";
      userLocation = { lat: 19.1334, lng: 72.9133 }; // Default to Mumbai
      initMap();
    }
  );
}

document.getElementById("locateMe").addEventListener("click", () => {
  map.setView([userLocation.lat, userLocation.lng], 13);
  userMarker.openPopup();
});

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-button").forEach((btn) => (btn.style.opacity = "1"));
    button.style.opacity = "0.8";

    const filterType = button.id.toLowerCase().replace("services", "");
    currentFilter = filterType;
    filterMarkers(filterType);
  });
});

getUserLocation();
