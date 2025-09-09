// itemsData.js
// const fetch = require('node-fetch');
const { getRequestOptions } = require('./getRequestOptions.js');
require('dotenv').config();

async function getItems() {

    const requestOptions = getRequestOptions();

    const response = await fetch("https://www.teacollection.com/?type=rest&full=1&page=items&format=json&active=1", requestOptions);
    const result = await response.json();
    const itemsArray = Object.values(result.items).filter(item => typeof item === 'object');

    await Promise.all(itemsArray.map(async (val, i) => {
        try {
            const response = await fetch(`https://teacollection.com/?type=bare&page=item&action=images&id=${val.sku}`);
            const imgSrc = await response.json(); // or response.json() if JSON
            // console.log(imgSrc[0]);
            val.img = `<img src="${imgSrc[0]}" alt="${val.model}">`;

            //? set the base SKU
            val.baseSku = val.sku.split('-')[0];

            //? set the URL
            //? CHECK IF COLOR IS NOT UNDEFINED
            if (val.color !== undefined) {
                val.url = `https://www.teacollection.com/product/${val.sku.split('-')[0]}/${val.model.replace(/\s+/g, '-')}.html#${val.color}`;
            } else {
                val.url = `https://www.teacollection.com/product/${val.sku.split('-')[0]}/${val.model.replace(/\s+/g, '-')}.html`;
            }

        } catch (error) {
            console.error(`Error fetching data for SKU ${val.sku}:`, error);
        }
    }));

    //? REMOVE DUPLICATES
    //? Remove duplicates based on sku prefix
    const seenPrefixes = new Set();
    const uniqueArray = itemsArray.filter(item => {
        const prefix = item.sku.split('-')[0]; // Extract prefix before hyphen
        if (seenPrefixes.has(prefix)) {
            return false; // Skip if prefix already seen
        } else {
            seenPrefixes.add(prefix);
            return true; // Keep the first occurrence
        }
    });


    return uniqueArray;
}

module.exports = { getItems };