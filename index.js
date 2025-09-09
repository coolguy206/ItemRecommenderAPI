const express = require('express')
const cors = require('cors')
const app = express()
const items = require('./routes/items.js');
const orders = require('./routes/orders.js');
require('dotenv').config()

app.use(cors({ origin: '*' }))

//? get all items
app.get('/test', (req, res) => {
    res.json({ msg: 'This is a test endpoint!' });
});

app.use('/items', items)

app.use('/orders', orders)

app.get('/', function (req, res) {
    res.json({ msg: 'This is CORS-enabled for all origins!' })
})

app.listen(process.env.PORT, function () {
    console.log('CORS-enabled web server listening on port 3000')
})

// Export the Express app
// export default app;