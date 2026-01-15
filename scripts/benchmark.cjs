const axios = require('axios');

async function benchmark() {
    console.log('Use http/https agent keepAlive (Direct API)');
    
    // First request
    let start = Date.now();
    try {
        await axios({
            method: 'GET',
            url: 'https://dogapi.dog/api/v2/breeds',
            headers: {}
        });
        console.log(`1st Request took ${Date.now() - start}ms`);
    } catch (e) {
        console.error('1st failed', e.message);
    }

    // Second request
    start = Date.now();
    try {
        await axios({
            method: 'GET',
            url: 'https://dogapi.dog/api/v2/breeds',
            headers: {}
        });
        console.log(`2nd Request took ${Date.now() - start}ms`);
    } catch (e) {
        console.error('2nd failed', e.message);
    }
}

benchmark();
