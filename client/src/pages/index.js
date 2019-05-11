import React from "react"
import secrets from "../../secrets.json"
import ReactMapGL from "react-map-gl"
import { groupBy, filter, assoc, assocPath, compose } from "ramda"

import counties from "../../../scrapeScript/eData.json"
import Layout from "../components/layout"
import SEO from "../components/seo"

const groupedByYear = groupBy(x => x.established, counties)

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
        // "fill-outline-color": "#0000ff",
        // "fill-opacity": 1,
      },
    },
    {
      id: "counties-highlighted",
      type: "fill",
      source: "counties",
      "source-layer": "original",
      paint: {
        "fill-outline-color": "#0000ff",
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

const baseSpecialLayer = (country, color, codes) => ({
  id: "counties-highlighted-" + country,
  type: "fill",
  source: "counties",
  "source-layer": "original",
  paint: {
    "fill-outline-color": color,
    "fill-color": color,
    "fill-opacity": 0.5,
  },
  filter: ["in", "FIPS"].concat(codes),
})

class IndexPage extends React.Component {
  state = {
    viewport: {
      latitude: 38.88,
      longitude: -98,
      zoom: 3,
      minZoom: 2,
      bearing: 0,
      pitch: 0,
    },
    year: 1750,
    mapStyle: defaultMapStyle,
  }

  setFilter = (year, groupedCounties) => {
    const appendToMapStyle = (country, color) => mapStyle => {
      const newFips = Object.keys(groupedCounties)
        .filter(yr => yr < year)
        .map(x => groupedCounties[x])
        .flat()
        .filter(x => x.lang === country)
        .map(x => (x.fips[0] === "0" ? x.fips : parseInt(x.fips)))
      return assocPath(
        ["layers"],
        mapStyle.layers.concat(baseSpecialLayer(country, color, newFips)),
        mapStyle
      )
    }
    return compose(
      appendToMapStyle("Spanish", "#e1ff00"),
      appendToMapStyle("English", "#ff0000"),
      appendToMapStyle("Native American", "#00ffff"),
      appendToMapStyle("French", "#ff00ff"),
      appendToMapStyle(undefined, "#000000"),
      appendToMapStyle("Dutch", "#ff9d00"),
      appendToMapStyle("Italian", "#4cc600")
    )(defaultMapStyle)
  }

  componentDidMount() {
    this.setFilter(this.state.year, groupedByYear)
  }
  _onHover = event => {
    let countyName = ""
    let hoverInfo = null

    const county =
      event.features && event.features.find(f => f.layer.id === "counties")
    if (county) {
      hoverInfo = {
        lngLat: event.lngLat,
        county: county.properties,
      }
      countyName = county.properties.COUNTY
    }
    console.log(county && county.properties)
    // this.setState({
    //   mapStyle: defaultMapStyle.setIn(
    //     ["layers", highlightLayerIndex, "filter", 2],
    //     countyName
    //   ),
    //   hoverInfo,
    // })
  }

  render() {
    return (
      <Layout>
        <SEO title="Home" keywords={[`gatsby`, `application`, `react`]} />
        <ReactMapGL
          width={1000}
          height={900}
          onHover={this._onHover}
          mapStyle="mapbox://styles/mapbox/dark-v9"
          mapStyle={this.setFilter(this.state.year, groupedByYear)}
          mapboxApiAccessToken={secrets.mapboxKey}
          {...this.state.viewport}
          onViewportChange={viewport => this.setState({ viewport })}
        />
        {this.state.year}
        <div>
          <input
            type="range"
            min="1617"
            max="2013"
            onChange={e => {
              this.setState({ year: e.target.value })
            }}
            value={this.state.year}
            id="myRange"
          />
        </div>
      </Layout>
    )
  }
}

export default IndexPage
