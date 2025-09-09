// itemsData.js
// const fetch = require('node-fetch');
const { getRequestOptions } = require('./getRequestOptions.js');
require('dotenv').config();

async function getItem(sku) {

    const requestOptions = getRequestOptions();

    const response = await fetch(`https://www.teacollection.com/?type=rest&full=1&page=items&format=json&sku:exactly=${sku}&active=1`, requestOptions);
    const result = await response.json();
    // console.log(result);
    if (result.items == undefined) {
        return;
    }

    const itemsArray = Object.values(result.items).filter(item => typeof item === 'object');
    // console.log(itemsArray);


    await Promise.all(itemsArray.map(async (val, i) => {
        try {
            // if (val.sku !== undefined && val.sku !== null) {
            const response = await fetch(`https://teacollection.com/?type=bare&page=item&action=images&id=${val.sku}`);
            const imgSrc = await response.json();
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

            // console.log(val);
            // }

        } catch (error) {
            console.error(`Error fetching data for SKU ${val.sku}:`, error);
        }
    }));


    return itemsArray;
}

module.exports = { getItem };