require('dotenv').config();

let cachedRequestOptions = null;

const getRequestOptions = () => {
    if (cachedRequestOptions) {
        // console.log(`Using cached request options`);
        // console.log(cachedRequestOptions);
        return cachedRequestOptions; // Return cached options
    }

    const username = process.env.TEA_REST_API_USERNAME;
    const password = process.env.TEA_REST_API_PASSWORD;

    if (!username || !password) {
        throw new Error('API username or password environment variables are missing.');
    }

    const auth = `${username}:${password}`;
    const authBase64 = Buffer.from(auth).toString('base64');

    const headers = {
        'Authorization': `Basic ${authBase64}`,
    };


    cachedRequestOptions = {
        method: 'GET',
        headers: headers,
        redirect: 'follow'
    };

    // console.log(`Caching request options`);
    // console.log(cachedRequestOptions);

    return cachedRequestOptions;
};

module.exports = { getRequestOptions };