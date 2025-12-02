# yasgui-geo-tg

A geographic extension for YASGUI. This plugin allows the visualisation of SPARQL results on a map.
It depends on [Leaflet](https://leafletjs.com/) and now uses [betterknown](https://github.com/placemark/betterknown) instead of [wellknown](https://github.com/mapbox/wellknown).

## Description

This package extends the YASGUI (Yet Another SPARQL GUI) interface with geographic data visualization capabilities.

## Features

- Geographic data visualization
- Integration with YASGUI
- On-the-fly reprojection using proj4 (and automatic fetching of epsg.io for unknown SRIDs).

## Getting started

### Installation of dependencies

You need to have a YasGUI installed. You can use [@zazuko/yasgui](https://www.npmjs.com/package/@zazuko/yasgui) or [yasgui](https://www.npmjs.com/package/yasgui). See instructions on their respective pages to get started with that package.

```bash
npm install @zazuko/yasgui
npm install git+https://github.com/Thib-G/yasgui-geo-tg.git
```

### Registering plugin with Yasgui

```js
import GeoPlugin from 'yasgui-geo-tg';
import '@zazuko/yasgui/build/yasgui.min.css';
import Yasgui from '@zazuko/yasgui';

//Register the plugin to Yasr
Yasgui.Yasr.registerPlugin('geo', GeoPlugin);
```

### Use the plugin with Yasgui

Launch any SPARQL query on a GeoSPARQL enabled endpoint returning geometries as WKT literals (http://www.opengis.net/ont/geosparql#wktLiteral) and select the "geo" plugin in the results area.

Here's an example SPARQL query:

```sparql
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX spatialf: <http://jena.apache.org/function/spatial#>

# Test transforming between coordinate systems using Jena vendor functions
SELECT * WHERE {  
  VALUES (?name ?lat ?lon ?wktColor) {
    ("Antwerpen Centraal" 51.2133 4.4231 "blue")
    ("Charleroi Central" 50.4050 4.4396 "red")
    ("Leuven Station" 50.8830 4.7147 "green")
  }
  # Create point geometry from coordinates
  BIND(STRDT(CONCAT("POINT(", STR(?lon), " ", STR(?lat), ")"), geo:wktLiteral) AS ?point_no_crs_defined)
  BIND(STRDT(CONCAT("SRID=4326;POINT(", STR(?lon), " ", STR(?lat), ")"), geo:wktLiteral) AS ?point_ewkt_4326)
  BIND(STRDT(CONCAT("<http://www.opengis.net/def/crs/EPSG/0/4326> POINT(", STR(?lat), " ", STR(?lon), ")"), geo:wktLiteral) AS ?point_opengis_4326)
  BIND(spatialf:transformSRS(?point_opengis_4326, "http://www.opengis.net/def/crs/EPSG/0/25831") AS ?point_utm_zone_31N)
  BIND(spatialf:transformSRS(?point_opengis_4326, "http://www.opengis.net/def/crs/EPSG/0/31370") AS ?point_lambert_belge_72)
  BIND(?name AS ?wktTooltip)
  BIND(CONCAT("Station: ", ?name) AS ?wktLabel)
}
```

### Alternative: Using the Minified Bundle in a Browser (HTML/JS)

After building the project (or downloading the release assets), you can include the minified IIFE bundle directly in a plain HTML page. The bundle exposes the plugin on a global variable named `YasguiGeoTg` (or `YasguiGeoTg.default` depending on how the bundler/runtime handles default exports).

Minimal example:

```html
<!doctype html>
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
        yasr: { pluginOrder: ['table','response','geo'], defaultPlugin: 'geo' },
      });
    </script>
  </body>
</html>
```

## Development & testing

In order to test and develop the plugin, you can use the demo environment provided.

Clone this repository locally and install its dependencies: 

```bash
npm install
```

Then run the local dev server (uses `vite`):

```bash
npm run dev
```

Then go to `http://localhost:5173/demo/index.html` to see the demo. This environment will be updated while you make changes to the code. You can also add this configuration in VS Code (in .vscode/launch.json) to launch the demo directly from the debugger:

```json
{
  "version": "0.2.0",
  "configurations": [
      {
          "type": "msedge",
          "request": "launch",
          "name": "Launch Demo",
          "url": "http://localhost:5173/demo/index.html",
          "webRoot": "${workspaceFolder}"
      }
  ]
}
```

## Online demo

- You can try it here: https://linked-data.goelff.be/yasgui/
- Or click [HERE](<https://linked-data.goelff.be/yasgui/#query=PREFIX%20gsp%3A%20%3Chttp%3A%2F%2Fwww.opengis.net%2Font%2Fgeosparql%23%3E%0APREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0APREFIX%20xyz%3A%20%3Chttp%3A%2F%2Fsparql.xyz%2Ffacade-x%2Fdata%2F%3E%0APREFIX%20fx%3A%20%3Chttp%3A%2F%2Fsparql.xyz%2Ffacade-x%2Fns%2F%3E%0A%0ASELECT%20*%20WHERE%20%0A%7B%0A%20%20FILTER%20(%3Fshort_name_iso2%20!%3D%20'RU')%0A%20%20%7B%20%20%20%20%0A%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20(STRDT(CONCAT(%22POLYGON(%22%2CGROUP_CONCAT(CONCAT(%3Fcoordinate_string)%3B%20SEPARATOR%3D%22%2C%20%22)%2C%22)%22)%2C%20gsp%3AwktLiteral)%20AS%20%3Fwkt)%0A%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fpolygon_index%20(CONCAT(%22(%22%2CGROUP_CONCAT(CONCAT(%3Fwkt_coordinate)%3B%20SEPARATOR%3D%22%2C%20%22)%2C%22)%22)%20AS%20%3Fcoordinate_string)%0A%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20SERVICE%20%3Cx-sparql-anything%3Alocation%3A%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20fx%3Aproperties%20fx%3Alocation%20%22https%3A%2F%2Fraw.githubusercontent.com%2FleakyMirror%2Fmap-of-europe%2Frefs%2Fheads%2Fmaster%2FGeoJSON%2Feurope.geojson%22%20%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20fx%3Amedia-type%20%20%22application%2Fjson%22%20.%09%0A%20%20%20%20%20%20%20%20%20%20%3Fs%20xyz%3Atype%20%22Feature%22%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3Ageometry%20%3Fgeom%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3Aproperties%20%3Fprops.%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fprops%20xyz%3ANAME%20%3Fname%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3AFIPS%20%3Fshort_name_fips%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3AISO2%20%3Fshort_name_iso2%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3AISO3%20%3Fshort_name_iso3.%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fgeom%20xyz%3Atype%20%3Fwkt_type%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3Acoordinates%20%3Fmulti_polygon.%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fmulti_polygon%20%3Flist_polygon_element%20%3Fpolygon%20.%0A%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_polygon_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fpolygon_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fpolygon%20%3Flist_coordinate_element%20%3Fcoordinate%20.%0A%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_coordinate_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fcoordinate_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fcoordinate%20rdf%3A_1%20%3Flongitude%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20rdf%3A_2%20%3Flatitude.%0A%0A%20%20%20%20%20%20%20%20%20%20BIND%20(CONCAT(str(%3Flongitude)%2C%20%22%20%22%2C%20str(%3Flatitude))%20AS%20%3Fwkt_coordinate)%20%20%0A%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20FILTER%20(str(%3Fwkt_type)%20%3D%20%22Polygon%22)%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fpolygon_index%0A%20%20%20%20%20%20ORDER%20BY%20%3Fcoordinate_index%20%0A%20%20%20%20%7D%0A%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%0A%20%20%20%20ORDER%20BY%20%3Fpolygon_index%20%0A%20%20%7D%0A%20%20UNION%0A%20%20%7B%0A%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20(STRDT(CONCAT(%22MULTIPOLYGON(%22%2CGROUP_CONCAT(CONCAT(%3Fpolygon_string)%3B%20SEPARATOR%3D%22%2C%20%22)%2C%22)%22)%2C%20gsp%3AwktLiteral)%20AS%20%3Fwkt)%0A%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fmultipolygon_index%20(CONCAT(%22(%22%2CGROUP_CONCAT(CONCAT(%3Fcoordinate_string)%3B%20SEPARATOR%3D%22)%2C%20(%22)%2C%22)%22)%20AS%20%3Fpolygon_string)%0A%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fmultipolygon_index%20%3Fpolygon_index%20(CONCAT(%22(%22%2CGROUP_CONCAT(CONCAT(%3Fwkt_coordinate)%3B%20SEPARATOR%3D%22%2C%20%22)%2C%22)%22)%20AS%20%3Fcoordinate_string)%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20SERVICE%20%3Cx-sparql-anything%3Alocation%3A%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20fx%3Aproperties%20fx%3Alocation%20%22https%3A%2F%2Fraw.githubusercontent.com%2FleakyMirror%2Fmap-of-europe%2Frefs%2Fheads%2Fmaster%2FGeoJSON%2Feurope.geojson%22%20%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20fx%3Amedia-type%20%20%22application%2Fjson%22%20.%09%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fs%20xyz%3Atype%20%22Feature%22%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3Ageometry%20%3Fgeom%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3Aproperties%20%3Fprops.%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fprops%20xyz%3ANAME%20%3Fname%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3AFIPS%20%3Fshort_name_fips%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3AISO2%20%3Fshort_name_iso2%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3AISO3%20%3Fshort_name_iso3.%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fgeom%20xyz%3Atype%20%3Fwkt_type%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3Acoordinates%20%3Fmulti_polygon_collection.%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fmulti_polygon_collection%20%3Flist_multipolygon_element%20%3Fmulti_polygon.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_multipolygon_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fmultipolygon_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fmulti_polygon%20%3Flist_polygon_element%20%3Fpolygon%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_polygon_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fpolygon_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fpolygon%20%3Flist_coordinate_element%20%3Fcoordinate%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_coordinate_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fcoordinate_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fcoordinate%20rdf%3A_1%20%3Flongitude%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20rdf%3A_2%20%3Flatitude.%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(CONCAT(str(%3Flongitude)%2C%20%22%20%22%2C%20str(%3Flatitude))%20AS%20%3Fwkt_coordinate)%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20FILTER%20(str(%3Fwkt_type)%20%3D%20%22MultiPolygon%22)%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fmultipolygon_index%20%3Fpolygon_index%0A%20%20%20%20%20%20%20%20ORDER%20BY%20%3Fcoordinate_index%20%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fmultipolygon_index%0A%20%20%20%20%20%20ORDER%20BY%20%3Fpolygon_index%20%0A%20%20%20%20%7D%0A%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%0A%20%20%20%20ORDER%20BY%20%3Fmultipolygon_index%20%0A%20%20%7D%0A%7D&endpoint=https%3A%2F%2Flinked-data.goelff.be%2Fsparql.anything&requestMethod=POST&tabTitle=Query&headers=%7B%7D&contentTypeConstruct=application%2Fn-triples%2C*%2F*%3Bq%3D0.9&contentTypeSelect=application%2Fsparql-results%2Bjson%2C*%2F*%3Bq%3D0.9&outputFormat=geo&outputSettings=%7B%7D>) to see [MathiasVDA](https://github.com/MathiasVDA)'s [crazy query](crazy-query.sparql) to convert a geojson file to RDF and then to `http://www.opengis.net/ont/geosparql#wktLiteral` using [Sparql Anything](https://github.com/SPARQL-Anything/sparql.anything).

![Crazy Query](crazy-query.png 'Crazy Query')

## Coordinate Transformations

- **Supported SRIDs (embedded):** `4326`, `3857`, `31370`, `4258`, `3035`, `25832`, `25833`.
- **Behavior:** The plugin accepts WKT literals (and Geosparql WKT strings) and will following the GeoSPARQL standard. Note that when EPSG:4326 is specified, the coordinate order should be latitude, longitude. When it isn't specified, the order should be longitude, latitude.
- **Auto download of CRS:**  CRS definitions will be automatically downloaded from `https://epsg.io/` when not embedded (see next section).

### Auto-loading proj4 Definitions

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Thibaut Goelff
