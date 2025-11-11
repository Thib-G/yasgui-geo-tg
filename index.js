import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { wktToGeoJSON } from 'betterknown';
import proj4 from "proj4";

const parseWKT = (input) => {
  try {
    const normalized = normalizeWKT(input);

    // Extract SRID if present (SRID=nnnn;WKT...)
    let srid = null;
    let wktString = normalized;
    const sridMatch = String(normalized).match(/^SRID=(\d+);(.*)$/);
    if (sridMatch) {
      srid = sridMatch[1];
      wktString = sridMatch[2];
    }

    const geo = wktToGeoJSON(wktString, { proj: proj4 });

    // If source SRID is known, GeoJSON expects CRS <http://www.opengis.net/def/crs/OGC/1.3/CRS84> with longitude/latitude order
    if (srid) {
      // ensure proj4 knows the source definition
      // if not, attempt to fetch it asynchronously (won't block current rendering)
      ensureProjDef(srid).catch(() => {});

      // Proj4 uses the EPSG:4326 definition for <http://www.opengis.net/def/crs/OGC/1.3/CRS84> with longitude/latitude order
      if (proj4.defs(`EPSG:${srid}`)) {
        return reprojectGeoJSON(geo, `EPSG:${srid}`, 'EPSG:4326');
      }
      // otherwise return geo as-is; a subsequent redraw can reproject once
    }

    return geo;
  } catch (e) {
    console.error('Error parsing WKT:', e);
  }
};

/**
 * Normalize WKT-like literals into an SRID-prefixed WKT string when needed.
 * This is required because betterknown doesn't parse WKT strings with a URI based CRS.
 *
 * Examples:
 * - "<http://.../4326> POINT(60 12)" -> "SRID=4326;POINT(60 12)"
 * - "SRID=4326;POINT(60 12)" -> unchanged
 * - "POINT(60 12)" -> unchanged
 */
const normalizeWKT = (wkt) => {
  if (typeof wkt !== 'string') return wkt;
  const s = wkt.trim();

  // already in SRID=nnnn;WKT form -> leave as-is
  if (/^SRID=\d+;/.test(s)) return s;

  // plain WKT (e.g. POINT(...), POLYGON(...)) -> leave as-is
  if (/^[A-Za-z]+\s*\(.+\)$/.test(s)) return s;

  // URI-based CRS then WKT, e.g. <.../4326> POINT(...)
    // Special-case CRS84: it's the default WKT CRS (lon/lat) so drop the URI
    const crs84 = s.match(/^<http:\/\/www\.opengis\.net\/def\/crs\/OGC\/1\.3\/CRS84>\s*(.+)$/i);
    if (crs84) {
      return crs84[1].trim();
    }

    const m = s.match(/^<[^>]*\/(\d+)>\s*(.+)$/);
    if (m) {
      const srid = m[1];
      const rest = m[2].trim();
      return `SRID=${srid};${rest}`;
    }

  return wkt;
};

// Known SRID proj4 definitions. Add more as needed.
const SRID_PROJ = {
  // Proj4 defaults to longitude first axis order!!
  '4326': '+proj=longlat +datum=WGS84 +ellps=WGS84 +no_defs',
  // Web Mercator
  '3857': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0 +x_0=0 +y_0=0 +k=1.0 +units=m +no_defs',
  // Belgium Lambert 1972
  '31370': '+proj=lcc +lat_1=51.166667 +lat_2=49.833333 +lat_0=90 +lon_0=4.367486666666667 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +units=m +no_defs',
  // ETRS89 geographic
  '4258': '+proj=longlat +ellps=GRS80 +no_defs',
  // ETRS89 / LAEA Europe
  '3035': '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs',
  // ETRS89 / UTM zone 32N
  '25832': '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs',
  // ETRS89 / UTM zone 33N
  '25833': '+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs',
};

// Register embedded proj4 definitions at module initialization
Object.keys(SRID_PROJ).forEach((s) => {
  try {
    proj4.defs(`EPSG:${s}`, SRID_PROJ[s]);
  } catch (e) {
    // ignore registration errors
  }
});

// Ensure a proj4 definition exists for a given numeric SRID.
// If missing, attempt to fetch it from epsg.io and register it with proj4.
const ensureProjDef = async (srid) => {
  if (!srid) return;
  const code = `EPSG:${srid}`;
  if (proj4.defs(code)) return;

  // first try our embedded map
  if (SRID_PROJ[srid]) {
    try {
      proj4.defs(code, SRID_PROJ[srid]);
      return;
    } catch (e) {
      // fall through to fetch attempt
    }
  }

  // Attempt to fetch proj4 definition from epsg.io
  try {
    const url = `https://epsg.io/${srid}.proj4`;
    const resp = await fetch(url);
    if (resp.ok) {
      const txt = await resp.text();
      if (txt && txt.trim()) {
        proj4.defs(code, txt.trim());
      }
    }
  } catch (e) {
    console.debug('ensureProjDef fetch failed', srid, e);
  }
};

// Reproject GeoJSON geometries from `fromProj` to `toProj` using proj4.
const reprojectGeoJSON = (geo, fromProj, toProj = 'EPSG:4326') => {
  if (!geo || !fromProj) return geo;    

  // clone to avoid mutating original
  const out = JSON.parse(JSON.stringify(geo));

  const transformPoint = (pt) => {
    try {
      if (fromProj == 'EPSG:4326'){
        // Input will be latitude first but output needs to be longitude first
        return [pt[1], pt[0]];
      }
      return proj4(fromProj, toProj, pt);
    } catch (e) {
      return pt;
    }
  };

  const walkCoords = (coords) => {
    if (!Array.isArray(coords)) return coords;
    // detect point
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return transformPoint(coords);
    }
    return coords.map(walkCoords);
  };

  const walkGeometry = (g) => {
    if (!g) return;
    const t = g.type;
    if (t === 'Point') g.coordinates = transformPoint(g.coordinates);
    else if (t === 'MultiPoint' || t === 'LineString') g.coordinates = g.coordinates.map(transformPoint);
    else if (t === 'Polygon' || t === 'MultiLineString') g.coordinates = g.coordinates.map((ring) => ring.map(transformPoint));
    else if (t === 'MultiPolygon') g.coordinates = g.coordinates.map((poly) => poly.map((ring) => ring.map(transformPoint)));
    else if (t === 'GeometryCollection' && Array.isArray(g.geometries)) g.geometries.forEach(walkGeometry);
  };

  if (out.type === 'FeatureCollection' && Array.isArray(out.features)) {
    out.features.forEach((f) => {
      walkGeometry(f.geometry);
    });
  } else if (out.type === 'Feature') {
    walkGeometry(out.geometry);
  } else {
    walkGeometry(out);
  }

  return out;
};

const basemaps = {
  // OpenStreetMap
  openStreetMap: L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '© OpenStreetMap contributors',
    },
  ),
  // OpenTopoMap
  openTopoMap: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenTopoMap contributors',
  }),

  // ESRI World Imagery (Satellite)
  'ESRI World Imagery (Satellite)': L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  ),

  // CartoDB Voyager
  'CartoDB Voyager': L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; CartoDB',
    },
  ),
};

const conversions = {
  'http://www.opengis.net/ont/geosparql#wktLiteral': parseWKT,
  'http://www.openlinksw.com/schemas/virtrdf#Geometry': parseWKT,
  'http://www.opengis.net/ont/geosparql#geoJSONLiteral': (geojson) => geojson,
};

/**
 * Creates a GeoJSON object from SPARQL query bindings.
 *
 * @param {Array} bindings - An array of binding objects from a SPARQL query result.
 * @param {string} wktColumn - The key in the binding objects that contains the WKT (Well-Known Text) geometry.
 * @returns {Object} A GeoJSON object representing the features.
 */
const createGeojson = (bindings, column) => ({
  type: 'FeatureCollection',
  features: bindings.map((item) => ({
    type: 'Feature',
    properties: item,
    geometry: conversions[item[column].datatype]
      ? conversions[item[column].datatype](item[column].value)
      : { type: 'Point', coordinates: [] },
  })),
});

/**
 * A plugin for YASR (Yet Another SPARQL Results) visualizer that displays geographic data on a map.
 * Requires Leaflet.js for map rendering.
 *
 * @class
 * @property {Object} yasr - The YASR instance this plugin is attached to
 * @property {number} priority - The plugin's priority in the YASR visualization order
 * @property {string} label - The display label for the plugin
 * @property {HTMLElement} container - The DOM container for the map
 * @property {L.Map} map - The Leaflet map instance
 * @property {L.LayerGroup} lg - The Leaflet layer group for results
 *
 * @description
 * This plugin creates an interactive map visualization for SPARQL query results that contain WKT (Well-Known Text)
 * geometric data. It plots the geometric data on an OpenStreetMap base layer and provides popup information
 * for each feature. The plugin automatically detects if it can handle the results by checking for columns
 * containing "WKT" in their name.
 */
class GeoPlugin {
  constructor(yasr) {
    this.yasr = yasr;
    this.priority = 30;
    this.label = 'Geo';
    this.geometryColumns = [];
    this.updateColumns();
  }

  updateColumns() {
    const bindings = this.yasr?.results?.json?.results?.bindings ?? [];
    const firstColumn = bindings[0] ?? {};

    this.geometryColumns = Object.keys(firstColumn)
      .filter(
        (k) =>
          firstColumn[k].datatype &&
          Object.keys(conversions).includes(firstColumn[k].datatype),
      )
      .map((colName) => ({ colName, datatype: firstColumn[colName].datatype }));
  }

  draw() {
    this.updateColumns();
    this.updateMap();
  }

  updateMap() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.style.height = '500px';
      this.container.style.width = '100%';
      const map = L.map(this.container, {
        center: [50 + 38 / 60 + 28 / 3600, 4 + 40 / 60 + 5 / 3600],
        zoom: 5,
      });
      basemaps.openStreetMap.addTo(map);
      const lg = L.featureGroup().addTo(map);
      L.control.layers(basemaps, { Results: lg }).addTo(map);
      this.map = map;
      this.lg = lg;
    }
    this.yasr.resultsEl.appendChild(this.container);

    this.lg.clearLayers();

    for (const geometryColumn of this.geometryColumns) {
      const colName = geometryColumn.colName;

      const geojson = createGeojson(
        this.yasr.results.json.results.bindings,
        colName,
      );

      const newLayers = L.geoJson(geojson, {
        pointToLayer: (feature, latlng) =>
          L.circleMarker(latlng, {
            radius: 4,
            weight: 2,
            opacity: 0.7,
          }),
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          const popupContent = Object.keys(p).map(
            (k) =>
              `<b>${k}:</b> ${
                p[k].value.length > 120
                  ? p[k].value.substring(0, 120) + '...'
                  : p[k].value
              }`,
          );
          layer.bindPopup(popupContent.join('<br>'));
        },
      });
      this.lg.addLayer(newLayers);

      // Fit bounds if layer has features
      if (geojson.features && geojson.features.length > 0) {
        this.map.fitBounds(this.lg.getBounds(), {
          padding: [20, 20],
          maxZoom: 14,
        });
      }
    }

    // Force map to redraw
    setTimeout(() => {
      this.map.invalidateSize();
      // Fit bounds if layer has features
      this.map.fitBounds(this.lg.getBounds(), {
        padding: [20, 20],
        maxZoom: 14,
      });
    }, 100);
  }

  getIcon() {
    const icon = document.createElement('div');
    icon.innerHTML = '🌍';
    return icon;
  }

  canHandleResults() {
    this.updateColumns();
    return this.geometryColumns && this.geometryColumns.length > 0;
  }
}

export { ensureProjDef };
export default GeoPlugin;
