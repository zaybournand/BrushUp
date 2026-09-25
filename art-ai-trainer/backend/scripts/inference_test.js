import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    insecureSkipTLSVerify: true,
    setupTimeout: '600s', 
    
    scenarios: {
        inference_load: {
            executor: 'constant-vus',
            vus: 1,
            duration: '3m',  
        },
    },
};

export default function () {
    const baseUrl = __ENV.API_BASE_URL || 'http://localhost:5001';
    const login = http.post(`${baseUrl}/login`, JSON.stringify({
        email: __ENV.TEST_EMAIL, password: __ENV.TEST_PASSWORD,
    }), { headers: { 'Content-Type': 'application/json' } });
    if (!check(login, { 'authenticated': (r) => r.status === 200 })) return;
    const url = `${baseUrl}/api/generate_reference_image`;
    
    const payload = JSON.stringify({
        prompt: 'A cinematic digital painting of a futuristic city skyline, highly detailed, art station trend',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: '180s', 
    };

    const res = http.post(url, payload, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'has image url': (r) => r.json().hasOwnProperty('image_url') || r.body.includes('http'),
    });

    sleep(5); 
}