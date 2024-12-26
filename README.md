# A7 Leaflet Draw Shape Plugin

A Leaflet plugin for drawing and editing various shapes on a map.

## Features

-   **Drawing:** Supports drawing points, lines, polygons, rectangles, and circles.
-   **Editing:** Allows users to drag, remove, and add nodes to modify the shape of objects.
-   **Events:** Implements a system of events for tracking plugin state, node addition/removal, drag start/end, and customization of nodes before their creation.
-   **Customization:** Provides the ability to change the design of nodes, including replacing them with markers.
-   **GeoJSON Support:**  Allows exporting drawn shapes to GeoJSON and importing shapes from GeoJSON.

## Installation

Include the plugin's JavaScript file in your HTML after including Leaflet:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="path/to/leaflet.a7.drawshape.js"></script>
```

## Usage

### Basic Initialization

Create a Leaflet map and initialize the plugin:

```javascript
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const drawControl = L.a7DrawShape(map);
```

### Starting Drawing

Start drawing a shape using the `startDrawing` method:

```javascript
drawControl.startDrawing('line'); // Start drawing a line
drawControl.startDrawing('polygon'); // Start drawing a polygon
drawControl.startDrawing('rectangle'); // Start drawing a rectangle
drawControl.startDrawing('circle'); // Start drawing a circle
drawControl.startDrawing('point'); // Start drawing a point
```

### Clearing the Drawing

Clear the current drawing using the `clear` method:

```javascript
drawControl.clear();
```

### Public Methods

-   **`startDrawing(type)`:** Starts the drawing process for a specific shape type.
    -   `type`: The type of shape to draw (`'point'`, `'line'`, `'polygon'`, `'rectangle'`, `'circle'`).
-   **`clear()`:** Clears the current drawing and resets the plugin state.
-   **`getGeoJSON()`:** Returns the GeoJSON representation of the drawn shape.
    -   Returns: `object | null` - The GeoJSON object or `null` if no shape is drawn.
-   **`drawFromGeoJSON(geojson, options)`:** Draws a shape on the map from a GeoJSON object.
    -   `geojson`: The GeoJSON object.
    -   `options`: Optional options for drawing the shape.

### Events

The plugin emits several events that you can listen to:

-   **`statechange`:** Triggered when the plugin's state changes (drawing, idle).
    -   `data`: `{ state: 'drawing' | 'idle' }`
    -   Example:
        ```javascript
        drawControl.on('statechange', function(e) {
            console.log('State changed:', e.state);
        });
        ```
-   **`nodeadd`:** Triggered when a new node is added.
    -   `data`: `{ node: L.CircleMarker }`
    -   Example:
        ```javascript
        drawControl.on('nodeadd', function(e) {
            console.log('Node added:', e.node);
        });
        ```
-   **`noderemove`:** Triggered when a node is removed.
    -   `data`: `{ node: L.CircleMarker }`
    -   Example:
        ```javascript
        drawControl.on('noderemove', function(e) {
            console.log('Node removed:', e.node);
        });
        ```
-   **`nodedragstart`:** Triggered when dragging of a node starts.
    -   `data`: `{ node: L.CircleMarker }`
    -   Example:
        ```javascript
        drawControl.on('nodedragstart', function(e) {
            console.log('Node drag start:', e.node);
        });
        ```
-   **`nodedragend`:** Triggered when dragging of a node ends.
    -   `data`: `{ node: L.CircleMarker }`
    -   Example:
        ```javascript
        drawControl.on('nodedragend', function(e) {
            console.log('Node drag end:', e.node);
        });
        ```
-   **`beforenodecreate`:** Triggered before a node is created, allowing you to modify the node's options or replace it with a marker.
    -   `data`: `{ latlng: L.LatLng, options: { radius, color, weight, fillColor, fillOpacity, interactive } }`
    -   Example:
        ```javascript
        drawControl.on('beforenodecreate', function(e) {
            // Example 1: Change node radius and color for lines
            if (drawControl.shapeType === 'line') {
                e.options.radius = 10;
                e.options.color = 'blue';
                e.options.fillColor = 'blue';
            }

            // Example 2: Replace nodes with markers for polygons
            if (drawControl.shapeType === 'polygon') {
              e.options.interactive = false;
              const marker = L.marker(e.latlng, {draggable: true}).addTo(map);
              marker.on('drag', (e) => {
                const newPos = e.target.getLatLng();
                e.latlng = newPos;
                e.options.latlng = newPos;
              })
              e.options.marker = marker;
            }
        });
        ```

### Example: Drawing a Polygon and Getting GeoJSON

```javascript
drawControl.startDrawing('polygon');

// After drawing is complete
const geojson = drawControl.getGeoJSON();
console.log('GeoJSON:', geojson);
```

### Example: Drawing from GeoJSON

```javascript
const geojson = {
  "type": "Polygon",
  "coordinates": [[[ -0.1, 51.5 ], [ -0.2, 51.6 ], [ -0.1, 51.7 ], [ 0, 51.6 ], [ -0.1, 51.5 ]]]
};

drawControl.drawFromGeoJSON(geojson);
```

## License

This plugin is licensed under the MIT License. See the [LICENSE](https://opensource.org/licenses/MIT) file for details.