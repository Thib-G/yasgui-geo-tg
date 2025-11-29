import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import proj4 from 'proj4';
import { wktToGeoJSON } from 'betterknown';

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

// Register known SRID projections with proj4
for (const [srid, definition] of Object.entries(SRID_PROJ)) {
  proj4.defs(`EPSG:${srid}`, definition);
}

// check if srid is already registered, if not try to fetch from epsg.io
// and register it in the proj4 defs
const ensureSridRegistered = async (srid) => {
  const code = `EPSG:${srid}`;
  // proj4.defs is a function; call it to check whether the definition already exists.
  if (!proj4.defs(code)) {
    try {
      const response = await fetch(`https://epsg.io/${srid}.proj4`);
      if (response.ok) {
        const proj4Def = await response.text();
        proj4.defs(code, proj4Def);
        console.debug(`Registered SRID ${srid} with proj4: ${proj4Def}`);
      } else {
        console.warn(`Failed to fetch proj4 definition for SRID ${srid}`);
      }
    } catch (error) {
      console.error(`Error fetching proj4 definition for SRID ${srid}:`, error);
    }
  }
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

const parseWKT = async (wkt) => {
  // betterknown's wktToGeoJSON function already handles SRID prefixes
  // and the <http://www.opengis.net/def/crs/EPSG/0/4326> prefix with lat/lon order
  // so we can directly pass the WKT string to it.
  if (wkt.startsWith('<http://www.opengis.net/def/crs/EPSG/0/4326>')) {
    return wktToGeoJSON(wkt, { proj: proj4 });
  }
  // if it has a prefix in the style of <http://www.opengis.net/def/crs/EPSG/0/xxxx>
  // we need to extract xxxx and replace it with SRLD=xxxx;
  // we also need to fetch the projection info from epsg.io and pass it to betterknown
  if (wkt.startsWith('<http://www.opengis.net/def/crs/EPSG/0/')) {
    const match = wkt.match(/^<http:\/\/www\.opengis\.net\/def\/crs\/EPSG\/0\/(\d+)>\s*([\s\S]*)$/);
    if (match) {
      const epsgCode = match[1];
      const wktWithoutPrefix = match[2].trim();
      const wktWithSRID = `SRID=${epsgCode};${wktWithoutPrefix}`;
      await ensureSridRegistered(epsgCode);
      return wktToGeoJSON(wktWithSRID, { proj: proj4 });
    }
  }
  // if there is a SRID=xxxx; prefix, ensure the srid is registered
  // and pass to betterknown
  if (wkt.startsWith('SRID=')) {
    const match = wkt.match(/^SRID=(\d+);/);
    if (match) {
      const epsgCode = match[1];
      await ensureSridRegistered(epsgCode);
    }
  }
  return wktToGeoJSON(wkt, { proj: proj4 });
}

/**
 * Map of supported RDF datatype URIs to converter functions.
 * Converter functions accept a string (literal value) and may return synchronously or return a Promise.
 * Synchronous converter example: JSON.parse (for geoJSONLiteral).
 *
 * @type {Object.<string, function(string): (Object|Promise<Object>)>}
 */
const conversions = {
  'http://www.opengis.net/ont/geosparql#wktLiteral': parseWKT,
  'http://www.openlinksw.com/schemas/virtrdf#Geometry': parseWKT,
  'http://www.opengis.net/ont/geosparql#geoJSONLiteral': JSON.parse,
};

/**
 * Creates a GeoJSON object from SPARQL query bindings.
 *
 * @param {Array} bindings - An array of binding objects from a SPARQL query result.
 * @param {string} wktColumn - The key in the binding objects that contains the WKT (Well-Known Text) geometry.
 * @returns {Object} A GeoJSON object representing the features.
 */
const createGeojson = async (bindings, column) => ({
  type: 'FeatureCollection',
  features: await Promise.all(
    bindings.map(async (item) => {
      const converter = conversions[item[column].datatype];
      const geometry = converter
        ? await converter(item[column].value)
        : { type: 'Point', coordinates: [] };
      return {
        type: 'Feature',
        properties: item,
        geometry,
      };
    }),
  ),
});

/**
 * GeoPlugin: YASR plugin that displays geographic results in a Leaflet map.
 *
 * @class
 */
class GeoPlugin {
  /**
   * Create a new GeoPlugin instance.
   *
   * @param {Object} yasr - The YASR instance the plugin is attached to. Expected to expose results.json.results.bindings and resultsEl.
   */
  constructor(yasr) {
    this.yasr = yasr;
    this.priority = 30;
    this.label = 'Geo';
    this.geometryColumns = [];
    this.updateColumns();
  }

  /**
   * Update detected geometry columns based on current YASR results.
   * @returns {void}
   */
  updateColumns() {
    const bindings = this.yasr?.results?.json?.results?.bindings ?? [];
    const firstRow = bindings[0] ?? {};

    this.geometryColumns = Object.keys(firstRow)
      .filter(
        (k) =>
          firstRow[k].datatype &&
          Object.keys(conversions).includes(firstRow[k].datatype),
      )
      .map((colName) => ({ colName, datatype: firstRow[colName].datatype }));
  }

  /**
   * Called by YASR to render the visualization.
   * @returns {Promise<void>}
   */
  async draw() {
    this.updateColumns();
    await this.updateMap();
  }

  /**
   * Build or update the Leaflet map with the current results.
   * @returns {Promise<void>}
   */
  async updateMap() {
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

      // createGeojson may be async, awaiting ensures any fetch/registration is completed
      const geojson = await createGeojson(
        this.yasr.results.json.results.bindings,
        colName,
      );
      
      const DEFAULT_COLOR = '#3388ff'; // Choose your default color

      const newLayers = L.geoJson(geojson, {
        pointToLayer: (feature, latlng) => {
          const color = feature.properties?.wktColor?.value || DEFAULT_COLOR;
          return L.circleMarker(latlng, {
            radius: 4,
            weight: 2,
            color: color,
            fillColor: color,
            opacity: 0.7,
            fillOpacity: 0.5,
          });
        },
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
        style: (feature) => {
          const color = feature.properties?.wktColor?.value || DEFAULT_COLOR;
          return {
            color: color,          // Line/Polygon border color
            fillColor: color,      // Polygon fill color
            weight: 2,             // Line/Polygon border thickness
            opacity: 0.7,          // Line/Polygon border opacity
            fillOpacity: 0.5       // Polygon fill opacity
          };
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

  /**
   * Return an element used as a icon for the plugin.
   * @returns {HTMLElement}
   */
  getIcon() {
    const icon = document.createElement('div');
    icon.innerHTML = '🌍';
    return icon;
  }

  /**
   * Check whether current results contain supported geometry columns.
   * @returns {boolean}
   */
  canHandleResults() {
    this.updateColumns();
    return this.geometryColumns && this.geometryColumns.length > 0;
  }
}

export default GeoPlugin;
