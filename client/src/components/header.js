import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import { Button } from "@material-ui/core"

const Header = ({ siteTitle }) => (
  <header
    style={{
      background: "#0029ffbd",
    }}
  >
    <div
      style={{
        textAlign: "center",
        padding: "17px",
      }}
    >
      <h1 style={{ margin: 0 }}>
        <span
          to="/"
          style={{
            color: `white`,
            textDecoration: `none`,
          }}
        >
          {siteTitle}
        </span>
      </h1>
    </div>
    <div className="hidden-small">
      <Button className="hidden-small">About</Button>
    </div>
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
