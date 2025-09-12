// items.js
const express = require('express');
const router = express.Router();
require('dotenv').config()
const { getItem } = require('../utils/getItem');
const { getItems } = require('../utils/getItems');
const { getUserOrders } = require('../utils/getUserOrders.js');
const { getOrderLines } = require('../utils/getOrderLines.js');
const getAdjustedTimestamp = require('../utils/getAdjustedTimestamp');
const { removeDuplicates } = require('../utils/removeDuplicateItems.js');
const { GoogleGenAI } = require('@google/genai');
const GEMINI_API_KEY = process.env.GOOGLE_AI_APIKEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });


router.param('sku', async (req, res, next, sku) => {
    // console.log(`sku activated`);
    // console.log(sku);

    //? get the start of the month date
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const date = getAdjustedTimestamp(startOfMonth);

    //? get the orders 
    const usersOrders = await getUserOrders(null, date, null);

    //? keep fetching until we have at least 100 unique items
    let conditionMet = false;
    while (!conditionMet) {

        let moreOrders = await getUserOrders(null, null, usersOrders.nextPage);

        usersOrders.orders.push(...moreOrders.orders);

        //? stop if we reach 100 unique items or more
        if (usersOrders.orders.length >= 500 || usersOrders.count < usersOrders.orders.length) {
            conditionMet = true;
        }
    }

    //? Fetch order lines for all orders concurrently
    const ordersWithLines = await Promise.all(usersOrders.orders.map(async (order) => {

        const orderLinesResponse = await getOrderLines(order.id, null);

        return { ...order, items: orderLinesResponse };
    }));

    //? filter out the orders that do not have the sku
    const filteredOrders = ordersWithLines.filter(order =>
        order.items.some(item => item.sku.indexOf(sku) !== -1)
    );

    //? make an array of only the items and exclude the matching sku
    const filteredItems = filteredOrders.flatMap(order =>
        order.items.filter(item => item.sku.split('-')[0] !== sku)
    );

    //? Fetch detailed items asynchronously for all items
    let itemsArray = await Promise.all(filteredItems.map(async (item) => {
        const details = await getItem(item.sku, null, null);
        return details[0];
    }));

    //? remove duplicate full skus
    const uniqueArray = Array.from(new Map(itemsArray.map(item => [item.sku, item])).values());

    req.sku = uniqueArray;
    // req.sku = `working`;

    next();
});


router.param('model', async (req, res, next, model) => {
    // console.log(model);

    //? get the start of the month date
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    // console.log(startOfMonth);

    const date = getAdjustedTimestamp(startOfMonth);

    //? get the orders 
    const usersOrders = await getUserOrders(null, date, null);
    // console.log(usersOrders);

    const ordersWithLines = await Promise.all(usersOrders.orders.map(async (order) => {

        const orderLinesResponse = await getOrderLines(order.id, null);

        return { ...order, items: orderLinesResponse };
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


    //? make an array of only the items and exclude the matching sku
    const filteredItems = filteredOrders.flatMap(order => order.items);

    //? Fetch detailed items asynchronously for all items
    let itemsArray = await Promise.all(filteredItems.map(async (item) => {
        const details = await getItem(item.sku, null, null);
        // console.log(details);
        if (details !== undefined && details !== null) {
            return details[0];
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
router.get('/', async (req, res) => {
    try {

        const allItems = await getItems();

        res.json(allItems);

    } catch (error) {

        res.status(500).json({ error: 'Failed to fetch all items' });

    }

});


//? recommend items based on sku
router.get('/recommendations/:sku/:model', async (req, res) => {

    try {

        res.json({ bySku: req.sku, byModel: req.model });

    } catch (error) {

        res.status(500).json({ error: 'Failed to fetch sku & model items' });

    }

});

//? recommend items based on sku for dev
// router.get('/recommendations/:sku', (req, res) => {

//     try {
//         res.json({ bySku: req.sku });

//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch sku items' });
//     }

// });


//? recommend items based on model for dev
// router.get('/recommendations/model/:model', (req, res) => {
//     try {
//         res.json({ byModel: req.model });

//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch model items' });
//     }

// });


//? get 1 item
router.get('/:pdp/:name', async (req, res) => {
    try {

        const item = await getItem(null, req.params.pdp, req.params.name);

        const uniqueItem = await removeDuplicates(item);

        res.json(uniqueItem);

    } catch (error) {

        res.status(500).json({ error: 'Failed to fetch pdp & name items' });

    }

});


module.exports = router;