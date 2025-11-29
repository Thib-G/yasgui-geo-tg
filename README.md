# yasgui-geo-tg

A geographic extension for YASGUI. This plugin allows the visualisation of SPARQL results on a map.
It depends on [Leaflet](https://leafletjs.com/) and now uses [betterknown](https://github.com/placemark/betterknown) instead of [wellknown](https://github.com/mapbox/wellknown).

## Installation

```bash
npm install @zazuko/yasgui
npm install git+https://github.com/Thib-G/yasgui-geo-tg.git
```

## Description

This package extends the YASGUI (Yet Another SPARQL GUI) interface with geographic data visualization capabilities.

## Features

- Geographic data visualization
- Integration with YASGUI
- On-the-fly reprojection using proj4 (and automatic fetching of epsg.io for unknown SRIDs).

## Usage: minimal example using vite
Create a new vite app using

```bash
npm create vite@latest yasgui-geo-demo -- --template vanilla
cd yasgui-geo-demo
```

Copy/replace the files in the created folder (you can remove unuseful files created by vite but keep at least package.json):

`./index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Yasgui with geo plugin</title>
    <style>
      html {
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="yasgui"></div>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>
```

`./src/main.js`:
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

Install dependencies and run development server:
```bash
npm install @zazuko/yasgui
npm install git+https://github.com/Thib-G/yasgui-geo-tg.git
```

```bash
npm run dev
```


## Demo

- You can try it here: https://linked-data.goelff.be/yasgui/
- Or click [HERE](<https://linked-data.goelff.be/yasgui/#query=PREFIX%20gsp%3A%20%3Chttp%3A%2F%2Fwww.opengis.net%2Font%2Fgeosparql%23%3E%0APREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0APREFIX%20xyz%3A%20%3Chttp%3A%2F%2Fsparql.xyz%2Ffacade-x%2Fdata%2F%3E%0APREFIX%20fx%3A%20%3Chttp%3A%2F%2Fsparql.xyz%2Ffacade-x%2Fns%2F%3E%0A%0ASELECT%20*%20WHERE%20%0A%7B%0A%20%20FILTER%20(%3Fshort_name_iso2%20!%3D%20'RU')%0A%20%20%7B%20%20%20%20%0A%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20(STRDT(CONCAT(%22POLYGON(%22%2CGROUP_CONCAT(CONCAT(%3Fcoordinate_string)%3B%20SEPARATOR%3D%22%2C%20%22)%2C%22)%22)%2C%20gsp%3AwktLiteral)%20AS%20%3Fwkt)%0A%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fpolygon_index%20(CONCAT(%22(%22%2CGROUP_CONCAT(CONCAT(%3Fwkt_coordinate)%3B%20SEPARATOR%3D%22%2C%20%22)%2C%22)%22)%20AS%20%3Fcoordinate_string)%0A%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20SERVICE%20%3Cx-sparql-anything%3Alocation%3A%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20fx%3Aproperties%20fx%3Alocation%20%22https%3A%2F%2Fraw.githubusercontent.com%2FleakyMirror%2Fmap-of-europe%2Frefs%2Fheads%2Fmaster%2FGeoJSON%2Feurope.geojson%22%20%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20fx%3Amedia-type%20%20%22application%2Fjson%22%20.%09%0A%20%20%20%20%20%20%20%20%20%20%3Fs%20xyz%3Atype%20%22Feature%22%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3Ageometry%20%3Fgeom%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3Aproperties%20%3Fprops.%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fprops%20xyz%3ANAME%20%3Fname%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3AFIPS%20%3Fshort_name_fips%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3AISO2%20%3Fshort_name_iso2%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3AISO3%20%3Fshort_name_iso3.%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fgeom%20xyz%3Atype%20%3Fwkt_type%3B%0A%20%20%20%20%20%20%20%20%20%20xyz%3Acoordinates%20%3Fmulti_polygon.%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fmulti_polygon%20%3Flist_polygon_element%20%3Fpolygon%20.%0A%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_polygon_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fpolygon_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fpolygon%20%3Flist_coordinate_element%20%3Fcoordinate%20.%0A%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_coordinate_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fcoordinate_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%3Fcoordinate%20rdf%3A_1%20%3Flongitude%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20rdf%3A_2%20%3Flatitude.%0A%0A%20%20%20%20%20%20%20%20%20%20BIND%20(CONCAT(str(%3Flongitude)%2C%20%22%20%22%2C%20str(%3Flatitude))%20AS%20%3Fwkt_coordinate)%20%20%0A%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20FILTER%20(str(%3Fwkt_type)%20%3D%20%22Polygon%22)%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fpolygon_index%0A%20%20%20%20%20%20ORDER%20BY%20%3Fcoordinate_index%20%0A%20%20%20%20%7D%0A%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%0A%20%20%20%20ORDER%20BY%20%3Fpolygon_index%20%0A%20%20%7D%0A%20%20UNION%0A%20%20%7B%0A%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20(STRDT(CONCAT(%22MULTIPOLYGON(%22%2CGROUP_CONCAT(CONCAT(%3Fpolygon_string)%3B%20SEPARATOR%3D%22%2C%20%22)%2C%22)%22)%2C%20gsp%3AwktLiteral)%20AS%20%3Fwkt)%0A%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fmultipolygon_index%20(CONCAT(%22(%22%2CGROUP_CONCAT(CONCAT(%3Fcoordinate_string)%3B%20SEPARATOR%3D%22)%2C%20(%22)%2C%22)%22)%20AS%20%3Fpolygon_string)%0A%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20SELECT%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fmultipolygon_index%20%3Fpolygon_index%20(CONCAT(%22(%22%2CGROUP_CONCAT(CONCAT(%3Fwkt_coordinate)%3B%20SEPARATOR%3D%22%2C%20%22)%2C%22)%22)%20AS%20%3Fcoordinate_string)%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20SERVICE%20%3Cx-sparql-anything%3Alocation%3A%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20fx%3Aproperties%20fx%3Alocation%20%22https%3A%2F%2Fraw.githubusercontent.com%2FleakyMirror%2Fmap-of-europe%2Frefs%2Fheads%2Fmaster%2FGeoJSON%2Feurope.geojson%22%20%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20fx%3Amedia-type%20%20%22application%2Fjson%22%20.%09%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fs%20xyz%3Atype%20%22Feature%22%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3Ageometry%20%3Fgeom%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3Aproperties%20%3Fprops.%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fprops%20xyz%3ANAME%20%3Fname%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3AFIPS%20%3Fshort_name_fips%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3AISO2%20%3Fshort_name_iso2%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3AISO3%20%3Fshort_name_iso3.%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fgeom%20xyz%3Atype%20%3Fwkt_type%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20xyz%3Acoordinates%20%3Fmulti_polygon_collection.%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fmulti_polygon_collection%20%3Flist_multipolygon_element%20%3Fmulti_polygon.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_multipolygon_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fmultipolygon_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fmulti_polygon%20%3Flist_polygon_element%20%3Fpolygon%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_polygon_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fpolygon_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fpolygon%20%3Flist_coordinate_element%20%3Fcoordinate%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(xsd%3Ainteger(replace(STR(%3Flist_coordinate_element)%2C'http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23_'%2C''))%20AS%20%3Fcoordinate_index)%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fcoordinate%20rdf%3A_1%20%3Flongitude%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20rdf%3A_2%20%3Flatitude.%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(CONCAT(str(%3Flongitude)%2C%20%22%20%22%2C%20str(%3Flatitude))%20AS%20%3Fwkt_coordinate)%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20FILTER%20(str(%3Fwkt_type)%20%3D%20%22MultiPolygon%22)%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fmultipolygon_index%20%3Fpolygon_index%0A%20%20%20%20%20%20%20%20ORDER%20BY%20%3Fcoordinate_index%20%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%20%3Fmultipolygon_index%0A%20%20%20%20%20%20ORDER%20BY%20%3Fpolygon_index%20%0A%20%20%20%20%7D%0A%20%20%20%20GROUP%20BY%20%3Fname%20%3Fshort_name_fips%20%3Fshort_name_iso2%20%3Fshort_name_iso3%0A%20%20%20%20ORDER%20BY%20%3Fmultipolygon_index%20%0A%20%20%7D%0A%7D&endpoint=https%3A%2F%2Flinked-data.goelff.be%2Fsparql.anything&requestMethod=POST&tabTitle=Query&headers=%7B%7D&contentTypeConstruct=application%2Fn-triples%2C*%2F*%3Bq%3D0.9&contentTypeSelect=application%2Fsparql-results%2Bjson%2C*%2F*%3Bq%3D0.9&outputFormat=geo&outputSettings=%7B%7D>) to see [MathiasVDA](https://github.com/MathiasVDA)'s [crazy query](crazy-query.sparql) to convert a geojson file to RDF and then to `http://www.opengis.net/ont/geosparql#wktLiteral` using [Sparql Anything](https://github.com/SPARQL-Anything/sparql.anything).

![Crazy Query](crazy-query.png 'Crazy Query')

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Thibaut Goelff
