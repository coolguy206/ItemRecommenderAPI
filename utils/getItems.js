// itemsData.js
// const fetch = require('node-fetch');
const { fetchItems } = require('./fetchItems.js');
const { removeDuplicates } = require('./removeDuplicateItems.js');
require('dotenv').config();

async function getItems() {

    //? Initial fetch
    let items = await fetchItems();
    // console.log(items);

    //? Remove duplicates based on sku prefix
    let uniqueArray = await removeDuplicates(items.items);

    //? keep fetching until we have at least 100 unique items
    let conditionMet = false;
    while (!conditionMet) {

        items = await fetchItems(items.nextPage);

        let uniqueArray2 = await removeDuplicates(items.items);

        uniqueArray = [...uniqueArray, ...uniqueArray2];

        // console.log(`Total unique items: ${uniqueArray.length}`);

        //? stop if we reach 100 unique items or more
        if (uniqueArray.length >= 100) {
            conditionMet = true;
        }
    }

    return uniqueArray;
}

module.exports = { getItems };