const axios = require('axios');

async function test() {
    const api = axios.create({
        baseURL: 'http://localhost:8000/api',
    });

    console.log('Testing with leading slash:');
    try {
        // We don't actually need the server to be running to see the generated URL if we use an interceptor
        api.interceptors.request.use(config => {
            console.log('URL:', config.url);
            console.log('Full URL:', axios.getUri(config));
            return Promise.reject({ message: 'Stop' }); // Prevent actual request
        });
        await api.get('/auth/register/');
    } catch (e) {}

    const api2 = axios.create({
        baseURL: 'http://localhost:8000/api/',
    });
    console.log('\nTesting with trailing slash in base and leading slash in endpoint:');
    try {
        api2.interceptors.request.use(config => {
            console.log('URL:', config.url);
            console.log('Full URL:', axios.getUri(config));
            return Promise.reject({ message: 'Stop' });
        });
        await api2.get('/auth/register/');
    } catch (e) {}
}

test();
