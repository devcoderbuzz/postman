// Quick test of cURL parsing logic

const testCurlCommands = [
    // Test 1: Simple POST with JSON body
    `curl -X POST "https://api.example.com/data" -H "Content-Type: application/json" -d '{"key": "value"}'`,
    
    // Test 2: Body with escaped quotes
    `curl -X POST -H "Content-Type: application/json" -d "{\\"key\\": \\"value\\"}" "https://api.example.com/data"`,
    
    // Test 3: Chrome/Browser copy format
    `curl 'https://example.com/api/endpoint' -H 'Content-Type: application/json' --data-raw '{"userId":"123","action":"test"}'`,
    
    // Test 4: Multi-line with continuation
    `curl -X POST https://api.example.com/users \\
-H "Content-Type: application/json" \\
-d '{"name":"John","email":"john@example.com"}'`,
];

function parseCurl(data) {
    const cleanData = data.replace(/\\\n/g, ' '); // Handle line continuations

    // Extract Method
    const methodMatch = cleanData.match(/-X\s+([A-Z]+)/);
    const method = methodMatch ? methodMatch[1] : (cleanData.includes('-d ') || cleanData.includes('--data') ? 'POST' : 'GET');

    // Extract URL (find the first thing that looks like a URL or starts with {{)
    const urlMatch = cleanData.match(/(?:['"])(http[s]?:\/\/.*?|{{.*?}}.*?)(?:['"])/) || cleanData.match(/\s(http[s]?:\/\/.*?|{{.*?}}.*?)(\s|$)/);
    const url = urlMatch ? urlMatch[1] : '';

    // Extract Headers
    const headers = {};
    const headerMatches = [...cleanData.matchAll(/(?:-H|--header)\s+['"](.*?)['"]/g)];
    headerMatches.forEach(match => {
        const headerContent = match[1];
        const firstColon = headerContent.indexOf(':');
        if (firstColon !== -1) {
            const key = headerContent.slice(0, firstColon).trim();
            const val = headerContent.slice(firstColon + 1).trim();
            headers[key] = val;
        }
    });

    // Extract Body (-d or --data)
    // More robust approach: find the data flag, then manually parse the quoted string
    let body = '';
    
    // Find all occurrences of data flags
    const dataFlagPattern = /(?:-d|--data(?:-raw)?|--data-binary)\s+/g;
    let match;
    const bodies = [];
    
    while ((match = dataFlagPattern.exec(cleanData)) !== null) {
        const startPos = match.index + match[0].length;
        const char = cleanData[startPos];
        
        if (char === '"' || char === "'") {
            // Manually parse quoted string, handling escapes
            let endPos = startPos + 1;
            let escaped = false;
            
            while (endPos < cleanData.length) {
                const c = cleanData[endPos];
                
                if (escaped) {
                    escaped = false;
                } else if (c === '\\') {
                    escaped = true;
                } else if (c === char) {
                    // Found matching closing quote
                    const bodyContent = cleanData.substring(startPos + 1, endPos);
                    bodies.push(bodyContent);
                    break;
                }
                endPos++;
            }
        } else {
            // Unquoted body - capture until whitespace or end
            const unquotedMatch = cleanData.substring(startPos).match(/^(\S+)/);
            if (unquotedMatch) {
                bodies.push(unquotedMatch[1]);
            }
        }
    }
    
    if (bodies.length > 0) {
        body = bodies.join('&');
    }

    // Try to pretty print if JSON
    if (body) {
        try {
            const parsed = JSON.parse(body);
            body = JSON.stringify(parsed, null, 2);
        } catch (e) {
            console.log('Body is not valid JSON, keeping as-is');
        }
    }

    return { method, url, headers, body };
}

console.log('Testing cURL parsing:\n');

testCurlCommands.forEach((curl, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${index + 1}:`);
    console.log(`Input: ${curl}`);
    console.log('\nParsed result:');
    const result = parseCurl(curl);
    console.log(JSON.stringify(result, null, 2));
});
