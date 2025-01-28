export async function caller(funcName, params = []) {
  const endpoint = import.meta.env.VITE_API_ENDPOINT;
  
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ funcName, params })
  });
}
