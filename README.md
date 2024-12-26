```markdown
# Leaflet Draw and Edit Shape Plugin

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
<script src="path/to/leaflet.draweditshape.js"></script>
```

## Usage

### Basic Initialization

Create a Leaflet map and initialize the plugin:

```javascript
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const drawControl = L.drawEditShape(map, {
    nodeRadius: 8,             // Radius of the node markers (pixels)
    nodeColor: '#007bff',      // Color of the node markers
    nodeFillOpacity: 0.8,      // Fill opacity of the node markers
    nodeStrokeWidth: 3,        // Stroke width of the node markers
    nodeBorderColor: '#ffffff', // Border color of the node markers
    nodeBorderWidth: 2,        // Border width of the node markers
    pathColor: '#28a745',      // Color of the drawn path (lines and polygon borders)
    pathWidth: 3,              // Width of the drawn path
    fillColor: '#28a745',      // Fill color of polygons, rectangles, and circles
    fillOpacity: 0.3,          // Fill opacity of polygons, rectangles, and circles
    autoPanSpeed: 15,           // Speed of auto-panning when drawing near the edge of the map
    autoPanPadding: [60, 60],   // Padding around the edge of the map for auto-panning
    longPressDelete: true,     // Enable long-press delete
    longPressTime: 1000        // Time in milliseconds for long press (default: 1000)
});
```

### Options Description

-   **`nodeRadius`**: `Number` (default: `6`) - Radius of the node markers in pixels.
-   **`nodeColor`**: `String` (default: `'#ff0000'`) - Color of the node markers. Can be any valid CSS color value.
-   **`nodeFillOpacity`**: `Number` (default: `0.5`) - Fill opacity of the node markers. Value between 0 and 1.
-   **`nodeStrokeWidth`**: `Number` (default: `2`) - Stroke width of the node markers in pixels.
-   **`nodeBorderColor`**: `String` (default: `'#ffffff'`) - Border color of the node markers. Can be any valid CSS color value.
-   **`nodeBorderWidth`**: `Number` (default: `2`) - Border width of the node markers in pixels.
-   **`pathColor`**: `String` (default: `'#ff0000'`) - Color of the drawn path (lines and polygon borders). Can be any valid CSS color value.
-   **`pathWidth`**: `Number` (default: `2`) - Width of the drawn path in pixels.
-   **`fillColor`**: `String` (default: `'#ff0000'`) - Fill color of polygons, rectangles, and circles. Can be any valid CSS color value.
-   **`fillOpacity`**: `Number` (default: `0.2`) - Fill opacity of polygons, rectangles, and circles. Value between 0 and 1.
-   **`autoPanSpeed`**: `Number` (default: `10`) - Speed of auto-panning when drawing near the edge of the map.
-   **`autoPanPadding`**: `Array<Number>` (default: `[50, 50]`) - Padding around the edge of the map in pixels for auto-panning. An array of two numbers `[horizontal, vertical]`.
- **`longPressDelete`**: `Boolean` (default: `false`) - Enables or disables deleting the entire shape on long press of a node.
- **`longPressTime`**: `Number` (default: `1000`) - Duration of the long press in milliseconds.
```markdown

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

### Deleting a Shape with Long Press

1. **Enable `longPressDelete`:** Set the `longPressDelete` option to `true` during plugin initialization.
2. **Long Press:** Press and hold the left mouse button on any node of the shape for the specified `longPressTime`.
3. **Release:** The entire shape will be deleted when you release the mouse button (provided you haven't moved the mouse, initiating a drag).

**Note:** Long press delete will *not* trigger if you are dragging a node.

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
-   **`nodragstart`:** Triggered when dragging of a node starts.
    -   `data`: `{ node: L.CircleMarker }`
    -   Example:
        ```javascript
        drawControl.on('nodragstart', function(e) {
            console.log('Node drag start:', e.node);
        });
        ```
-   **`nodragend`:** Triggered when dragging of a node ends.
    -   `data`: `{ node: L.CircleMarker }`
    -   Example:
        ```javascript
        drawControl.on('nodragend', function(e) {
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
