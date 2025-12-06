import { describe, test, expect } from 'vitest';
import { buildCurl } from '../curlBuilder';

describe('buildCurl', () => {
    test('generates basic GET request', () => {
        const request = {
            method: 'GET',
            url: 'https://api.example.com/data',
            headers: {}
        };
        const curl = buildCurl(request);
        expect(curl).toBe('curl -X GET "https://api.example.com/data"');
    });

    test('generates request with headers', () => {
        const request = {
            method: 'GET',
            url: 'https://api.example.com/data',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer token'
            }
        };
        const curl = buildCurl(request);
        expect(curl).toContain('-H "Content-Type: application/json"');
        expect(curl).toContain('-H "Authorization: Bearer token"');
    });

    test('generates POST request with JSON body', () => {
        const request = {
            method: 'POST',
            url: 'https://api.example.com/data',
            headers: { 'Content-Type': 'application/json' },
            body: '{"key": "value"}',
            bodyType: 'json'
        };
        const curl = buildCurl(request);
        expect(curl).toContain('-X POST');
        expect(curl).toContain("-d '{\"key\": \"value\"}'");
    });
});
