import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: 1,
    iterations: 1,
};

const BASE_URL = 'http://app:8000';

export default function () {
    const jar = http.cookieJar();

    // Step 1: get CSRF cookie
    const csrfRes = http.get(`${BASE_URL}/sanctum/csrf-cookie`, { jar });
    console.log('CSRF status:', csrfRes.status);
    console.log('CSRF Set-Cookie:', csrfRes.headers['Set-Cookie']);

    // Step 2: read cookies from jar
    const cookies = jar.cookiesForURL(`${BASE_URL}/`);
    console.log('Cookies from jar:', JSON.stringify(cookies));

    const xsrfArr = cookies['XSRF-TOKEN'];
    const xsrf = xsrfArr && xsrfArr.length > 0 ? decodeURIComponent(xsrfArr[0]) : '';
    console.log('XSRF token length:', xsrf.length);
    console.log('XSRF token (first 50):', xsrf.substring(0, 50));

    // Step 3: POST login
    const loginRes = http.post(
        `${BASE_URL}/login`,
        JSON.stringify({ email: 'admin@kombee.com', password: 'password' }),
        {
            jar,
            redirects: 5,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-Inertia': 'true',
                'X-XSRF-TOKEN': xsrf,
            },
        }
    );

    console.log('Login status:', loginRes.status);
    console.log('Login body (first 200):', loginRes.body ? loginRes.body.substring(0, 200) : 'empty');
    console.log('Login Location:', loginRes.headers['Location']);

    check(loginRes, {
        'login succeeded': (r) => r.status === 200 || r.status === 302 || r.status === 204,
    });
}
