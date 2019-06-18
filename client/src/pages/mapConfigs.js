const DEFAULT_BLUE = "#3399ff"

const filterConfig = [
  {
    key: "Spanish",
    color: "#e1ff00",
    label: "Spanish",
  },
  {
    key: "English",
    color: "#ff0000",
  },
  {
    key: undefined,
    color: DEFAULT_BLUE,
  },
  {
    key: "Native American",
    color: "#00ffff",
  },
  {
    key: "French",
    color: "#ff00ff",
  },
  {
    key: "Civil War",
    color: "#ffffff",
  },
  {
    key: "Dutch",
    color: "#ff9d00",
  },
  {
    key: "German",
    color: "#4cc600",
  },
]

const defaultMapStyle = {
  version: 8,
  sprite: "mapbox://sprites/mapbox/basic-v8",
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  metadata: {
    "mapbox:autocomposite": true,
  },
  sources: {
    "mapbox-satellite": {
      type: "raster",
      url: "mapbox://mapbox.satellite",
      tileSize: 256,
    },
    mapbox: {
      url: "mapbox://mapbox.mapbox-streets-v8",
      type: "vector",
    },
    counties: {
      type: "vector",
      url: "mapbox://mapbox.82pkq93d",
    },
  },
  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "mapbox-satellite",
    },
    {
      id: "street",
      type: "line",
      source: "mapbox",
      "source-layer": "admin",
    },
    {
      id: "water",
      type: "fill",
      source: "mapbox",
      "source-layer": "water",
      paint: {
        "fill-color": "#a0cfdf",
      },
    },
    {
      id: "counties",
      interactive: true,
      type: "fill",
      source: "counties",
      "source-layer": "original",
      paint: {
        "fill-outline-color": "rgba(0,0,0,0.1)",
        "fill-color": "rgba(0,0,0,0.1)",
      },
    },
    {
      id: "counties-highlighted",
      type: "fill",
      source: "counties",
      "source-layer": "original",
      paint: {
        "fill-outline-color": DEFAULT_BLUE,
        "fill-color": "#6e599f",
        "fill-opacity": 0.5,
      },
      filter: ["in", "FIPS"],
    },
    {
      id: "names",
      type: "symbol",
      source: "mapbox",
      layout: {
        "text-field": "{name_en}",
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      },
      filter: [
        "all",
        ["==", "$type", "Point"],
        ["in", "type", "state", "county", "city"],
      ],
      paint: {
        "text-color": "#ffffff",
      },
      "source-layer": "place_label",
    },
  ],
}

const events = [
  {
    name: "Start",
    start: 1617,
    end: 1657,
  },
  {
    name: "Mid",
    start: 1658,
    end: 1899,
  },
  {
    name: "End",
    start: 1900,
    end: 2013,
  },
]

export { events, defaultMapStyle, filterConfig, DEFAULT_BLUE }
