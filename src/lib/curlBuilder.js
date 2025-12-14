export function buildCurl(request) {
  const { method, url, headers = [], body, bodyType, authType, authData } = request;
  
  // Start with the basic command
  let curl = `curl -X ${method} "${url}"`;

  // Helper to add header
  const addHeader = (key, value) => {
    curl += ` \\\n  -H "${key}: ${value}"`;
  };

  // Add Headers (from array)
  if (Array.isArray(headers)) {
    headers.forEach(h => {
      if (h.active && h.key && h.value) {
        addHeader(h.key, h.value);
      }
    });
  } else if (typeof headers === 'object') {
     // Fallback if headers is object (unlikely in this app structure but safe)
     Object.entries(headers).forEach(([key, value]) => {
         if(key && value) addHeader(key, value);
     });
  }

  // Add Authorization
  if (authType === 'bearer' && authData?.token) {
    addHeader('Authorization', `Bearer ${authData.token}`);
  } else if (authType === 'basic' && authData?.username && authData?.password) {
    const encoded = btoa(`${authData.username}:${authData.password}`);
    addHeader('Authorization', `Basic ${encoded}`);
  } else if (authType === 'api-key' && authData?.key && authData?.value && authData?.addTo === 'header') {
    addHeader(authData.key, authData.value);
  }

  // Add Content-Type for JSON if not already present (optional, but good practice if body is json)
  // Check if user added it manually first
  const hasContentType = Array.isArray(headers) 
    ? headers.some(h => h.active && h.key.toLowerCase() === 'content-type') 
    : false;

  if (bodyType === 'json' && !hasContentType) {
      addHeader('Content-Type', 'application/json');
  }

  // Add body
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body && bodyType !== 'none') {
    if (bodyType === 'json') {
      // For JSON, we need to ensure proper quoting
      // Use single quotes for the data to avoid shell expansion issues with double quotes inside JSON
      // But we need to escape single quotes inside the body
      const escapedBody = body.replace(/'/g, "'\\''");
      curl += ` \\\n  -d '${escapedBody}'`;
    } else {
      curl += ` \\\n  -d '${body}'`;
    }
  }

  return curl;
}
