const express = require('express')
const router = express.Router()
require('dotenv').config()
const validator = require("email-validator");
const { getItem } = require('../utils/getItem');
const { getItems } = require('../utils/getItems');
const getAdjustedTimestamp = require('../utils/getAdjustedTimestamp');
const { getOrderLines } = require('../utils/getOrderLines.js');
const { getUserOrders } = require('../utils/getUserOrders.js');
// import { GoogleGenAI } from '@google/genai';
const { GoogleGenAI } = require('@google/genai');
const GEMINI_API_KEY = process.env.GOOGLE_AI_APIKEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

//? get the items
const items = getItems();

router.param('email', async (req, res, next, email) => {
    //? if email is not valid
    if (!validator.validate(email)) {

        console.log(`Invalid email: ${email}`);
        return res.status(400).send('Invalid email');

    }

    try {
        //? get the user orders
        const userOrdersResponse = await getUserOrders(email, null, null);

        //? convert orders into an array
        // const ordersArray = Object.values(userOrdersResponse.orders).filter(item => typeof item === 'object');

        //? get the latest order
        const latestOrder = userOrdersResponse.orders[userOrdersResponse.orders.length - 1];

        //? if latest order not found 
        if (!latestOrder) return res.status(404).send('No orders found');

        //? get the items associated with the latest order
        const orderLinesData = await getOrderLines(latestOrder.id, null);

        //?get the item details for the order lines
        let purchasedItems = await Promise.all(orderLinesData.map(async (order) => {

            // console.log(order.sku);
            let details = await getItem(order.sku, null, null);
            // console.log(details);
            return details[0];

        }));


        //? get the items
        // const items = await getItems();
        // console.log(items);

        //? use ai 
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `based on this purchase data: 
                ${JSON.stringify(purchasedItems, null, 2)}
                recommend a list of 5 items from this list of products that they have not purchased that the user mostly likely will buy
                ${JSON.stringify(items, null, 2)}.
                Give me the results as an array of objects.

                in this format:
                    [
                        {
                            model: str,
                            color: str,
                            gender: str,
                            department: str,
                            category: str,
                            sku: str,
                            size: str,
                            store_price: str,
                            retail_price: str,
                            promo_teaser: str,
                            img: str,
                            url: str,
                            reason: str
                        },
                        etc...
                    ]
            `,
        });


        //? Robust JSON parsing with error handling
        let aiData;
        try {

            const responseText = response.text;

            //? Check if response contains 'json' and code blocks
            if (responseText.includes('json') && responseText.includes('```')) {

                const jsonString = responseText.split('json')[1].split('```')[0].trim();
                aiData = JSON.parse(jsonString);

            } else {

                throw new Error('Unexpected AI response format');

            }

        } catch (parseError) {

            console.error('Error parsing AI response:', parseError);
            return res.status(500).json({ error: 'Error parsing AI response' });

        }

        req.ai = aiData;

        // req.ai = `working`;

        next();

    } catch (error) {

        console.error('Error in middleware:', error);
        res.status(500).json({ error: 'Failed to fetch email order' });

    }

});


//? get request to /orders 
router.get('/', async (req, res) => {
    try {
        //? get the start of the month date
        // const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        // const today = getAdjustedTimestamp(startOfMonth);

        const date = getAdjustedTimestamp();

        //? get the orders
        const usersOrders = await getUserOrders(null, date, null);

        //? get the order lines
        let ordersWithLines = await Promise.all(usersOrders.orders.map(async (order) => {

            let orderLinesResponse = await getOrderLines(order.id, null);

            return { ...order, orderLines: orderLinesResponse };

        }));

        //? get the item details for the order lines
        let itemsArray = await Promise.all(ordersWithLines.map(async (order) => {

            let details = await Promise.all(order.orderLines.map(async (item) => {

                // console.log(obj.sku);
                let details = await getItem(item.sku, null, null);
                // console.log(details);
                return details[0];

            }));

            return { ...order, items: details };
        }));

        res.json(itemsArray);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch all orders' });
    }
});


router.get('/:email', (req, res) => {
    try {
        res.json(req.ai);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch email order' });
    }
})


module.exports = router;