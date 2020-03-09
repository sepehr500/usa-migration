import React from "react"
import secrets from "../../secrets.json"
import ReactMapGL, { Popup } from "react-map-gl"
import { groupBy, filter, assoc, assocPath, compose } from "ramda"
import { Checkbox as Box, Slider as Slide } from "@material-ui/core"

import counties from "../../../eData.json"
import Layout from "../components/layout"
import SEO from "../components/seo"

const DEFAULT_BLUE = "#3399ff"

const groupedByYear = groupBy(x => x.established, counties)

const memoize = fn => {
  const cache = {}
  return function(...input) {
    if (cache[input.toString()]) {
      return cache[input.toString()]
    }
    const result = fn(...input)
    cache[input.toString()] = result
    return result
  }
}

function flatten(arr) {
  let newArr = []
  arr &&
    arr.forEach(a => {
      if (a instanceof Array) {
        newArr = newArr.concat(flatten(a))
      } else {
        newArr.splice(newArr.length, 0, a)
      }
    })
  return newArr
}

const calculateFips = memoize((year, country) => {
  const newFips = flatten(
    Object.keys(groupedByYear)
      .filter(yr => yr <= year)
      .map(x => groupedByYear[x])
  )
    .filter(x => x.lang === country)
    // Need to do this because Mapbox treats fips that don't start with 0 as int not strings
    .map(x => (x.fips[0] === "0" ? x.fips : parseInt(x.fips)))
  return newFips
})

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

const Checkbox = props => (
  <div style={{ display: "flex", alignItems: "center" }}>
    <Box
      {...props}
      style={{ marginRight: "5px" }}
      type="checkbox"
      color="primary"
    />
    <div style={{ display: "inline-block" }}>
      <label>{props.label}</label>
    </div>
  </div>
)

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
      zoom: 3.5,
      minZoom: 2,
      bearing: 0,
      pitch: 0,
    },
    year: 1776,
    mapStyle: defaultMapStyle,
    hoverInfo: null,
  }

  setFilter = year => {
    const appendToMapStyle = (country, color, mapStyle) => {
      const newFips = calculateFips(year, country)
      return assocPath(
        ["layers"],
        mapStyle.layers.concat(
          baseSpecialLayer(
            country,
            this.state[country] ? color : DEFAULT_BLUE,
            newFips
          )
        ),
        mapStyle
      )
    }

    return filterConfig.reduce(
      (prev, curr) => appendToMapStyle(curr.key, curr.color, prev),
      defaultMapStyle
    )
  }

  componentDidMount() {
    const newViewport = Object.assign(this.state.viewport, {
      height: window.innerHeight,
    })
    this.setState({ viewport: newViewport })
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
        county: counties.find(
          x =>
            (x.fips[0] === "0" ? x.fips : parseInt(x.fips)) ===
            county.properties.FIPS
        ),
      }
      countyName = county.properties.COUNTY
    }
    console.log(
      county &&
        JSON.stringify(
          counties.find(
            x =>
              (x.fips[0] === "0" ? x.fips : parseInt(x.fips)) ===
              county.properties.FIPS
          )
        )
    )
    this.setState({
      hoverInfo,
    })
  }
  renderPopup() {
    const { hoverInfo } = this.state
    if (hoverInfo && hoverInfo.county) {
      return (
        <Popup
          longitude={hoverInfo.lngLat[0]}
          latitude={hoverInfo.lngLat[1]}
          closeButton={false}
        >
          <div className="county-info">
            <b>{hoverInfo.county.name}</b>
          </div>
          <div className="county-info">
            {hoverInfo.county.etymology && hoverInfo.county.etymology}
          </div>
        </Popup>
      )
    }
    return null
  }

  render() {
    return (
      <Layout>
        <SEO title="County Timeline" keywords={["County Timeline"]} />
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              zIndex: "10",
              borderRadius: "14px",
              background: "rgb(239, 239, 239)",
              marginLeft: "7px",
              marginTop: "11px",
              padding: "1rem",
              boxShadow:
                "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
            }}
          >
            <div style={{ color: "black", fontSize: "20px" }}>
              <div>Drag to change year: </div>
              <div style={{ padding: "10px 0", fontSize: "32px" }}>
                <b>{this.state.year}</b>
              </div>
            </div>
            <div>
              <Slide
                min={1617}
                max={2013}
                onChange={(e, val) => {
                  this.setState({ year: val })
                }}
                value={parseInt(this.state.year)}
                id="myRange"
              />
              <div className="hidden-small">
                <p>
                  <b>Select Country name origin (beta)</b>
                </p>
                {filterConfig.map(
                  x =>
                    x.key && (
                      <Checkbox
                        label={x.key}
                        value={this.state[x.key]}
                        onClick={e =>
                          this.setState({ [x.key]: e.target.checked })
                        }
                      />
                    )
                )}
              </div>
            </div>
          </div>
        </div>
        <ReactMapGL
          width={"100%"}
          height={900}
          onHover={this._onHover}
          mapStyle="mapbox://styles/mapbox/dark-v9"
          // Map style is not stored in state
          // It is calculated off the year
          mapStyle={this.setFilter(this.state.year, groupedByYear)}
          mapboxApiAccessToken={secrets.mapboxKey}
          {...this.state.viewport}
          onViewportChange={viewport => this.setState({ viewport })}
        >
          {this.renderPopup()}
        </ReactMapGL>
      </Layout>
    )
  }
}

export default IndexPage
