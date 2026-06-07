addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (url.pathname === '/entries') {
    if (request.method === 'GET') {
      const raw = await KV.get('entries');
      const entries = raw ? JSON.parse(raw) : [];
      entries.sort((a, b) => b.timestamp - a.timestamp);
      return new Response(JSON.stringify(entries), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const name = (body.name || '').trim();
      const message = (body.message || '').trim();
      if (!name || !message) {
        return new Response(JSON.stringify({ error: 'name and message are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (name.length > 100 || message.length > 2000) {
        return new Response(JSON.stringify({ error: 'name too long (max 100) or message too long (max 2000)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const raw = await KV.get('entries');
      const entries = raw ? JSON.parse(raw) : [];
      entries.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name,
        message,
        timestamp: Date.now(),
      });
      entries.sort((a, b) => b.timestamp - a.timestamp);
      await KV.put('entries', JSON.stringify(entries));

      return new Response(JSON.stringify(entries), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'DELETE') {
      if (request.headers.get('X-Admin-Key') !== ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      const body = await request.json();
      const id = body && body.id;
      if (!id) {
        return new Response(JSON.stringify({ error: 'id is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      const raw = await KV.get('entries');
      let entries = raw ? JSON.parse(raw) : [];
      entries = entries.filter(function(e) { return e.id !== id; });
      await KV.put('entries', JSON.stringify(entries));
      return new Response(JSON.stringify(entries), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  return new Response('Not found', { status: 404, headers: corsHeaders });
}
