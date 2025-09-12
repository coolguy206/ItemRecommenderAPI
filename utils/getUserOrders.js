const { getRequestOptions } = require('./getRequestOptions.js');
const requestOptions = getRequestOptions();

async function getUserOrders(email, date, urlParam) {

    let url = `https://www.teacollection.com/?type=rest&full=1&page=orders&format=json`;

    if (email !== null) {
        url += `&email=${email}`;
    } else if (date !== null) {
        url += `&created:after=${encodeURIComponent(date)}`;
    } else if (urlParam !== null) {
        url = urlParam;
    }
    // console.log(`Fetching from URL: ${url}`);
    const response = await fetch(url, requestOptions);
    const data = await response.json();

    const ordersArray = Object.values(data.orders).filter(order => typeof order === 'object');

    if (data.orders.next === undefined) {

        //? returns orders by emails
        return { orders: ordersArray }

    } else {

        //? returns for orders by date
        const nextPage = data.orders.next;
        return { orders: ordersArray, nextPage: nextPage, count: data.orders.count };

    }

}

module.exports = { getUserOrders };