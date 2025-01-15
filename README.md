# Emergency Services and Flood Zones Locator

## Overview
This project is an interactive web application designed to assist users in locating nearby emergency services and identifying flood-prone areas. It uses geolocation to detect the user's current location and displays relevant information on a map.

## Features
- **Real-time Location Detection**: Automatically detects the user's location or uses a default location if geolocation is unavailable.
- **Interactive Map**: Displays emergency services and flood zones on a map.
- **Service Categories**: Includes hospitals, rescue services, shelters, and more.
- **Flood Zones Visualization**: Highlights low, medium, and high-risk flood areas.
- **Filtering Options**: Allows users to filter displayed data by service type or flood zones.
- **Responsive Design**: Optimized for mobile and desktop use.

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript
- **Libraries**: 
  - Leaflet.js for map rendering and interactivity
  - Overpass API for fetching nearby services
- **APIs**: Geolocation API for detecting user location

## Data Structures
### Flood Zones (Static Data)
Predefined polygons representing flood zones with risk levels.
```javascript
const floodZones = [
    {
        name: "Hiranandani Gardens Basin",
        risk: "LOW",
        coordinates: [[lat1, lon1], [lat2, lon2], ...]
    },
    ...
];
```

### Service Markers (Dynamic Data)
Markers representing emergency services fetched dynamically from the Overpass API.
```javascript
let serviceMarkers = [
    {
        marker: L.marker(...),
        type: "medical", // "rescue", "shelter", etc.
        details: "Service details",
        source: "OpenGovernmentData"
    },
    ...
];
```

## Installation and Setup
1. Clone the repository to your local machine.
    ```bash
    git clone https://github.com/Rupesh4604/Emergency-Services-Locator.git
    ```
2. Navigate to the project directory.
    ```bash
    cd Emergency-Services-Locator
    ```
3. Open the `index.html` file in a web browser.

## How to Use
1. Open the application in a browser.
2. Allow location access when prompted.
3. Use the navigation buttons to filter services or view flood zones.
4. Click on markers for more details about each service or flood zone.

## Files and Structure
- **index.html**: Main HTML file.
- **styles.css**: Contains the application's styling.
- **script.js**: Core JavaScript logic for map interaction and data fetching.

## App and Website Links
- **IOS/Android App Download Link**: [https://median.co/share/erayep#apk](https://median.co/share/erayep#apk) both Mobile and Tab versions are avaliable  
- **Live Website Link**: [https://emergency-services-locator.netlify.app/](https://emergency-services-locator.netlify.app/)

## Future Enhancements
- Integration with real-time flood alerts.
- Support for additional emergency services.
- Offline functionality for disaster scenarios.

## Credits
- **Leaflet.js**: [Leaflet Documentation](https://leafletjs.com/)
- **Overpass API**: [Overpass API Documentation](https://wiki.openstreetmap.org/wiki/Overpass_API)

## License
This project is licensed under the MIT License.
