const express = require('express')
const cors = require('cors')
const app = express()
const items = require('./routes/items.js');
const orders = require('./routes/orders.js');
const { getRequestOptions } = require('./utils/getRequestOptions.js');
require('dotenv').config()

const resquestOptions = getRequestOptions();

app.use(cors())

app.use('/items', items)

app.use('/orders', orders)

app.get('/', function (req, res) {
    res.json({ msg: 'This is CORS-enabled for all origins!' })
})

app.listen(process.env.PORT, function () {
    console.log('CORS-enabled web server listening on port 3000')
})

export default app;