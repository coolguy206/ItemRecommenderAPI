const { getRequestOptions } = require('./getRequestOptions.js');
const requestOptions = getRequestOptions();

async function getOrderLines(orderId, date) {
    // console.log(orderId, date);
    let data;
    let response;
    if (date == null) {
        // console.log(`getOrderLines activated by orderId`);
        // console.log(orderId);
        response = await fetch(`https://www.teacollection.com/?type=rest&page=order_lines&format=json&full=1&order_id=${orderId}`, requestOptions);
    } else {
        // console.log(`getOrderLines activated by date`);
        // console.log(date);
        response = await fetch(`https://www.teacollection.com/?type=rest&page=order_lines&format=json&full=1&created:after=${date}`, requestOptions);
    }

    data = await response.json();
    let orderLinesArray = Object.values(data.order_lines).filter(item => typeof item === 'object');

    return orderLinesArray;
}

module.exports = { getOrderLines };