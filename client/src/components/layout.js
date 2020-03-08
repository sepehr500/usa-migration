/**
 * Layout component that queries for data
 * with Gatsby's StaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/static-query/
 */

import React, { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { StaticQuery, graphql } from "gatsby"
import Link from "gatsby-link"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

import Header from "./header"
import "./layout.css"
import {
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Icon,
  MenuItem,
  Modal,
} from "@material-ui/core"
import { GitHub } from "@material-ui/icons"

const MySwal = withReactContent(Swal)

const Layout = ({ children }) => {
  const [isOpen, setOpen] = useState(false)
  const handleClose = () => {
    setOpen(false)
  }
  useEffect(() => {
    if (sessionStorage.getItem("hideModal")) {
      return
    }
    MySwal.fire({
      title: "United States Country Establishment Map",
      onClose: () => {
        console.log("CLOSED")

        sessionStorage.setItem("hideModal", true)
      },
      html: (
        <p>
          This app lets you view the establishment of counties through time. Use
          the slider to select the year. Hover over the county to see the origin
          of the county name.
        </p>
      ),
    })
  }, [])
  return (
    <StaticQuery
      query={graphql`
        query SiteTitleQuery {
          site {
            siteMetadata {
              title
            }
          }
        }
      `}
      render={data => (
        <div>
          <div
            style={{
              margin: `0 auto`,
              paddingTop: 0,
            }}
          >
            <AppBar position="static">
              <Toolbar>
                <Typography variant="h6">
                  United States County Establishment Map
                </Typography>
              </Toolbar>
            </AppBar>
            <main>{children}</main>
          </div>
          <div style={{ position: "fixed", bottom: "0", right: "21px" }}>
            <a
              href="https://github.com/sepehr500/usa-migration"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHub />
            </a>
            <a
              href="https://github.com/sepehr500/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ position: "fixed", bottom: "6px", right: "58px" }}
            >
              contact me
            </a>
          </div>
        </div>
      )}
    />
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
