
const envFound = require('dotenv').config({ path: __dirname + "/../../.env" })

if (envFound.error) {
	throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

module.exports =  {
}