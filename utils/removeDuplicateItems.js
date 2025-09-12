
// const fetch = require('node-fetch');
require('dotenv').config();

async function removeDuplicates(arr) {

    //? Remove duplicates based on sku prefix
    let uniqueArray = [];
    const seenPrefixes = new Set();

    uniqueArray = arr.filter(item => {
        const prefix = item.sku.split('-')[0]; 

        if (seenPrefixes.has(prefix)) {

            //? Skip if prefix already seen
            return false; 

        } else {

            //? Keep the first occurrence
            seenPrefixes.add(prefix);
            return true; 
            
        }
    });

    return uniqueArray;
}

module.exports = { removeDuplicates };