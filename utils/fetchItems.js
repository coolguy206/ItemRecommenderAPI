// const fetch = require('node-fetch');
const { getRequestOptions } = require('./getRequestOptions.js');
require('dotenv').config();

async function fetchItems(param) {

    const requestOptions = getRequestOptions();

    let response;

    if (param !== undefined) {
        response = await fetch(param, requestOptions);
    } else {
        response = await fetch("https://www.teacollection.com/?type=rest&full=1&page=items&format=json&active=1", requestOptions);
    }

    const result = await response.json();

    const nextPage = result.items.next;

    const itemsArray = Object.values(result.items).filter(item => typeof item === 'object');

    //? fetch the image url and make the baseSku and url
    await Promise.all(itemsArray.map(async (val, i) => {
        try {

            //? sku must contain a hyphen because otherwise it is a parent sku and skip git cards
            const skuCheck = val.sku;
            if (skuCheck.indexOf('-') !== -1 && val.sku !== `GIFT_MESSAGE-999-NS`) {

                const response = await fetch(`https://teacollection.com/?type=bare&page=item&action=images&id=${val.sku}`);

                const imgSrc = await response.json();
                // console.log(imgSrc[0]);

                if (imgSrc[0] !== undefined) {
                    val.img = `<img src="${imgSrc[0]}" alt="${val.model}">`;
                }

                //? set the base SKU
                val.baseSku = val.sku.split('-')[0];

                //? set the URL
                //? CHECK IF COLOR IS NOT UNDEFINED
                if (val.color !== undefined) {

                    val.url = `https://www.teacollection.com/product/${val.sku.split('-')[0]}/${val.model.replace(/\s+/g, '-')}.html#${val.color}`;

                } else {

                    val.url = `https://www.teacollection.com/product/${val.sku.split('-')[0]}/${val.model.replace(/\s+/g, '-')}.html`;

                }
            }

        } catch (error) {
            console.error(`Error fetching data for SKU ${val.sku}:`, error);
        }
    }));

    return { items: itemsArray, nextPage: nextPage };

}

module.exports = { fetchItems };