const { getRequestOptions } = require('./getRequestOptions.js');
const requestOptions = getRequestOptions();

async function getOrderLines(orderId) {
    const response = await fetch(`https://www.teacollection.com/?type=rest&page=order_lines&format=json&full=1&order_id=${orderId}`, requestOptions);
    const data = await response.json();
    return data;
}

module.exports = { getOrderLines };