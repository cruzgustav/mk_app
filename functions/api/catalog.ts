// Cloudflare Pages Function — /api/catalog
// Usa KV para persistir o catálogo (compatível com Cloudflare Pages)

interface Env {
  CATALOG_KV: KVNamespace;
}

const CATALOG_KEY = 'catalog_data';

// GET /api/catalog — lê o catálogo do KV
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const data = await context.env.CATALOG_KV.get(CATALOG_KEY, 'json');
    
    if (!data) {
      // KV vazio — retorna 404 para o client usar fallback (static JSON)
      return new Response(JSON.stringify({ error: 'Catalog not found in KV' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // cache 1 min
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to read catalog', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT /api/catalog — salva o catálogo no KV
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();

    // Validação básica
    if (!body?.settings || !body?.categories || !body?.products || !body?.skinTones) {
      return new Response(
        JSON.stringify({ error: 'Invalid catalog format. Missing required fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Salva no KV com expiração de 365 dias (auto-renew ao salvar)
    await context.env.CATALOG_KV.put(CATALOG_KEY, JSON.stringify(body), {
      expirationTtl: 365 * 24 * 60 * 60,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save catalog', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
