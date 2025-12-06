export function buildCurl(request) {
  const { method, url, headers = {}, body, bodyType } = request;
  
  // Start with the basic command
  let curl = `curl -X ${method} "${url}"`;

  // Add headers
  Object.entries(headers).forEach(([key, value]) => {
    if (key && value) {
      curl += ` \\\n  -H "${key}: ${value}"`;
    }
  });

  // Add body
  if (['POST', 'PUT', 'PATCH'].includes(method) && body && bodyType !== 'none') {
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
