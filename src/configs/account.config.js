module.exports = (account_id) => {
    try {
        const config = require("./accounts/" + account_id)

        return config
    } catch (err) {
        console.log('cant load config file for account ' + account_id)
    }

    return null
}