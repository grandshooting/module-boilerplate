const mongoose = require("mongoose")

module.exports = async () => {
    mongoose.set('debug', true)

    const connection = await mongoose.connect(process.env.DATABASE_URI)

    return connection?.connection?.db
}