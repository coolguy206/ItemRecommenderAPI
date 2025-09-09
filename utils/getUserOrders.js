const { getRequestOptions } = require('./getRequestOptions.js');
const requestOptions = getRequestOptions();

async function getUserOrders(email, date) {
    let url = `https://www.teacollection.com/?type=rest&full=1&page=orders&format=json`;
    if (email) {
        url += `&email=${email}`;
    } else if (date) {
        url += `&created:after=${encodeURIComponent(date)}`;
    }
    // console.log(`Fetching from URL: ${url}`);
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    return data;
}

module.exports = { getUserOrders };