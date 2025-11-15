# yasgui-geo-tg

A geographic extension for YASGUI. This plugin allows the visualisation of SPARQL results on a map.
It depends on [Leaflet](https://leafletjs.com/) and [wellknown](https://github.com/mapbox/wellknown).

## Installation

```bash
npm install leaflet
npm install betterknown
npm install @zazuko/yasgui
npm install git+https://github.com/Thib-G/yasgui-geo-tg.git
```

## Description

This package extends the YASGUI (Yet Another SPARQL GUI) interface with geographic data visualization capabilities.

## Features

- Geographic data visualization
- Integration with YASGUI
- Supports multiple coordinates systems

## Usage

```javascript
import '@zazuko/yasgui/build/yasgui.min.css';
import Yasgui from '@zazuko/yasgui';

import GeoPlugin from 'yasgui-geo-tg';

//Register the plugin to Yasr
Yasgui.Yasr.registerPlugin('geo', GeoPlugin);

const yasgui = new Yasgui(document.getElementById('yasgui'), {
  // Set the SPARQL endpoint
  requestConfig: {
    endpoint: 'https://dbpedia.org/sparql',
  },
  yasr: {
    pluginOrder: ['table', 'response', 'geo'], // Enable geo plugin alongside default table
    defaultPlugin: 'geo',
  },
});
```

## Coordinate Transformations

- **Supported SRIDs (embedded):** `4326`, `3857`, `31370`, `4258`, `3035`, `25832`, `25833`.
- **Behavior:** The plugin accepts WKT literals (and Geosparql WKT strings) and will:
  - Normalize URI-based CRS like `<http://.../4326> POINT(...)` into `SRID=4326;POINT(...)`.
  - Drop the special CRS URI `<http://www.opengis.net/def/crs/OGC/1.3/CRS84>` because CRS84 is the WKT default (longitude,latitude).
  - When a WKT specifies `SRID=4326`, the implementation assumes the WKT coordinates follow the standard with latitude-first order (axis order lat,lon) and automatically swaps them to longitude-first when producing GeoJSON (GeoJSON expects `[lon, lat]`).
  - If a source SRID differs from `4326`, the plugin will reproject geometries to `EPSG:4326` when a proj4 definition is available.

## Auto-loading proj4 Definitions

- The package includes embedded proj4 definitions for common SRIDs listed above and registers them at module initialization.
- For SRIDs not embedded, the helper `ensureProjDef(srid)` can be used to fetch a proj4 definition from `https://epsg.io/<srid>.proj4` and register it with `proj4` at runtime. After fetching, re-render the plugin (call the plugin's `draw()` or `updateMap()` method) to apply reprojection.

API notes:

- `ensureProjDef(srid)`: Async helper to fetch and register a proj4 definition for a numeric SRID (exported).

Example (in application code):

```javascript
import { ensureProjDef } from 'yasgui-geo-tg';
// ensure EPSG:25832 is registered, then redraw the plugin
await ensureProjDef('25832');
geoPlugin.draw();
```

## Development & Testing

- Install dependencies:

```bash
npm install
```

- Run the local dev server (uses `vite`):

```bash
npm run dev
```

- Build and preview the demo:

```bash
npm run build:demo
npm run preview:demo
```

Notes for testing reprojection behavior:

- Provide WKT literals with the CRS URI form: e.g. `<http://www.opengis.net/def/crs/EPSG/0/25832> POINT(500000 5700000)` and ensure the SRID is registered (see `ensureProjDef`).
- For `SRID=4326;POINT(lat lon)` inputs, the library treats the numbers as latitude then longitude and will swap them to produce valid GeoJSON `[lon, lat]`.
- If reprojection doesn't happen immediately for a non-embedded SRID, call `await ensureProjDef('<srid>')` and then re-run the plugin draw to apply reprojection.

## Using the Minified Bundle in a Browser (HTML/JS)

After building the project (or downloading the release assets), you can include the minified IIFE bundle directly in a plain HTML page. The bundle exposes the plugin on a global variable named `YasguiGeoTg` (or `YasguiGeoTg.default` depending on how the bundler/runtime handles default exports).

Minimal example:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>YASGUI Geo Demo</title>
    <!-- Leaflet CSS & JS (from CDN) -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <!-- YASGUI CSS & JS (from CDN or local build) -->
    <link rel="stylesheet" href="https://unpkg.com/@zazuko/yasgui@4.6.0/build/yasgui.min.css" />
    <script src="https://unpkg.com/@zazuko/yasgui@4.6.0/dist/yasgui.min.js"></script>
  </head>
  <body>
    <div id="yasgui" style="height:600px"></div>

    <!-- Plugin bundle built with esbuild -->
    <script src="/dist/yasgui-geo-tg.min.js"></script>

    <script>
      // The bundle exposes the plugin constructor on window.YasguiGeoTg
      const GeoPlugin = window.YasguiGeoTg && (window.YasguiGeoTg.default || window.YasguiGeoTg);

      // Register the plugin with YASR before creating Yasgui
      Yasgui.Yasr.registerPlugin('geo', GeoPlugin);

      const yasgui = new Yasgui(document.getElementById('yasgui'), {
        requestConfig: { endpoint: 'https://dbpedia.org/sparql' },
        yasr: { pluginOrder: ['table', 'response', 'geo'], defaultPlugin: 'geo' },
      });
    </script>
  </body>
</html>
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Thibaut Goelff
