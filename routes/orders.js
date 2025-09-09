const express = require('express')
const router = express.Router()
require('dotenv').config()
const validator = require("email-validator");
const { getItems } = require('../utils/getItems');
const getAdjustedTimestamp = require('../utils/getAdjustedTimestamp');
const { getOrderLines } = require('../utils/getOrderLines.js');
const { getUserOrders } = require('../utils/getUserOrders.js');
// import { GoogleGenAI } from '@google/genai';
const { GoogleGenAI } = require('@google/genai');
const GEMINI_API_KEY = process.env.GOOGLE_AI_APIKEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// async function main() {
//   const response = await ai.models.generateContent({
//     model: 'gemini-2.5-flash',
//     contents: 'give me an array on Why is the sky blue? in this format: [reason1,reason2,etc..]',
//   });

// //   console.log(JSON.parse(response));
//   console.log(response.text);
// //   console.log(response.candidates[0].content.parts[0].text);
// }

// main();


router.param('email', async (req, res, next, email) => {
    //? if email is not valid
    if (!validator.validate(email)) {
        console.log(`Invalid email: ${email}`);
        return res.status(400).send('Invalid email');
    }
    try {
        //? get the user orders
        const userOrdersResponse = await getUserOrders(email, '');

        //? convert orders into an array
        const ordersArray = Object.values(userOrdersResponse.orders).filter(item => typeof item === 'object');

        //? get the latest order
        const latestOrder = ordersArray[ordersArray.length - 1];

        //? if latest order not found 
        if (!latestOrder) return res.status(404).send('No orders found');

        //? get the items associated with the latest order
        const orderLinesData = await getOrderLines(latestOrder.id);

        //? convert orderLines into an array
        const orderLinesArray = Object.values(orderLinesData.order_lines).filter(item => typeof item === 'object');

        //? get the items
        const items = await getItems();
        // console.log(items);

        //? use ai 
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `based on this purchase data: 
                ${JSON.stringify(orderLinesArray, null, 2)}
                recommend a list of 10 items from this list of products that the user mostly likely will buy
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
            return res.status(500).send('Error parsing AI response');
        }

        req.ai = aiData;
        next();

    } catch (error) {
        console.error('Error in middleware:', error);
        res.status(500).send('Server error');
    }

});


//? GET TODAY'S DATE AND TIME BUT 3HRS BEFORE UNLESS IT IS 12AM 
//? THEN CHANGE THE DATE TO THE DAY BEFORE AND CHANGE THE TIME TO LIKE 10PM
const today = getAdjustedTimestamp();


//? get request to /orders 
router.get('/', async (req, res) => {
    try {
        const usersOrders = await getUserOrders('', today);
        req.orders = usersOrders.orders;
        res.json(req.orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});


router.get('/:email', (req, res) => {
    res.json(req.ai);
    // res.json({ message: `we working` });
})


module.exports = router;