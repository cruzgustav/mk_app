import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Font registration
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

pdf_path = '/home/z/my-project/download/guia-cloudflare-pages-vortek.pdf'
os.makedirs('/home/z/my-project/download', exist_ok=True)

doc = SimpleDocTemplate(
    pdf_path, pagesize=A4,
    title='guia-cloudflare-pages-vortek',
    author='Z.ai', creator='Z.ai',
    subject='Guia de referencia para deploy de projetos no Cloudflare Pages',
    leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm
)

# Colors
ORANGE = colors.HexColor('#F97316')
BLUE = colors.HexColor('#1F4E79')
LIGHT = colors.HexColor('#F5F5F5')
DARK = colors.HexColor('#1A1A1A')
WARN_BG = colors.HexColor('#FFF7ED')
WARN_BORDER = colors.HexColor('#EA580C')
SUCCESS_BG = colors.HexColor('#F0FDF4')
SUCCESS_BORDER = colors.HexColor('#16A34A')
RED = colors.HexColor('#DC2626')

# Styles
cover_title = ParagraphStyle('CoverTitle', fontName='SimHei', fontSize=38, leading=46, alignment=TA_CENTER, textColor=ORANGE)
cover_sub = ParagraphStyle('CoverSub', fontName='SimHei', fontSize=16, leading=24, alignment=TA_CENTER, textColor=DARK)
cover_info = ParagraphStyle('CoverInfo', fontName='SimHei', fontSize=12, leading=18, alignment=TA_CENTER, textColor=colors.HexColor('#666'))

h1 = ParagraphStyle('H1', fontName='SimHei', fontSize=20, leading=28, textColor=ORANGE, spaceBefore=24, spaceAfter=10)
h2 = ParagraphStyle('H2', fontName='SimHei', fontSize=15, leading=22, textColor=BLUE, spaceBefore=18, spaceAfter=8)
h3 = ParagraphStyle('H3', fontName='SimHei', fontSize=12, leading=18, textColor=DARK, spaceBefore=12, spaceAfter=6)

body = ParagraphStyle('Body', fontName='SimHei', fontSize=10.5, leading=18, alignment=TA_LEFT, spaceAfter=6, wordWrap='CJK')
body_i = ParagraphStyle('BodyI', fontName='SimHei', fontSize=10.5, leading=18, alignment=TA_LEFT, spaceAfter=4, leftIndent=16, wordWrap='CJK')
body_ii = ParagraphStyle('BodyII', fontName='SimHei', fontSize=10.5, leading=18, alignment=TA_LEFT, spaceAfter=4, leftIndent=32, wordWrap='CJK')

code = ParagraphStyle('Code', fontName='DejaVuSans', fontSize=9, leading=14, alignment=TA_LEFT, spaceAfter=4, leftIndent=16, backColor=colors.HexColor('#F8F9FA'), borderColor=colors.HexColor('#DDD'), borderWidth=0.5, borderPadding=6)
code_sm = ParagraphStyle('CodeSm', fontName='DejaVuSans', fontSize=8, leading=12, alignment=TA_LEFT)

note_w = ParagraphStyle('NoteW', fontName='SimHei', fontSize=10, leading=16, alignment=TA_LEFT, spaceAfter=8, leftIndent=16, rightIndent=16, backColor=WARN_BG, borderColor=WARN_BORDER, borderWidth=1, borderPadding=8, textColor=colors.HexColor('#9A3412'))
note_s = ParagraphStyle('NoteS', fontName='SimHei', fontSize=10, leading=16, alignment=TA_LEFT, spaceAfter=8, leftIndent=16, rightIndent=16, backColor=SUCCESS_BG, borderColor=SUCCESS_BORDER, borderWidth=1, borderPadding=8, textColor=colors.HexColor('#166534'))

hc = ParagraphStyle('HC', fontName='SimHei', fontSize=10, leading=14, alignment=TA_CENTER, textColor=colors.white)
cell = ParagraphStyle('Cell', fontName='SimHei', fontSize=10, leading=14, alignment=TA_LEFT, wordWrap='CJK')
cell_c = ParagraphStyle('CellC', fontName='SimHei', fontSize=10, leading=14, alignment=TA_CENTER, wordWrap='CJK')

def make_table(data, widths, has_header=True):
    t = Table(data, colWidths=widths)
    style_cmds = [
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]
    if has_header:
        style_cmds.append(('BACKGROUND', (0,0), (-1,0), BLUE))
        style_cmds.append(('TEXTCOLOR', (0,0), (-1,0), colors.white))
        for i in range(1, len(data)):
            bg = colors.white if i % 2 == 1 else LIGHT
            style_cmds.append(('BACKGROUND', (0,i), (-1,i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def step(num, text):
    data = [[Paragraph(f'<b>{num}</b>', ParagraphStyle('SN', fontName='SimHei', fontSize=13, alignment=TA_CENTER, textColor=colors.white)),
             Paragraph(text, ParagraphStyle('ST', fontName='SimHei', fontSize=10.5, leading=16, alignment=TA_LEFT, wordWrap='CJK'))]]
    t = Table(data, colWidths=[1.2*cm, 14.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), ORANGE),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
    ]))
    return t

story = []

# ==================== COVER ====================
story.append(Spacer(1, 100))
story.append(Paragraph('<b>Cloudflare Pages</b>', cover_title))
story.append(Spacer(1, 16))
story.append(Paragraph('Guia de Referencia para Deploy', cover_sub))
story.append(Spacer(1, 8))
story.append(Paragraph('Vortek - Documentacao Interna', cover_info))
story.append(Spacer(1, 60))
story.append(Paragraph('Abril 2026', cover_info))
story.append(PageBreak())

# ==================== 1. VISAO GERAL ====================
story.append(Paragraph('<b>1. Visao Geral do Cloudflare Pages</b>', h1))
story.append(Paragraph(
    'O Cloudflare Pages e uma plataforma de hospedagem e deploy que roda na edge (borda) do Cloudflare, '
    'distribuindo conteudo estatico e funcoes serverless por mais de 300 datacenters no mundo. '
    'E totalmente gratuito para a maioria dos casos de uso e se integra diretamente com GitHub, '
    'GitLab e Bitbucket, permitindo deploys automaticos a cada push. A plataforma e ideal para '
    'aplicacoes Next.js, React, Vue, Svelte, sites estaticos e qualquer projeto que gere HTML/CSS/JS.', body
))
story.append(Paragraph(
    'Para projetos da Vortek, o Cloudflare Pages e a escolha ideal porque oferece: deploy automatico '
    'via Git, CDN global com SSL gratuito, suporte a custom domains (tipo base.vortek.app.br), '
    'KV para dados simples, Workers para serverless, e tudo isso sem custo no plano free. '
    'Este documento consolida tudo que voce precisa saber para fazer deploys com sucesso, '
    'evitando os erros mais comuns que ja enfrentamos.', body
))

# ==================== 2. TIPOS DE DEPLOY ====================
story.append(Spacer(1, 12))
story.append(Paragraph('<b>2. Tipos de Deploy no Cloudflare Pages</b>', h1))
story.append(Paragraph(
    'Existem tres abordagens principais para fazer deploy no Cloudflare Pages. A escolha depende '
    'do tipo de projeto. Entender a diferenca entre elas e fundamental para evitar problemas.', body
))

story.append(Paragraph('<b>2.1 Sitio Estatico Puro (HTML/CSS/JS)</b>', h2))
story.append(Paragraph(
    'Para projetos que nao usam framework ou que geram saida estatica (como Vite com build), '
    'voce usa a abordagem mais simples. O Cloudflare Pages apenas serve os arquivos gerados. '
    'Nao ha server-side rendering, nao ha API routes. Tudo e processado no navegador do usuario.', body
))

deploy_static = [
    [Paragraph('<b>Campo</b>', hc), Paragraph('<b>Valor</b>', hc), Paragraph('<b>Exemplo</b>', hc)],
    [Paragraph('Framework preset', cell), Paragraph('None', cell_c), Paragraph('Qualquer projeto que gera HTML', cell)],
    [Paragraph('Build command', cell), Paragraph('Comando de build do projeto', cell), Paragraph('npm run build', cell)],
    [Paragraph('Output directory', cell), Paragraph('Pasta com os arquivos finais', cell), Paragraph('dist/ ou out/', cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(deploy_static, [4*cm, 5*cm, 7*cm]))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>2.2 Next.js com output: "export" (Static Export)</b>', h2))
story.append(Paragraph(
    'Quando voce configura o Next.js com output: "export", ele gera HTML estatico para cada '
    'pagina. Isso funciona bem para sites que nao precisam de API routes nem server-side rendering. '
    'Porem, ha limitacoes importantes: nao funciona API routes (rodam no servidor), nao funciona '
    'getServerSideProps, e nao funciona middleware. Se o projeto precisa de APIs, esta abordagem '
    'nao serve e voce precisa da opcao 2.3.', body
))
story.append(Paragraph(
    '<b>Arquivo next.config.ts:</b>', h3
))
story.append(Paragraph('const nextConfig = { output: "export" };', code))

deploy_next_static = [
    [Paragraph('<b>Campo</b>', hc), Paragraph('<b>Valor</b>', hc)],
    [Paragraph('Framework preset', cell), Paragraph('None', cell_c)],
    [Paragraph('Build command', cell), Paragraph('next build', cell)],
    [Paragraph('Output directory', cell), Paragraph('out', cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(deploy_next_static, [5*cm, 11*cm]))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>2.3 Next.js com @cloudflare/next-on-pages (Recomendado)</b>', h2))
story.append(Paragraph(
    'Esta e a abordagem mais completa e e a que usamos na Vortek. O @cloudflare/next-on-pages '
    'e um adapter oficial que compila a aplicacao Next.js inteira (paginas, API routes, SSR) '
    'para rodar como Workers no Cloudflare. Suporta API routes, server-side rendering, '
    'dynamic routes, e bindings do Cloudflare (KV, D1, R2, etc). Funciona com Next.js 14 e 15 '
    '(ate a versao 15.5.2 no momento). O Next.js 16 ainda nao e suportado.', body
))
story.append(Paragraph(
    '<b>Arquivo next.config.ts:</b>', h3
))
story.append(Paragraph('// SEM output: "export"', code))
story.append(Paragraph('const nextConfig = {};', code))
story.append(Paragraph(
    '<b>Arquivo package.json (scripts):</b>', h3
))
story.append(Paragraph('"build": "next build"', code))
story.append(Paragraph('"pages:build": "npx @cloudflare/next-on-pages"', code))

deploy_next_full = [
    [Paragraph('<b>Campo</b>', hc), Paragraph('<b>Valor</b>', hc)],
    [Paragraph('Framework preset', cell), Paragraph('None (NUNCA selecione "Next.js")', cell)],
    [Paragraph('Build command', cell), Paragraph('npx @cloudflare/next-on-pages', cell)],
    [Paragraph('Output directory', cell), Paragraph('.vercel/output/static', cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(deploy_next_full, [5*cm, 11*cm]))
story.append(Spacer(1, 12))

story.append(Paragraph(
    '<b>Importante:</b> NUNCA selecione "Next.js" no Framework preset do Cloudflare Pages. '
    'O Cloudflare detecta o Next.js e tenta usar um build automatico que conflita com o '
    '@cloudflare/next-on-pages. Sempre deixe como "None" e especifique o build command manualmente. '
    'Se voce selecionar "Next.js" no preset, o deploy pode falhar silenciosamente ou gerar uma pagina em branco.', note_w
))

# ==================== 3. WRANGLER.TOML ====================
story.append(Spacer(1, 12))
story.append(Paragraph('<b>3. Arquivo wrangler.toml (Obrigatorio)</b>', h1))
story.append(Paragraph(
    'O wrangler.toml e o arquivo de configuracao que o Cloudflare Pages lê durante o deploy. '
    'Sem ele (ou com ele incompleto), varios recursos nao funcionam. O Cloudflare Pages exibe '
    'um aviso "does not appear to be valid" se o arquivo nao tiver a propriedade pages_build_output_dir. '
    'Alem disso, o nodejs_compat e essencial para projetos Next.js, pois o Next.js usa modulos '
    'do Node.js internamente (node:buffer, node:async_hooks, etc). Sem este flag, o worker '
    'lanca erros em runtime e a pagina pode ficar em branco ou com erros de JavaScript.', body
))

story.append(Paragraph('<b>3.1 Modelo Completo do wrangler.toml</b>', h2))
story.append(Paragraph(
    'Abaixo esta o modelo com tudo que voce precisa. Copie e adapte para cada projeto:', body
))
story.append(Spacer(1, 8))

toml_content = ('name = "nome-do-projeto"<br/>'
    'compatibility_date = "2024-12-01"<br/>'
    'compatibility_flags = ["nodejs_compat"]<br/>'
    'pages_build_output_dir = ".vercel/output/static"<br/>'
    '<br/>'
    '# KV Bindings (adicione conforme necessario)<br/>'
    '[[kv_namespaces]]<br/>'
    'binding = "MEU_KV"<br/>'
    'id = "COLE_O_ID_AQUI"')
story.append(Paragraph(toml_content, code))

story.append(Spacer(1, 12))
toml_exp = [
    [Paragraph('<b>Propriedade</b>', hc), Paragraph('<b>Obrigatória?</b>', hc), Paragraph('<b>O que faz</b>', hc)],
    [Paragraph('name', cell_c), Paragraph('Sim', cell_c), Paragraph('Nome do projeto no Cloudflare', cell)],
    [Paragraph('compatibility_date', cell_c), Paragraph('Sim', cell_c), Paragraph('Data de compatibilidade do runtime', cell)],
    [Paragraph('compatibility_flags', cell_c), Paragraph('Sim', cell_c), Paragraph('"nodejs_compat" e obrigatorio para Next.js', cell)],
    [Paragraph('pages_build_output_dir', cell_c), Paragraph('Sim', cell_c), Paragraph('Diz ao Cloudflare onde esta o build (senão ignora o arquivo)', cell)],
    [Paragraph('[[kv_namespaces]]', cell_c), Paragraph('Nao', cell_c), Paragraph('Bindings de KV (opcional, mas recomendado para dados)', cell)],
]
story.append(make_table(toml_exp, [4.5*cm, 2.5*cm, 9*cm]))
story.append(Spacer(1, 12))

story.append(Paragraph(
    '<b>Ponto critico:</b> Se o wrangler.toml nao tiver pages_build_output_dir, o Cloudflare '
    'ignora o arquivo INTEIRO. Isso significa que o compatibility_flags tambem e ignorado, '
    'o que causa o erro "no nodejs_compat compatibility flag set" e a aplicacao pode falhar '
    'em runtime mesmo que o build tenha sucesso.', note_w
))

# ==================== 4. KV ====================
story.append(Spacer(1, 12))
story.append(Paragraph('<b>4. Cloudflare KV (Armazenamento de Dados)</b>', h1))
story.append(Paragraph(
    'O Cloudflare KV e um banco de dados chave-valor global, replicado automaticamente para '
    'todos os datacenters. E perfeito para dados que sao lidos com frequencia e escritos '
    'poucas vezes, como configuracoes, catalogos de produtos, preferencias de usuario, etc. '
    'No plano gratuito, voce tem 100.000 leituras/dia e 1.000 escritas/dia, o que e mais '
    'que suficiente para a maioria das mini apps da Vortek.', body
))

story.append(Paragraph('<b>4.1 Como criar e configurar o KV</b>', h2))
story.append(step('1', 'Acesse dash.cloudflare.com > Workers e Pages > KV'))
story.append(Spacer(1, 4))
story.append(step('2', 'Clique em "Create a namespace" e de um nome (ex: CATALOG_KV)'))
story.append(Spacer(1, 4))
story.append(step('3', 'Copie o ID gerado'))
story.append(Spacer(1, 4))
story.append(step('4', 'No dashboard do projeto Pages, va em Settings > Functions > KV namespace bindings'))
story.append(Spacer(1, 4))
story.append(step('5', 'Adicione binding: Variable name = CATALOG_KV, KV namespace = selecione o criado'))
story.append(Spacer(1, 4))
story.append(step('6', 'Salve e faca um novo deploy (Retry deployment ou novo push)'))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>4.2 Usando KV em API Routes (Next.js)</b>', h2))
story.append(Paragraph(
    'Com @cloudflare/next-on-pages, voce acessa os bindings do Cloudflare via '
    'getRequestContext(). Isso funciona em API routes com runtime edge. Veja o exemplo:', body
))
story.append(Paragraph(
    '// src/app/api/exemplo/route.ts<br/>'
    'export const runtime = "edge";<br/><br/>'
    'export async function GET() {<br/>'
    '  const { getRequestContext } = await import("@cloudflare/next-on-pages");<br/>'
    '  const ctx = getRequestContext();<br/>'
    '  const data = await ctx.env.MEU_KV.get("chave", "json");<br/>'
    '  return Response.json(data);<br/>'
    '}', code
))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>4.3 Limites do plano gratuito</b>', h2))
kv_limits = [
    [Paragraph('<b>Recurso</b>', hc), Paragraph('<b>Limite Free</b>', hc), Paragraph('<b>Uso tipico</b>', hc)],
    [Paragraph('Leituras', cell), Paragraph('100.000/dia', cell_c), Paragraph('Cada carregamento de pagina que le dados do KV', cell)],
    [Paragraph('Escritas', cell), Paragraph('1.000/dia', cell_c), Paragraph('Salvar dados do admin, atualizar catalogos', cell)],
    [Paragraph('Chaves armazenadas', cell), Paragraph('Ilimitado', cell_c), Paragraph('Cada entrada e um par chave-valor', cell)],
    [Paragraph('Tamanho do valor', cell), Paragraph('25 MB por valor', cell_c), Paragraph('JSON grande, catalogos extensos', cell)],
    [Paragraph('Propagacao global', cell), Paragraph('~60 segundos', cell_c), Paragraph('Tempo para replicar entre datacenters', cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(kv_limits, [4*cm, 3.5*cm, 8.5*cm]))
story.append(Spacer(1, 12))

# ==================== 5. CUSTOM DOMAINS ====================
story.append(Spacer(1, 12))
story.append(Paragraph('<b>5. Dominios Customizados</b>', h1))
story.append(Paragraph(
    'O Cloudflare Pages suporta dominios customizados sem custo adicional. Como o DNS da Vortek '
    'ja esta no Cloudflare, a configuracao e simplificada. Basta acessar o projeto no dashboard, '
    'ir em "Custom domains" e adicionar o subdominio desejado. O Cloudflare configura o DNS '
    'automaticamente quando o dominio principal ja esta na mesma conta.', body
))

story.append(Paragraph('<b>5.1 Padrão Vortek de subdominios</b>', h2))
domain_examples = [
    [Paragraph('<b>Subdominio</b>', hc), Paragraph('<b>Destino</b>', hc), Paragraph('<b>Projeto Pages</b>', hc)],
    [Paragraph('blog.vortek.app.br', cell), Paragraph('Blog/Conteudo', cell), Paragraph('Projeto blog', cell)],
    [Paragraph('vitrine.vortek.app.br', cell), Paragraph('Plataforma de lojas', cell), Paragraph('Projeto vitrine', cell)],
    [Paragraph('base.vortek.app.br', cell), Paragraph('Analise de tom de pele', cell), Paragraph('Projeto base-perfeita', cell)],
    [Paragraph('app.vortek.app.br', cell), Paragraph('Painel administrativo', cell), Paragraph('Projeto admin', cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(domain_examples, [4*cm, 4.5*cm, 7.5*cm]))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>5.2 Como configurar</b>', h2))
story.append(Paragraph(
    '1. No dashboard do Cloudflare, va em Workers e Pages, clique no projeto<br/>'
    '2. Va em "Custom domains" no menu superior<br/>'
    '3. Clique em "Set up a custom domain"<br/>'
    '4. Digite o subdominio (ex: base.vortek.app.br)<br/>'
    '5. Se o dominio principal (vortek.app.br) ja esta no Cloudflare, ele configura automaticamente<br/>'
    '6. O SSL e ativado automaticamente (certificate provisioned pelo Cloudflare)<br/>'
    '7. Em poucos minutos o subdominio esta acessivel', body_i
))
story.append(Spacer(1, 8))
story.append(Paragraph(
    '<b>Dica:</b> Se o dominio nao esta no Cloudflare, voce precisa adicionar o dominio '
    'primeiro e depois configurar o DNS manualmente (CNAME apontando para o projeto Pages). '
    'Mas como a Vortek ja usa Cloudflare DNS, tudo e automatico.', note_s
))

# ==================== 6. PACKAGE.JSON ====================
story.append(Spacer(1, 12))
story.append(Paragraph('<b>6. Configuracoes do package.json</b>', h1))
story.append(Paragraph(
    'O package.json precisa ter as dependencias e scripts corretos para o build funcionar '
    'no Cloudflare Pages. Abaixo estao os pontos criticos que devem ser verificados em cada '
    'projeto antes do deploy.', body
))

story.append(Paragraph('<b>6.1 Dependencias obrigatorias para Next.js</b>', h2))
deps = [
    [Paragraph('<b>Pacote</b>', hc), Paragraph('<b>Versao compativel</b>', hc), Paragraph('<b>Papel</b>', hc)],
    [Paragraph('next', cell_c), Paragraph('14.x ou 15.x (ate 15.5.2)', cell), Paragraph('Framework. Nao use 16+ (incompativel)', cell)],
    [Paragraph('react', cell_c), Paragraph('18.x ou 19.x', cell), Paragraph('Lib de UI', cell)],
    [Paragraph('react-dom', cell_c), Paragraph('18.x ou 19.x', cell), Paragraph('Renderizacao no DOM', cell)],
    [Paragraph('@cloudflare/next-on-pages', cell_c), Paragraph('^1.13.16', cell), Paragraph('Adapter para Cloudflare (devDep ou dep)', cell)],
    [Paragraph('wrangler', cell_c), Paragraph('^4.x', cell), Paragraph('CLI do Cloudflare (opcional, mas util)', cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(deps, [5*cm, 4*cm, 7*cm]))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>6.2 Scripts recomendados</b>', h2))
story.append(Paragraph(
    '"build": "next build" (usado internamente pelo adapter)<br/>'
    '"pages:build": "npx @cloudflare/next-on-pages" (build para Cloudflare)<br/>'
    '"dev": "next dev -p 3000" (desenvolvimento local)<br/>'
    '"preview": "npx wrangler pages dev .vercel/output/static" (preview local com Workers)', code
))
story.append(Spacer(1, 8))
story.append(Paragraph(
    '<b>Nota:</b> No Cloudflare Pages, o Build command configurado no dashboard deve ser '
    '"npx @cloudflare/next-on-pages" e nao "npm run build". O adapter chama "next build" '
    'internamente e depois compila para o formato do Cloudflare.', note_w
))

# ==================== 7. CHECKLIST ====================
story.append(Spacer(1, 12))
story.append(Paragraph('<b>7. Checklist de Pre-Deploy (Copie para cada projeto)</b>', h1))
story.append(Paragraph(
    'Antes de fazer o deploy de qualquer projeto, passe por esta checklist. Ela evita 99% dos '
    'problemas que ja enfrentamos. Imprima ou salve como referencia rapida.', body
))

checklist = [
    ['Versao do Next.js', 'Estah em 14.x ou 15.x (ate 15.5.2)? Next.js 16 NAO funciona.'],
    ['wrangler.toml', 'Tem pages_build_output_dir = ".vercel/output/static"?'],
    ['nodejs_compat', 'Tem compatibility_flags = ["nodejs_compat"] no wrangler.toml?'],
    ['next.config.ts', 'NAO tem output: "export" (se precisa de API routes)?'],
    ['package.json', 'Tem @cloudflare/next-on-pages nas dependencias?'],
    ['Build local', 'Roda "npx @cloudflare/next-on-pages" sem erros?'],
    ['Output gerado', 'Pasta .vercel/output/static foi criada com index.html?'],
    ['API routes', 'Usam export const runtime = "edge"?'],
    ['KV bindings', 'Estao configurados no wrangler.toml E no dashboard?'],
    ['Framework preset', 'Estah como "None" no Cloudflare Pages?'],
    ['Build command', 'Estah como "npx @cloudflare/next-on-pages"?'],
    ['Output directory', 'Estah como ".vercel/output/static"?'],
    ['Dominio customizado', 'Subdominio adicionado em Custom Domains do projeto?'],
    ['Environment vars', 'Variaveis de ambiente configuradas no dashboard (se necessario)?'],
    ['Public files', 'Arquivos da pasta public/ estao no repositorio (models, imagens, etc)?'],
]

cl_data = [[Paragraph('<b>Item</b>', hc), Paragraph('<b>Verificar</b>', hc)]]
for i, (item, desc) in enumerate(checklist):
    bg = colors.white if i % 2 == 0 else LIGHT
    cl_data.append([Paragraph(f'<b>{item}</b>', cell), Paragraph(desc, cell)])

cl_table = Table(cl_data, colWidths=[4*cm, 12*cm])
style_cmds = [
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
]
for i in range(1, len(cl_data)):
    bg = colors.white if i % 2 == 1 else LIGHT
    style_cmds.append(('BACKGROUND', (0,i), (-1,i), bg))
cl_table.setStyle(TableStyle(style_cmds))
story.append(Spacer(1, 12))
story.append(cl_table)
story.append(Spacer(1, 18))

# ==================== 8. ERROS COMUNS ====================
story.append(Paragraph('<b>8. Erros Comuns e Solucoes</b>', h1))
story.append(Paragraph(
    'Estes sao os erros que mais aparecem ao fazer deploy no Cloudflare Pages. Para cada um, '
    'a causa provavel e a solucao. Referencia rapida para nao perder tempo debugando.', body
))

errors = [
    [Paragraph('<b>Erro</b>', hc), Paragraph('<b>Causa</b>', hc), Paragraph('<b>Solucao</b>', hc)],
    [Paragraph('Pagina em branco', cell),
     Paragraph('Output directory errado ou framework preset errado', cell),
     Paragraph('Verifique se output e ".vercel/output/static" e preset e "None"', cell)],
    [Paragraph('no nodejs_compat flag', cell),
     Paragraph('wrangler.toml sem pages_build_output_dir', cell),
     Paragraph('Adicione pages_build_output_dir no wrangler.toml', cell)],
    [Paragraph('Module not found no build', cell),
     Paragraph('Dependencia faltando ou versao errada do Next.js', cell),
     Paragraph('Verifique package.json. Next.js deve ser 14-15.5.2', cell)],
    [Paragraph('API retorna 404', cell),
     Paragraph('KV binding nao configurado ou API route sem edge runtime', cell),
     Paragraph('Configure binding no dashboard e use runtime = "edge"', cell)],
    [Paragraph('Recursao no build', cell),
     Paragraph('Build command chama npm run build que chama o adapter', cell),
     Paragraph('Use "npx @cloudflare/next-on-pages" direto no Build command', cell)],
    [Paragraph('Erros de modulo Node.js', cell),
     Paragraph('Usou require() ou modulos do Node em code client-side', cell),
     Paragraph('Mova logica server-only para API routes com edge runtime', cell)],
    [Paragraph('Build falha com ESLint', cell),
     Paragraph('eslint-config-next com versao diferente do Next.js', cell),
     Paragraph('Alinhe versoes ou ignore ESLint no build (ignoreBuildErrors)', cell)],
    [Paragraph('wrangler.toml invalido', cell),
     Paragraph('Falta a propriedade pages_build_output_dir', cell),
     Paragraph('Adicione pages_build_output_dir = ".vercel/output/static"', cell)],
    [Paragraph('Deploy com sucesso mas site antigo', cell),
     Paragraph('Cache do Cloudflare ou deploy parcial', cell),
     Paragraph('Retry deployment ou faca um novo push no repositorio', cell)],
    [Paragraph('Dados nao persistem (F5 apaga)', cell),
     Paragraph('Fallback sobrescreve localStorage', cell),
     Paragraph('Ordem de prioridade: API > localStorage > JSON estatico', cell)],
]
story.append(Spacer(1, 12))
errors_table = Table(errors, colWidths=[3.5*cm, 5.5*cm, 7*cm])
e_style = [
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
]
for i in range(1, len(errors)):
    bg = colors.white if i % 2 == 1 else LIGHT
    e_style.append(('BACKGROUND', (0,i), (-1,i), bg))
errors_table.setStyle(TableStyle(e_style))
story.append(errors_table)
story.append(Spacer(1, 18))

# ==================== 9. CUSTOS ====================
story.append(Paragraph('<b>9. Limites e Custos (Plano Free)</b>', h1))
story.append(Paragraph(
    'O Cloudflare Pages e completamente gratuito para a maioria dos projetos da Vortek. '
    'Abaixo estao todos os limites do plano free. So e necessario pagar se voce ultrapassar '
    'estes limites, o que e raro para mini apps e sites de pequeno a medio porte. O plano '
    'pago (Workers Paid) custa $5/mes e aumenta significativamente os limites.', body
))

costs = [
    [Paragraph('<b>Recurso</b>', hc), Paragraph('<b>Free</b>', hc), Paragraph('<b>Paid ($5/mes)</b>', hc), Paragraph('<b>Impacto Vortek</b>', hc)],
    [Paragraph('Requests', cell), Paragraph('100.000/dia', cell_c), Paragraph('10 milhoes/dia', cell_c), Paragraph('Suficiente', cell)],
    [Paragraph('Bandwidth', cell), Paragraph('Ilimitado', cell_c), Paragraph('Ilimitado', cell_c), Paragraph('Sem preocupacao', cell)],
    [Paragraph('Builds/mes', cell), Paragraph('500', cell_c), Paragraph('500', cell_c), Paragraph('Mais que suficiente', cell)],
    [Paragraph('KV leituras', cell), Paragraph('100.000/dia', cell_c), Paragraph('10 milhoes/dia', cell_c), Paragraph('Suficiente', cell)],
    [Paragraph('KV escritas', cell), Paragraph('1.000/dia', cell_c), Paragraph('1 milhao/dia', cell_c), Paragraph('Suficiente', cell)],
    [Paragraph('KV armazenamento', cell), Paragraph('1 GB', cell_c), Paragraph('1 GB', cell_c), Paragraph('Muito espaco', cell)],
    [Paragraph('Workers (runtime)', cell), Paragraph('10 ms CPU/request', cell_c), Paragraph('30 ms CPU/request', cell_c), Paragraph('Suficiente', cell)],
    [Paragraph('Custom domains', cell), Paragraph('Ilimitado', cell_c), Paragraph('Ilimitado', cell_c), Paragraph('Todos subdominios', cell)],
    [Paragraph('SSL', cell), Paragraph('Gratuito', cell_c), Paragraph('Gratuito', cell_c), Paragraph('Automatico', cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(costs, [3.5*cm, 3.5*cm, 3.5*cm, 5.5*cm]))
story.append(Spacer(1, 18))

# ==================== 10. ESTRUTURA ====================
story.append(Paragraph('<b>10. Estrutura Recomendada de Projeto</b>', h1))
story.append(Paragraph(
    'Para manter consistencia entre todos os projetos da Vortek, siga esta estrutura de pastas. '
    'Ela foi desenhada para funcionar bem com o Cloudflare Pages e facilitar a manutencao. '
    'A separacao clara entre public (estaticos), src (codigo), e a presenca do wrangler.toml '
    'na raiz sao essenciais para o deploy funcionar corretamente.', body
))
story.append(Spacer(1, 8))
story.append(Paragraph(
    'meu-projeto/<br/>'
    '|-- wrangler.toml (config Cloudflare - OBRIGATORIO)<br/>'
    '|-- package.json (dependencias e scripts)<br/>'
    '|-- next.config.ts (config Next.js - SEM output: "export")<br/>'
    '|-- public/ (arquivos estaticos servidos diretamente)<br/>'
    '|    |-- data/ (JSONs de dados iniciais/fallback)<br/>'
    '|    |-- models/ (modelos ML, assets pesados)<br/>'
    '|    |-- _headers (cache headers customizados)<br/>'
    '|-- src/<br/>'
    '|    |-- app/ (rotas Next.js App Router)<br/>'
    '|    |    |-- page.tsx (pagina principal)<br/>'
    '|    |    |-- layout.tsx (layout global)<br/>'
    '|    |    |-- api/ (API routes com edge runtime)<br/>'
    '|    |-- components/ (componentes React)<br/>'
    '|    |-- lib/ (funcoes utilitarias, tipos)', code
))
story.append(Spacer(1, 12))

story.append(Paragraph(
    '<b>Regra de ouro:</b> Tudo que precisa ser acessivel por URL (imagens, JSONs, modelos) '
    'vai na pasta public/. Tudo que e codigo React/Next.js vai em src/. O wrangler.toml '
    'fica na raiz do projeto, nunca dentro de src/ ou public/.', note_s
))

# ==================== 11. COMANDOS ====================
story.append(Spacer(1, 12))
story.append(Paragraph('<b>11. Comandos Uteis</b>', h1))

cmds = [
    [Paragraph('<b>Comando</b>', hc), Paragraph('<b>Uso</b>', hc)],
    [Paragraph('npx @cloudflare/next-on-pages', code_sm), Paragraph('Build para Cloudflare Pages', cell)],
    [Paragraph('npx wrangler pages dev .vercel/output/static', code_sm), Paragraph('Testar localmente com Workers', cell)],
    [Paragraph('npx wrangler pages deploy .vercel/output/static', code_sm), Paragraph('Deploy manual via CLI', cell)],
    [Paragraph('npx wrangler kv namespace create "NOME"', code_sm), Paragraph('Criar namespace KV', cell)],
    [Paragraph('npx wrangler kv key put --namespace-id=ID "chave" "valor"', code_sm), Paragraph('Escrever chave no KV', cell)],
    [Paragraph('npx wrangler kv key get --namespace-id=ID "chave"', code_sm), Paragraph('Ler chave do KV', cell)],
    [Paragraph('npx wrangler pages project list', code_sm), Paragraph('Listar projetos Pages', cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(cmds, [8.5*cm, 7.5*cm]))

# Build
doc.build(story)
print(f'PDF gerado: {pdf_path}')
