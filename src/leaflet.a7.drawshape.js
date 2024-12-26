/**
 * @license MIT
 * @author Alexander Momot
 *
 * A Leaflet plugin for drawing and editing various shapes on a map.
 *
 * This plugin provides the following features:
 * - Drawing: Supports drawing points, lines, polygons, rectangles, and circles.
 * - Editing: Allows users to drag, remove, and add nodes to modify the shape of objects.
 * - Events: Implements a system of events for tracking plugin state, node addition/removal,
 *   drag start/end, and customization of nodes before their creation.
 * - Customization: Provides the ability to change the design of nodes, including replacing them with markers.
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('leaflet'));
    } else {
        if (typeof window.L === 'undefined') {
            throw new Error('Leaflet must be loaded first');
        }
        factory(window.L);
    }
}(function (L) {
    /**
     * @class L.A7DrawShape
     * @extends L.Class
     * @mixes L.Evented
     * A Leaflet plugin for drawing and editing various shapes on a map.
     */
    L.A7DrawShape = L.Class.extend({
        options: {
            nodeRadius: 6,
            nodeColor: '#ff0000',
            nodeFillOpacity: 0.5,
            nodeStrokeWidth: 2,
            nodeBorderColor: '#ffffff',
            nodeBorderWidth: 2,
            pathColor: '#ff0000',
            pathWidth: 2,
            fillColor: '#ff0000',
            fillOpacity: 0.2,
            autoPanSpeed: 10,
            autoPanPadding: [50, 50]
        },

        /**
         * @constructor
         * @param {L.Map} map - The Leaflet map instance.
         * @param {object} options - Options for the plugin.
         */
        initialize: function (map, options) {
            L.setOptions(this, options);
            this.map = map;
            this.shape = null;
            this.nodes = [];
            this.isDrawing = false;
            this.shapeType = null;
            this.tempLine = null;
            this._bindMapEvents();
            this.state = 'idle'; // Добавляем начальное состояние
        },

        /**
         * Starts the drawing process for a specific shape type.
         * @param {string} type - The type of shape to draw ('point', 'line', 'polygon', 'rectangle', 'circle').
         */
        startDrawing: function (type) {
            this.clear();
            this.shapeType = type;
            this.isDrawing = true;
            this.state = 'drawing';
            this.fire('statechange', { state: this.state });
            this.map.dragging.disable();
        },

        /**
         * Clears the current drawing and resets the plugin state.
         */
        clear: function () {
            if (this.shape) {
                this.map.removeLayer(this.shape);
            }
            if (this.tempLine) {
                this.map.removeLayer(this.tempLine);
                this.tempLine = null;
            }
            this.nodes.forEach(node => {
                this.map.removeLayer(node);
                if (node.background) {
                    this.map.removeLayer(node.background);
                }
            });
            this.shape = null;
            this.nodes = [];
            this.isDrawing = true;
            this.state = 'idle';
            this.fire('statechange', { state: this.state });
        },

        /**
         * Binds map events for drawing and editing.
         * @private
         */
        _bindMapEvents: function () {
            this.map.on('click', this._onMapClick, this);
            this.map.on('mousemove', this._onMouseMove, this);
        },

        /**
         * Creates a node (circle marker) at the given coordinates.
         * @param {L.LatLng} latlng - The coordinates for the node.
         * @returns {L.CircleMarker} The created node.
         * @private
         */
        _createNode: function (latlng) {
            let nodeOptions = {
                radius: this.options.nodeRadius,
                color: this.options.nodeColor,
                weight: this.options.nodeStrokeWidth,
                fillColor: this.options.nodeColor,
                fillOpacity: this.options.nodeFillOpacity,
                interactive: true
            };

            this.fire('beforenodecreate', { latlng: latlng, options: nodeOptions });

            const whiteBackground = L.circleMarker(latlng, {
                radius: nodeOptions.radius,
                color: '#ffffff',
                weight: this.options.nodeBorderWidth,
                fillColor: '#ffffff',
                fillOpacity: 1,
                interactive: false
            }).addTo(this.map);

            const node = L.circleMarker(latlng, nodeOptions).addTo(this.map);
            node.background = whiteBackground;

            let isDragging = false;

            const onMouseDown = (e) => {
                L.DomEvent.stopPropagation(e);
                this.map.dragging.disable();
                this.map.on('mousemove', onMouseMove);
                this.map.on('mouseup', onMouseUp);
                isDragging = true;
                this.fire('nodedragstart', { node: node });
            };

            const onMouseMove = (e) => {
                if (!isDragging) return;
                const newPos = this.map.containerPointToLatLng(e.containerPoint);
                node.setLatLng(newPos);
                whiteBackground.setLatLng(newPos);
                this._updateShape();
            };

            const onMouseUp = (e) => {
                this.map.dragging.enable();
                this.map.off('mousemove', onMouseMove);
                this.map.off('mouseup', onMouseUp);
                isDragging = false;
                this.fire('nodedragend', { node: node });
            };

            node.on('mousedown', onMouseDown);

            node.on('contextmenu', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);

                const minNodes = this.shapeType === 'polygon' ? 3 : (this.shapeType === 'rectangle' || this.shapeType === 'circle' ? 2 : 2);

                if (this.nodes.length === minNodes) {
                    this.clear();
                } else if (this.nodes.length > minNodes) {
                    const idx = this.nodes.indexOf(node);
                    this.nodes.splice(idx, 1);
                    this.map.removeLayer(node);
                    this.map.removeLayer(whiteBackground);
                    this._updateShape();
                    this.fire('noderemove', { node: node });
                }
            });

            return node;
        },

        /**
         * Handles map click events for drawing and editing.
         * @param {L.MapMouseEvent} e - The map click event.
         * @private
         */
        _onMapClick: function (e) {
            if (!this.isDrawing && (this.shapeType === 'polygon' || this.shapeType === 'line') && this.nodes.length >= (this.shapeType === 'polygon' ? 3 : 2)) {
                const clickPoint = this.map.latLngToContainerPoint(e.latlng);
                let minDist = Infinity;
                let insertIdx = -1;
                let canAdd = true;

                for (let node of this.nodes) {
                    const nodePoint = this.map.latLngToContainerPoint(node.getLatLng());
                    const dist = clickPoint.distanceTo(nodePoint);
                    if (dist <= this.options.nodeRadius * 2) {
                        canAdd = false;
                        break;
                    }
                }

                if (canAdd) {
                    for (let i = 0; i < this.nodes.length; i++) {
                        const p1 = this.map.latLngToContainerPoint(this.nodes[i].getLatLng());
                        const p2 = this.map.latLngToContainerPoint(
                            this.nodes[(i + 1) % this.nodes.length].getLatLng()
                        );
                        const dist = this._pointToLineDistance(clickPoint, p1, p2);
                        if (dist < minDist) {
                            minDist = dist;
                            insertIdx = i + 1;
                        }
                    }

                    if (minDist <= this.options.nodeRadius * 2) {
                        const node = this._createNode(e.latlng);
                        this.nodes.splice(insertIdx, 0, node);
                        this._updateShape();
                        this.fire('nodeadd', { node: node });
                        return;
                    }
                }
            }

            if (!this.isDrawing) return;

            if (this.shapeType === 'point' && !this.shape) {
                const node = this._createNode(e.latlng);
                this.nodes.push(node);
                this.shape = node;
                this.isDrawing = false;
                this.state = 'idle';
                this.fire('statechange', { state: this.state });
                this.fire('nodeadd', { node: node });
                return;
            }

            if (this.shapeType === 'line') {
                if (this.nodes.length > 1) {
                    const lastNode = this.nodes[this.nodes.length - 1];
                    const lastNodeLatLng = lastNode.getLatLng();
                    const clickLatLng = e.latlng;
                    const dist = this.map.latLngToContainerPoint(lastNodeLatLng).distanceTo(this.map.latLngToContainerPoint(clickLatLng));
                    if (dist <= this.options.nodeRadius * 2) {
                        this.isDrawing = false;
                        this.state = 'idle';
                        this.fire('statechange', { state: this.state });
                        if (this.tempLine) {
                            this.map.removeLayer(this.tempLine);
                            this.tempLine = null;
                        }
                        return;
                    }
                }
            }

            const node = this._createNode(e.latlng);
            this.nodes.push(node);
            this._updateShape();
            this.fire('nodeadd', { node: node });

            if ((this.shapeType === 'polygon' || this.shapeType === 'rectangle' || this.shapeType === 'circle') && this.nodes.length >= (this.shapeType === 'polygon' ? 3 : 2)) {
                this.isDrawing = false;
                this.state = 'idle';
                this.fire('statechange', { state: this.state });
                if (this.tempLine) {
                    this.map.removeLayer(this.tempLine);
                    this.tempLine = null;
                }
            }
        },

        /**
         * Handles map mousemove events for drawing.
         * @param {L.MapMouseEvent} e - The map mousemove event.
         * @private
         */
        _onMouseMove: function (e) {
            if (!this.isDrawing || !this.nodes.length || this.shapeType === 'point') return;

            if (this.shapeType === 'polygon' && this.nodes.length >= 3) return;
            if ((this.shapeType === 'rectangle' || this.shapeType === 'circle') && this.nodes.length >= 2) return;

            this._autoPan(e.containerPoint);

            if (this.tempLine) {
                this.map.removeLayer(this.tempLine);
            }

            const latlngs = this.nodes.map(node => node.getLatLng());
            latlngs.push(e.latlng);

            if (this.shapeType === 'polygon' && this.nodes.length >= 2) {
                latlngs.push(this.nodes[0].getLatLng());
            }

            this.tempLine = L.polyline(latlngs, {
                color: this.options.pathColor,
                weight: this.options.pathWidth
            }).addTo(this.map);

            this.nodes.forEach(node => {
                if (node.background) {
                    node.background.bringToFront();
                }
                node.bringToFront();
            });
        },

        /**
         * Pans the map automatically when the mouse is near the edge of the map.
         * @param {L.Point} containerPoint - The mouse position in container coordinates.
         * @private
         */
        _autoPan: function (containerPoint) {
            const mapSize = this.map.getSize();
            const padding = this.options.autoPanPadding;
            let x = 0;
            let y = 0;

            if (containerPoint.x < padding[0]) {
                x = -this.options.autoPanSpeed;
            }
            if (containerPoint.x > mapSize.x - padding[0]) {
                x = this.options.autoPanSpeed;
            }
            if (containerPoint.y < padding[1]) {
                y = -this.options.autoPanSpeed;
            }
            if (containerPoint.y > mapSize.y - padding[1]) {
                y = this.options.autoPanSpeed;
            }

            if (x !== 0 || y !== 0) {
                this.map.panBy([x, y]);
            }
        },

        /**
         * Updates the shape on the map based on the current nodes.
         * @private
         */
        _updateShape: function () {
            if (this.shape && this.shape !== this.nodes[0]) {
                this.map.removeLayer(this.shape);
            }

            const latlngs = this.nodes.map(node => node.getLatLng());

            if (this.shapeType === 'point' && latlngs.length === 1) {
                this.shape = this.nodes[0];
            } else if (this.shapeType === 'line' && latlngs.length >= 2) {
                this.shape = L.polyline(latlngs, {
                    color: this.options.pathColor,
                    weight: this.options.pathWidth
                }).addTo(this.map);
            } else if (this.shapeType === 'polygon' && latlngs.length >= 3) {
                latlngs.push(latlngs[0]);
                this.shape = L.polygon(latlngs, {
                    color: this.options.pathColor,
                    weight: this.options.pathWidth,
                    fillColor: this.options.fillColor,
                    fillOpacity: this.options.fillOpacity
                }).addTo(this.map);
            } else if (this.shapeType === 'rectangle' && latlngs.length >= 2) {
                const bounds = L.latLngBounds(latlngs);
                this.shape = L.rectangle(bounds, {
                    color: this.options.pathColor,
                    weight: this.options.pathWidth,
                    fillColor: this.options.fillColor,
                    fillOpacity: this.options.fillOpacity
                }).addTo(this.map);
            } else if (this.shapeType === 'circle' && latlngs.length >= 2) {
                const center = latlngs[0];
                const radius = center.distanceTo(latlngs[1]);
                this.shape = L.circle(center, {
                    radius: radius,
                    color: this.options.pathColor,
                    weight: this.options.pathWidth,
                    fillColor: this.options.fillColor,
                    fillOpacity: this.options.fillOpacity
                }).addTo(this.map);
            }

            this.nodes.forEach(node => {
                if (node.background) {
                    node.background.bringToFront();
                }
                node.bringToFront();
            });
        },

        /**
         * Calculates the distance from a point to a line segment.
         * @param {L.Point} p - The point.
         * @param {L.Point} a - The first point of the line segment.
         * @param {L.Point} b - The second point of the line segment.
         * @returns {number} The distance from the point to the line segment.
         * @private
         */
        _pointToLineDistance: function (p, a, b) {
            const x = p.x;
            const y = p.y;
            const x1 = a.x;
            const y1 = a.y;
            const x2 = b.x;
            const y2 = b.y;

            const A = x - x1;
            const B = y - y1;
            const C = x2 - x1;
            const D = y2 - y1;

            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;

            if (len_sq !== 0) {
                param = dot / len_sq;
            }

            let xx, yy;

            if (param < 0) {
                xx = x1;
                yy = y1;
            } else if (param > 1) {
                xx = x2;
                yy = y2;
            } else {
                xx = x1 + param * C;
                yy = y1 + param * D;
            }

            const dx = x - xx;
            const dy = y - yy;

            return Math.sqrt(dx * dx + dy * dy);
        },

        /**
         * Returns the GeoJSON representation of the drawn shape.
         * @returns {object|null} The GeoJSON object or null if no shape is drawn.
         */
        getGeoJSON: function () {
            if (!this.shape) return null;

            const coordinates = this.nodes.map(node => {
                const latlng = node.getLatLng();
                return [latlng.lng, latlng.lat];
            });

            if (this.shapeType === 'point') {
                return {
                    type: 'Point',
                    coordinates: coordinates[0]
                };
            } else if (this.shapeType === 'line') {
                return {
                    type: 'LineString',
                    coordinates: coordinates
                };
            } else if (this.shapeType === 'polygon') {
                coordinates.push(coordinates[0]);
                return {
                    type: 'Polygon',
                    coordinates: [coordinates]
                };
            } else if (this.shapeType === 'rectangle' && coordinates.length === 2) {
                return {
                    type: 'Polygon',
                    coordinates: [
                        [coordinates[0], [coordinates[1][0], coordinates[0][1]], coordinates[1], [coordinates[0][0], coordinates[1][1]], coordinates[0]]
                    ]
                };
            } else if (this.shapeType === 'circle' && coordinates.length === 2) {
                return {
                    type: 'Point',
                    coordinates: coordinates[0],
                    radius: coordinates[0].distanceTo(coordinates[1])
                }
            }
        },

        /**
         * Draws a shape on the map from a GeoJSON object.
         * @param {object} geojson - The GeoJSON object.
         * @param {object} options - Options for drawing the shape.
         */
        drawFromGeoJSON: function (geojson, options) {
            this.clear();

            if (!geojson || !geojson.type) return;

            if (options) {
                L.setOptions(this, options);
            }

            let coordinates;
            this.shapeType = geojson.type.toLowerCase();

            switch (geojson.type) {
                case 'Point':
                    coordinates = [L.latLng(geojson.coordinates[1], geojson.coordinates[0])];
                    break;
                case 'LineString':
                    coordinates = geojson.coordinates.map(coord =>
                        L.latLng(coord[1], coord[0]));
                    break;
                case 'Polygon':
                    if (geojson.coordinates[0].length === 5) {
                        this.shapeType = 'rectangle';
                        coordinates = [
                            L.latLng(geojson.coordinates[0][0][1], geojson.coordinates[0][0][0]),
                            L.latLng(geojson.coordinates[0][2][1], geojson.coordinates[0][2][0])
                        ]
                    } else {
                        coordinates = geojson.coordinates[0].slice(0, -1).map(coord =>
                            L.latLng(coord[1], coord[0]));
                    }
                    break;
                default:
                    return;
            }

            if (geojson.type === 'Point' && geojson.radius) {
                this.shapeType = 'circle';
                const center = L.latLng(geojson.coordinates[1], geojson.coordinates[0]);
                const radiusPoint = center.destinationPoint(geojson.radius, 90);
                coordinates = [center, radiusPoint];
            }

            coordinates.forEach(coord => {
                const node = this._createNode(coord);
                this.nodes.push(node);
            });

            this._updateShape();
        }
    });

    L.A7DrawShape.include(L.Evented.prototype);
    /**
     * Creates a new instance of L.A7DrawShape.
     * @param {L.Map} map - The Leaflet map instance.
     * @param {object} options - Options for the plugin.
     * @returns {L.A7DrawShape} The new instance of L.A7DrawShape.
     */
    L.a7DrawShape = function (map, options) {
        return new L.A7DrawShape(map, options);
    };

    return L.A7DrawShape;
}));