import React from "react"
import secrets from "../../secrets.json"
import ReactMapGL, { Popup } from "react-map-gl"
import { groupBy, filter, assoc, assocPath, compose } from "ramda"
import { Slider } from "@material-ui/core"

import {
  events,
  filterConfig,
  defaultMapStyle,
  DEFAULT_BLUE,
} from "./mapConfigs"
import counties from "../../../eData.json"
import Layout from "../components/layout"
import SEO from "../components/seo"

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

const Checkbox = props => (
  <div>
    <input {...props} style={{ marginRight: "10px" }} type="checkbox" />
    <label>{props.label}</label>
  </div>
)

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

const TimelineSegment = ({ eventName, basis, active }) => (
  <div style={{ flexBasis: basis }} className="start inner-timeline">
    <div style={{ width: "100%", height: "50%", wordBreak: "break-word" }}>
      {eventName}
    </div>
    <div
      style={{
        width: "100%",
        height: "50%",
        borderTopStyle: "solid",
        borderColor: active ? "red" : "black",
      }}
    />
  </div>
)

class IndexPage extends React.Component {
  MIN = "1617"
  MAX = "2013"
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
        <SEO title="Home" keywords={[`gatsby`, `application`, `react`]} />
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
              <b>{this.state.year}</b>
            </div>
            <div>
              <input
                type="range"
                min="1617"
                max="2013"
                onChange={e => {
                  this.setState({ year: e.target.value })
                }}
                value={this.state.year}
                id="myRangeTop"
              />
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
        <div className="timeline">
          {events.map(e => {
            const percentage =
              (e.end - e.start) / (parseInt(this.MAX) - parseInt(this.MIN))
            console.log(percentage * 100 + "%")
            return (
              <TimelineSegment
                eventName={e.name}
                active={this.state.year >= e.start && this.state.year <= e.end}
                basis={percentage * 100 + "%"}
              />
            )
          })}
          <input
            style={{ width: "100%", position: "absolute", top: "20px" }}
            type="range"
            min={this.MIN}
            max={this.MAX}
            onChange={e => {
              this.setState({ year: e.target.value })
            }}
            value={this.state.year}
            id="myRange"
          />
        </div>
        <div
          style={{
            width: "100%",
            position: "absolute",
            bottom: "7.4vh",
            position: "relative",
          }}
        />
      </Layout>
    )
  }
}

export default IndexPage
