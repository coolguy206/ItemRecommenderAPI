// items.js
const express = require('express');
const router = express.Router();
require('dotenv').config()
const { getItem } = require('../utils/getItem');
const { getItems } = require('../utils/getItems');
const { getUserOrders } = require('../utils/getUserOrders.js');
const { getOrderLines } = require('../utils/getOrderLines.js');
const getAdjustedTimestamp = require('../utils/getAdjustedTimestamp');
const { GoogleGenAI } = require('@google/genai');
const GEMINI_API_KEY = process.env.GOOGLE_AI_APIKEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

let cachedItems = null;

//? Fetch items once at startup
const initializeCache = async () => {
    try {
        cachedItems = await getItems();
        // console.log('Items data cached successfully.');
    } catch (error) {
        // console.error('Error initializing items cache:', error);
    }
};

initializeCache();

router.param('sku', async (req, res, next, sku) => {
    // console.log(sku);

    //? get the start of the month date
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const today = getAdjustedTimestamp(startOfMonth);

    //? get the orders 
    const usersOrders = await getUserOrders('', today);

    //? convert orders into an array
    const ordersArray = Object.values(usersOrders.orders).filter(order => typeof order === 'object');

    //? Fetch order lines for all orders concurrently
    const ordersWithLines = await Promise.all(ordersArray.map(async (order) => {

        const orderLinesResponse = await getOrderLines(order.id);

        let orderLinesArray = Object.values(orderLinesResponse.order_lines).filter(item => typeof item === 'object');

        return { ...order, items: orderLinesArray };
    }));

    //? loop ordersWithLines and filter out the orders that do not have the sku
    const filteredOrders = ordersWithLines.filter(order =>
        order.items.some(item => item.sku.indexOf(sku) !== -1)
    );

    //? create an array to hold the items
    let theArray = [];

    //? if filteredOrders is not empty then push to array
    if (filteredOrders.length > 0) {
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                theArray.push(item);
            });
        });
    }

    //? Fetch detailed items asynchronously for all items
    let itemsArray = await Promise.all(theArray.map(async (item) => {
        const details = await getItem(item.sku);
        return details[0];
    }));

    //? remove duplicates based on baseSku
    const uniqueDetails = Array.from(new Map(itemsArray.map(item => [item.baseSku, item])).values());

    req.sku = uniqueDetails;

    next();
});


router.param('model', async (req, res, next, model) => {
    // console.log(model);

    //? get the start of the month date
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    // console.log(startOfMonth);

    const today = getAdjustedTimestamp(startOfMonth);

    //? get the orders 
    const usersOrders = await getUserOrders('', today);
    // console.log(usersOrders);

    //? convert orders into an array
    const ordersArray = Object.values(usersOrders.orders).filter(order => typeof order === 'object');

    //? Fetch order lines for all orders concurrently
    const ordersWithLines = await Promise.all(ordersArray.map(async (order) => {
        const orderLinesResponse = await getOrderLines(order.id);
        let orderLinesArray = Object.values(orderLinesResponse.order_lines).filter(item => typeof item === 'object');

        //? filter out the orders that do not have the sku
        // orderLinesArray = orderLinesArray.filter(line => line.sku.indexOf(sku) !== -1);
        return { ...order, items: orderLinesArray };
    }));

    const modelArray = model.split(' ').map(m => m.trim().toLowerCase());

    const filteredOrders = ordersWithLines.filter(order => {
        // console.log('Processing order:', order);
        return order.items.some(item => {
            // console.log('Checking item:', item);
            return modelArray.some(m => {
                // console.log(m);
                // console.log(item.description.toLowerCase());
                const match = item.description.toLowerCase().indexOf(m) !== -1;
                if (match) {
                    // console.log(`Match found: ${m} in item description`);
                }
                return match;
            });
        });
    });


    let theArray = [];

    //? if filteredOrders is not empty then push to array
    if (filteredOrders.length > 0) {
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                theArray.push(item);
            });
        });
    }

    let itemsArray = await Promise.all(theArray.map(async (item) => {
        // console.log(item.sku);
        if (item.sku !== `GIFT_MESSAGE-999-NS`) {
            const details = await getItem(item.sku);
            if (details !== undefined) {
                return details[0];
            }

        }
    }));

    //? filter out undefined baseSku
    itemsArray = itemsArray.filter(item => item !== undefined && item.baseSku !== undefined);

    //? remove duplicates based on baseSku
    const uniqueArray = Array.from(new Map(itemsArray.map(item => [item.baseSku, item])).values());

    req.model = uniqueArray;

    next();
});


//? get all items
router.get('/', (req, res) => {
    if (cachedItems) {
        res.json(cachedItems);
    } else {
        res.status(503).json({ error: 'Items data not loaded yet' });
    }
});




//? recommend items based on sku
router.get('/recommendations/:sku/:model', (req, res) => {
    if (cachedItems) {
        res.json({ bySku: req.sku, byModel: req.model });
    } else {
        res.status(503).json({ error: 'Items data not loaded yet' });
    }
});


//? recommend items based on sku for dev
// router.get('/recommendations/:sku', (req, res) => {
//     if (cachedItems) {
//         // res.json(cachedItems);
//         // res.json(req.ai);
//         res.json({ bySku: req.sku });
//     } else {
//         res.status(503).json({ error: 'Items data not loaded yet' });
//     }
// });


//? recommend items based on model for dev
// router.get('/recommendations/model/:model', (req, res) => {
//     if (cachedItems) {
//         // res.json(cachedItems);
//         // res.json(req.ai);
//         res.json({ byModel: req.model });
//     } else {
//         res.status(503).json({ error: 'Items data not loaded yet' });
//     }
// });


//? get 1 item
router.get('/:id', (req, res) => {
    if (cachedItems) {
        const item = cachedItems.find(i => i.id === req.params.id);
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } else {
        res.status(503).json({ error: 'Items data not loaded yet' });
    }
});


module.exports = router;