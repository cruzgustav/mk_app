// API Route — /api/catalog
// Usa Cloudflare KV via @cloudflare/next-on-pages
// Funciona no edge runtime do Cloudflare Pages

import { NextRequest, NextResponse } from 'next/server';

const CATALOG_KEY = 'catalog_data';

// Declaração do binding para TypeScript
declare global {
  interface CloudflareEnv {
    CATALOG_KV: KVNamespace;
  }
}

export const runtime = 'edge';

// GET /api/catalog — lê o catálogo do KV
export async function GET() {
  try {
    // getRequestContext() só funciona no Cloudflare Pages (edge)
    // Em desenvolvimento local, vamos usar o import dinâmico
    let env: CloudflareEnv | null = null;
    try {
      const { getRequestContext } = await import('@cloudflare/next-on-pages');
      const ctx = getRequestContext();
      env = ctx.env;
    } catch {
      // Não está no Cloudflare (desenvolvimento local)
    }

    if (!env?.CATALOG_KV) {
      // Sem KV (desenvolvimento local) — retorna 404 para o client usar fallback
      return NextResponse.json(
        { error: 'KV not available — use static fallback' },
        { status: 404, headers: { 'Cache-Control': 'no-cache' } }
      );
    }

    const data = await env.CATALOG_KV.get(CATALOG_KEY, 'json');
    
    if (!data) {
      return NextResponse.json(
        { error: 'Catalog not found in KV' },
        { status: 404, headers: { 'Cache-Control': 'no-cache' } }
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to read catalog', details: String(err) },
      { status: 500 }
    );
  }
}

// PUT /api/catalog — salva o catálogo no KV
export async function PUT(request: NextRequest) {
  try {
    let env: CloudflareEnv | null = null;
    try {
      const { getRequestContext } = await import('@cloudflare/next-on-pages');
      const ctx = getRequestContext();
      env = ctx.env;
    } catch {
      // Não está no Cloudflare (desenvolvimento local)
    }

    if (!env?.CATALOG_KV) {
      return NextResponse.json(
        { error: 'KV not available — cannot save' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validação básica
    if (!body?.settings || !body?.categories || !body?.products || !body?.skinTones) {
      return NextResponse.json(
        { error: 'Invalid catalog format. Missing required fields.' },
        { status: 400 }
      );
    }

    // Salva no KV com expiração de 365 dias
    await env.CATALOG_KV.put(CATALOG_KEY, JSON.stringify(body), {
      expirationTtl: 365 * 24 * 60 * 60,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to save catalog', details: String(err) },
      { status: 500 }
    );
  }
}
