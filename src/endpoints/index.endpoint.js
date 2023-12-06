const { endpoints: pictureEndpoints } = require("./picture.endpoint")
const express = require("express")

module.exports = (expressApp) => {
    expressApp.use(express.json())
    expressApp.use(express.urlencoded({ extended: true }))
    expressApp.get('/status', (req, res) => { res.status(200).end() })
    expressApp.head('/status', (req, res) => { res.status(200).end() })

    pictureEndpoints(expressApp)

    expressApp.use('/*', (req, res) => {
        console.log(req.method + ' /404', req.protocol + '://' + req.get('host') + req.originalUrl)
        res.sendStatus(404)
    })
}