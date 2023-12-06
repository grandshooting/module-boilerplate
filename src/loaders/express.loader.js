const express = require('express')

module.exports =  async () => {
    const app = express()
    const port = process.env.PORT || 4147
      
    app.listen(port, () => {
        console.log(`Webhook app listening at http://localhost:${port}`)
    })

    return app
}