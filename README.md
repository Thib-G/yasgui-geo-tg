# yasgui-geo-tg

A geographic extension for YASGUI. This plugin allows the visualisation of SPARQL results on a map.
It depends on [Leaflet](https://leafletjs.com/) and [wellknown](https://github.com/mapbox/wellknown).

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

## Usage

```javascript
import "@zazuko/yasgui/build/yasgui.min.css";
import Yasgui from "@zazuko/yasgui";

import GeoPlugin from "yasgui-geo-tg";

//Register the plugin to Yasr
Yasgui.Yasr.registerPlugin("geo", GeoPlugin);

const yasgui = new Yasgui(document.getElementById("yasgui"), {
  // Set the SPARQL endpoint
  requestConfig: {
    endpoint: "https://dbpedia.org/sparql",
  },
  yasr: {
    pluginOrder: ["table", "response", "geo"], // Enable geo plugin alongside default table
    defaultPlugin: "geo",
  },
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Thibaut Goelff
