from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import cm, inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# Font registration
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

pdf_path = '/home/z/my-project/download/guia-deploy-cloudflare-pages-v2.pdf'
os.makedirs('/home/z/my-project/download', exist_ok=True)

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    title='guia-deploy-cloudflare-pages-v2',
    author='Z.ai',
    creator='Z.ai',
    subject='Guia de deploy do Base Perfeita no Cloudflare Pages com Next.js preset',
    leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm
)

# Colors
PINK = colors.HexColor('#E91E63')
DARK_BLUE = colors.HexColor('#1F4E79')
LIGHT_GRAY = colors.HexColor('#F5F5F5')
ACCENT = colors.HexColor('#FF6B9D')

# Styles
cover_title = ParagraphStyle(
    name='CoverTitle', fontName='SimHei', fontSize=36, leading=44,
    alignment=TA_CENTER, textColor=PINK, spaceAfter=20
)
cover_subtitle = ParagraphStyle(
    name='CoverSubtitle', fontName='SimHei', fontSize=16, leading=24,
    alignment=TA_CENTER, textColor=colors.HexColor('#333333'), spaceAfter=12
)
cover_info = ParagraphStyle(
    name='CoverInfo', fontName='SimHei', fontSize=12, leading=18,
    alignment=TA_CENTER, textColor=colors.HexColor('#666666'), spaceAfter=8
)
h1 = ParagraphStyle(
    name='H1', fontName='SimHei', fontSize=20, leading=28,
    textColor=PINK, spaceBefore=24, spaceAfter=12
)
h2 = ParagraphStyle(
    name='H2', fontName='SimHei', fontSize=15, leading=22,
    textColor=DARK_BLUE, spaceBefore=18, spaceAfter=8
)
h3 = ParagraphStyle(
    name='H3', fontName='SimHei', fontSize=12, leading=18,
    textColor=colors.HexColor('#333333'), spaceBefore=12, spaceAfter=6
)
body = ParagraphStyle(
    name='Body', fontName='SimHei', fontSize=10.5, leading=18,
    alignment=TA_LEFT, spaceAfter=6, wordWrap='CJK'
)
body_indent = ParagraphStyle(
    name='BodyIndent', fontName='SimHei', fontSize=10.5, leading=18,
    alignment=TA_LEFT, spaceAfter=6, leftIndent=20, wordWrap='CJK'
)
code_style = ParagraphStyle(
    name='Code', fontName='DejaVuSans', fontSize=9, leading=14,
    alignment=TA_LEFT, spaceAfter=4, leftIndent=20,
    backColor=colors.HexColor('#F8F8F8'), borderColor=colors.HexColor('#DDD'),
    borderWidth=0.5, borderPadding=6
)
note_style = ParagraphStyle(
    name='Note', fontName='SimHei', fontSize=10, leading=16,
    alignment=TA_LEFT, spaceAfter=8, leftIndent=20, rightIndent=20,
    backColor=colors.HexColor('#FFF3E0'), borderColor=colors.HexColor('#FF9800'),
    borderWidth=1, borderPadding=8, textColor=colors.HexColor('#E65100')
)
step_num = ParagraphStyle(
    name='StepNum', fontName='SimHei', fontSize=13, leading=20,
    alignment=TA_CENTER, textColor=colors.white, spaceAfter=4
)

# Table styles
header_cell = ParagraphStyle(
    name='HeaderCell', fontName='SimHei', fontSize=10, leading=14,
    alignment=TA_CENTER, textColor=colors.white
)
cell = ParagraphStyle(
    name='Cell', fontName='SimHei', fontSize=10, leading=14,
    alignment=TA_LEFT, wordWrap='CJK'
)
cell_center = ParagraphStyle(
    name='CellCenter', fontName='SimHei', fontSize=10, leading=14,
    alignment=TA_CENTER, wordWrap='CJK'
)
code_cell = ParagraphStyle(
    name='CodeCell', fontName='DejaVuSans', fontSize=8.5, leading=12,
    alignment=TA_LEFT
)

story = []

# ===================== COVER =====================
story.append(Spacer(1, 100))
story.append(Paragraph('<b>Base Perfeita</b>', cover_title))
story.append(Spacer(1, 20))
story.append(Paragraph('Guia de Deploy no Cloudflare Pages', cover_subtitle))
story.append(Spacer(1, 12))
story.append(Paragraph('Versao 2.0 - Usando preset Next.js + @cloudflare/next-on-pages', cover_info))
story.append(Spacer(1, 60))
story.append(Paragraph('2026', cover_info))
story.append(PageBreak())

# ===================== SECTION 1: OVERVIEW =====================
story.append(Paragraph('<b>1. Visao Geral da Configuracao</b>', h1))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Este guia explica como fazer o deploy do projeto Base Perfeita no Cloudflare Pages '
    'usando o preset nativo "Next.js" no dashboard. O projeto utiliza o adapter '
    '@cloudflare/next-on-pages, que permite rodar aplicaes Next.js completas (com API routes) '
    'diretamente no edge do Cloudflare. Esta abordagem e a forma recomendada e oficial de '
    'deployar Next.js no Cloudflare Pages, oferecendo suporte total a SSR, API routes, '
    'e client-side routing sem as limitacoes do static export.', body
))
story.append(Paragraph(
    'O Base Perfeita e um widget de analise de tom de pele que detecta faces, analisa '
    'subtom e profundidade, e recomenda bases de maquiagem. Ele usa face-api.js para '
    'deteccao facial no lado do cliente e Cloudflare KV para armazenar o catalogo de produtos. '
    'O KV funciona como um banco de dados chave-valor simples, gratuito no plano free '
    '(100.000 leituras/dia e 1.000 escritas/dia), e perfeitamente adequado para esta aplicacao.', body
))

story.append(Paragraph('<b>1.1 Arquitetura do Deploy</b>', h2))
story.append(Paragraph(
    'A arquitetura funciona da seguinte forma: o Cloudflare Pages detecta automaticamente '
    'que o projeto usa Next.js e configura tudo. O build command executa o @cloudflare/next-on-pages, '
    'que compila a aplicacao e gera um worker otimizado. As paginas estaticas sao servidas '
    'diretamente do CDN do Cloudflare, enquanto as API routes rodam como Edge Functions. '
    'O binding de KV e injetado automaticamente pela plataforma, sem necessidade de '
    'configuracoes complexas ou variaveis de ambiente adicionais.', body
))

# Architecture table
arch_data = [
    [Paragraph('<b>Componente</b>', header_cell), Paragraph('<b>Tecnologia</b>', header_cell), Paragraph('<b>Descricao</b>', header_cell)],
    [Paragraph('Frontend', cell), Paragraph('Next.js 15 + React 19', cell), Paragraph('Widget de analise facial com face-api.js', cell)],
    [Paragraph('API Routes', cell), Paragraph('Edge Functions', cell), Paragraph('Rodam no edge do Cloudflare via @cloudflare/next-on-pages', cell)],
    [Paragraph('Armazenamento', cell), Paragraph('Cloudflare KV', cell), Paragraph('Catalogo de produtos e configuracoes', cell)],
    [Paragraph('Build', cell), Paragraph('@cloudflare/next-on-pages', cell), Paragraph('Compila Next.js para o formato do Cloudflare', cell)],
    [Paragraph('CDN', cell), Paragraph('Cloudflare Pages', cell), Paragraph('Distribuicao global de assets estaticos', cell)],
]
arch_table = Table(arch_data, colWidths=[3*cm, 4*cm, 9.5*cm])
arch_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('BACKGROUND', (0,1), (-1,1), colors.white),
    ('BACKGROUND', (0,2), (-1,2), LIGHT_GRAY),
    ('BACKGROUND', (0,3), (-1,3), colors.white),
    ('BACKGROUND', (0,4), (-1,4), LIGHT_GRAY),
    ('BACKGROUND', (0,5), (-1,5), colors.white),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(Spacer(1, 18))
story.append(arch_table)
story.append(Spacer(1, 18))

# ===================== SECTION 2: PREREQUISITES =====================
story.append(Paragraph('<b>2. Pre-requisitos</b>', h1))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Antes de comecar o deploy, certifique-se de que voce tem os seguintes itens prontos. '
    'Todos sao gratuitos e podem ser criados em poucos minutos:', body
))

prereq_data = [
    [Paragraph('<b>Item</b>', header_cell), Paragraph('<b>Onde criar</b>', header_cell), Paragraph('<b>Custo</b>', header_cell)],
    [Paragraph('Conta Cloudflare', cell), Paragraph('dash.cloudflare.com/sign-up', cell_center), Paragraph('Gratuito', cell_center)],
    [Paragraph('Repositorio Git (GitHub/GitLab/Bitbucket)', cell), Paragraph('github.com', cell_center), Paragraph('Gratuito', cell_center)],
    [Paragraph('Projeto Base Perfeita (codigo ja configurado)', cell), Paragraph('Ja esta no seu repositorio', cell_center), Paragraph('-', cell_center)],
]
prereq_table = Table(prereq_data, colWidths=[6*cm, 6*cm, 3*cm])
prereq_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('BACKGROUND', (0,1), (-1,1), colors.white),
    ('BACKGROUND', (0,2), (-1,2), LIGHT_GRAY),
    ('BACKGROUND', (0,3), (-1,3), colors.white),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(Spacer(1, 18))
story.append(prereq_table)
story.append(Spacer(1, 18))

story.append(Paragraph('<b>Arquivos ja configurados no projeto:</b>', h3))
story.append(Paragraph('- package.json: Next.js 15.5.2 + @cloudflare/next-on-pages', body_indent))
story.append(Paragraph('- next.config.ts: Configurado sem output: "export"', body_indent))
story.append(Paragraph('- wrangler.toml: Referencia para binding KV', body_indent))
story.append(Paragraph('- src/app/api/catalog/route.ts: API route com suporte a KV', body_indent))
story.append(Paragraph('- public/data/catalog.json: Catalogo estatico (fallback)', body_indent))
story.append(Paragraph('- public/models/: Modelos do face-api.js', body_indent))

# ===================== SECTION 3: STEP BY STEP =====================
story.append(Spacer(1, 18))
story.append(Paragraph('<b>3. Deploy Passo a Passo</b>', h1))
story.append(Spacer(1, 6))

# STEP 1
story.append(Paragraph('<b>Passo 1: Criar o Namespace KV no Cloudflare</b>', h2))
story.append(Paragraph(
    'O Cloudflare KV e o banco de dados que armazena o catalogo de produtos do Base Perfeita. '
    'Ele funciona como um dicionario chave-valor simples e ultra-rapido. No plano gratuito, '
    'voce tem direito a 100.000 leituras por dia e 1.000 escritas por dia, o que e mais do '
    'que suficiente para esta aplicacao. Siga estes passos para criar o namespace:', body
))
story.append(Paragraph('1. Acesse o dashboard do Cloudflare: dash.cloudflare.com', body_indent))
story.append(Paragraph('2. No menu lateral, clique em "Workers & Pages" e depois em "KV"', body_indent))
story.append(Paragraph('3. Clique no botao "Create a namespace"', body_indent))
story.append(Paragraph('4. No nome, digite: CATALOG_KV', body_indent))
story.append(Paragraph('5. Clique em "Add"', body_indent))
story.append(Paragraph('6. Copie o ID do namespace que aparece na lista (voce vai precisar dele)', body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    '<b>Importante:</b> Anote o ID do namespace KV que foi gerado. Ele parece com algo como '
    '"a1b2c3d4e5f6...". Voce vai usar este ID na configuracao do binding no passo 4.', note_style
))

# STEP 2
story.append(Paragraph('<b>Passo 2: Conectar o Repositorio ao Cloudflare Pages</b>', h2))
story.append(Paragraph(
    'Agora voce vai criar o projeto no Cloudflare Pages e conecta-lo ao seu repositorio Git. '
    'Isso permite deploys automaticos a cada push na branch principal. Siga estes passos com atencao:', body
))
story.append(Paragraph('1. No dashboard do Cloudflare, va em "Workers & Pages"', body_indent))
story.append(Paragraph('2. Clique em "Create application" e depois em "Pages"', body_indent))
story.append(Paragraph('3. Clique em "Connect to Git"', body_indent))
story.append(Paragraph('4. Selecione o provedor (GitHub, GitLab ou Bitbucket)', body_indent))
story.append(Paragraph('5. Autorize o acesso e selecione o repositorio do Base Perfeita', body_indent))
story.append(Paragraph('6. Configure as opcoes de build (detalhadas no Passo 3 abaixo)', body_indent))
story.append(Paragraph('7. Clique em "Save and Deploy"', body_indent))

# STEP 3
story.append(Paragraph('<b>Passo 3: Configurar o Build (IMPORTANTE)</b>', h2))
story.append(Paragraph(
    'Esta e a parte mais critica do processo. Nas configuracoes de build do Cloudflare Pages, '
    'preencha EXATAMENTE os campos abaixo. NAO use outras opcoes de framework, pois o projeto '
    'ja esta configurado para funcionar com o @cloudflare/next-on-pages:', body
))

build_data = [
    [Paragraph('<b>Campo</b>', header_cell), Paragraph('<b>Valor EXATO</b>', header_cell)],
    [Paragraph('Framework preset', cell), Paragraph('None', cell_center)],
    [Paragraph('Build command', cell), Paragraph('npx @cloudflare/next-on-pages', code_cell)],
    [Paragraph('Build output directory', cell), Paragraph('.vercel/output/static', code_cell)],
    [Paragraph('Root directory', cell), Paragraph('/ (deixe vazio)', cell_center)],
]
build_table = Table(build_data, colWidths=[5*cm, 8*cm])
build_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('BACKGROUND', (0,1), (-1,1), colors.white),
    ('BACKGROUND', (0,2), (-1,2), LIGHT_GRAY),
    ('BACKGROUND', (0,3), (-1,3), colors.white),
    ('BACKGROUND', (0,4), (-1,4), LIGHT_GRAY),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
]))
story.append(Spacer(1, 18))
story.append(build_table)
story.append(Spacer(1, 12))

story.append(Paragraph(
    '<b>Atencao:</b> O Framework preset DEVE ser "None". NAO selecione "Next.js" no menu '
    'suspenso de frameworks. O Cloudflare Pages detectaria e tentaria usar um metodo diferente, '
    'que causaria erros. Nos estamos usando o @cloudflare/next-on-pages manualmente, entao '
    'deixamos como "None" e especificamos o build command manualmente.', note_style
))

story.append(Spacer(1, 8))
story.append(Paragraph(
    'Apos clicar em "Save and Deploy", o Cloudflare Pages vai clonar o repositorio, instalar '
    'as dependencias, rodar o build command e fazer o deploy. O primeiro deploy pode levar '
    '2-3 minutos. Se tudo estiver correto, voce verah a mensagem de sucesso e podera acessar '
    'a URL do projeto (algo como base-perfeita.pages.dev).', body
))

# STEP 4
story.append(Paragraph('<b>Passo 4: Configurar o Binding KV (Pos-Deploy)</b>', h2))
story.append(Paragraph(
    'Esta configuracao so pode ser feita DEPOIS do primeiro deploy, pois o binding de KV '
    'e configurado nas funcoes do Cloudflare Pages. O binding conecta a API route ao namespace '
    'KV que voce criou no Passo 1. Sem ele, a API retorna 404 e o sistema usa o fallback '
    'estatico (catalog.json). Siga estes passos:', body
))
story.append(Paragraph('1. Acesse o dashboard do Cloudflare', body_indent))
story.append(Paragraph('2. Vá em "Workers & Pages" e clique no seu projeto (Base Perfeita)', body_indent))
story.append(Paragraph('3. Va em "Settings" (Configuracoes) no menu superior', body_indent))
story.append(Paragraph('4. Clique em "Functions" no menu lateral esquerdo', body_indent))
story.append(Paragraph('5. Vá em "KV namespace bindings"', body_indent))
story.append(Paragraph('6. Clique em "Add binding"', body_indent))
story.append(Paragraph('7. Preencha:', body_indent))
story.append(Paragraph('    - Variable name: CATALOG_KV', body_indent))
story.append(Paragraph('    - KV namespace: selecione o namespace que voce criou no Passo 1', body_indent))
story.append(Paragraph('8. Clique em "Save"', body_indent))
story.append(Spacer(1, 8))

binding_data = [
    [Paragraph('<b>Campo</b>', header_cell), Paragraph('<b>Valor</b>', header_cell)],
    [Paragraph('Variable name', cell), Paragraph('CATALOG_KV', code_cell)],
    [Paragraph('KV namespace', cell), Paragraph('Selecione o namespace criado no Passo 1', cell)],
]
binding_table = Table(binding_data, colWidths=[5*cm, 8*cm])
binding_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('BACKGROUND', (0,1), (-1,1), colors.white),
    ('BACKGROUND', (0,2), (-1,2), LIGHT_GRAY),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
]))
story.append(Spacer(1, 12))
story.append(binding_table)
story.append(Spacer(1, 12))

story.append(Paragraph(
    '<b>Importante:</b> Apos salvar o binding, faca um novo deploy (voce pode ir em "Deployments" '
    'e clicar em "Retry deployment" no ultimo deploy) para que o binding seja aplicado. '
    'Alternativamente, faca um novo push no repositorio.', note_style
))

# STEP 5
story.append(Paragraph('<b>Passo 5: Verificar o Deploy</b>', h2))
story.append(Paragraph(
    'Apos o deploy concluir com sucesso e o binding KV estar configurado, siga estes passos '
    'para verificar que tudo esta funcionando corretamente:', body
))
story.append(Paragraph('1. Acesse a URL do projeto (ex: https://base-perfeita.pages.dev)', body_indent))
story.append(Paragraph('2. A pagina principal do widget deve carregar normalmente', body_indent))
story.append(Paragraph('3. Teste a analise facial (permisse acesso a camera)', body_indent))
story.append(Paragraph('4. Acesse /admin para gerenciar o catalogo', body_indent))
story.append(Paragraph('5. No admin, faca alteracoes e salve para testar o KV', body_indent))

# ===================== SECTION 4: FILES OVERVIEW =====================
story.append(Spacer(1, 18))
story.append(Paragraph('<b>4. Arquivos Importantes do Projeto</b>', h1))
story.append(Spacer(1, 6))

files_data = [
    [Paragraph('<b>Arquivo</b>', header_cell), Paragraph('<b>Papel</b>', header_cell)],
    [Paragraph('next.config.ts', code_cell), Paragraph('Config do Next.js. Sem output: "export".', cell)],
    [Paragraph('package.json', code_cell), Paragraph('Dependencias (Next.js 15.5.2, @cloudflare/next-on-pages). Build: next build', cell)],
    [Paragraph('wrangler.toml', code_cell), Paragraph('Referencia para KV binding (o binding real e no dashboard)', cell)],
    [Paragraph('src/app/api/catalog/route.ts', code_cell), Paragraph('API route que usa KV via getRequestContext(). Edge runtime.', cell)],
    [Paragraph('src/lib/catalog.ts', code_cell), Paragraph('Camada de dados. Fallback: API > JSON > localStorage', cell)],
    [Paragraph('public/data/catalog.json', code_cell), Paragraph('Catalogo estatico usado como fallback quando KV nao tem dados', cell)],
    [Paragraph('public/models/', code_cell), Paragraph('Modelos do face-api.js (tiny face detector + landmarks)', cell)],
    [Paragraph('public/_headers', code_cell), Paragraph('Headers de cache para modelos (cache longo)', cell)],
]
files_table = Table(files_data, colWidths=[5.5*cm, 10*cm])
files_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('BACKGROUND', (0,1), (-1,1), colors.white),
    ('BACKGROUND', (0,2), (-1,2), LIGHT_GRAY),
    ('BACKGROUND', (0,3), (-1,3), colors.white),
    ('BACKGROUND', (0,4), (-1,4), LIGHT_GRAY),
    ('BACKGROUND', (0,5), (-1,5), colors.white),
    ('BACKGROUND', (0,6), (-1,6), LIGHT_GRAY),
    ('BACKGROUND', (0,7), (-1,7), colors.white),
    ('BACKGROUND', (0,8), (-1,8), LIGHT_GRAY),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
story.append(Spacer(1, 12))
story.append(files_table)
story.append(Spacer(1, 18))

# ===================== SECTION 5: TROUBLESHOOTING =====================
story.append(Paragraph('<b>5. Solucao de Problemas</b>', h1))
story.append(Spacer(1, 6))

story.append(Paragraph('<b>5.1 Pagina em branco apos o deploy</b>', h2))
story.append(Paragraph(
    'Se voce acessar o site e a pagina estiver completamente em branco (sem conteudo nenhum), '
    'os problemas mais comuns sao:', body
))
story.append(Paragraph('<b>Causa A: Build output directory errado.</b> Verifique se o campo "Build output directory" '
    'nas configuracoes do Cloudflare Pages esta exatamente como ".vercel/output/static" (com o ponto no inicio). '
    'Se estiver apenas "out" ou "vercel/output/static", a pagina nao sera encontrada.', body_indent))
story.append(Paragraph('<b>Causa B: Build command errado.</b> O build command deve ser "npx @cloudflare/next-on-pages". '
    'Nao use "next build" ou "npm run build" sozinho, pois isso gera a saida padrao do Next.js e nao o formato '
    'otimizado para o Cloudflare.', body_indent))
story.append(Paragraph('<b>Causa C: Framework preset errado.</b> Se voce selecionou "Next.js" como framework, '
    'o Cloudflare Pages tentara usar um metodo de build diferente. Mude para "None".', body_indent))

story.append(Paragraph('<b>5.2 Erro 404 ao acessar /admin</b>', h2))
story.append(Paragraph(
    'Se a pagina principal funciona mas /admin retorna 404, verifique se o build foi concluido '
    'com sucesso. As vezes o Cloudflare Pages faz o deploy parcial. Va em "Deployments" no '
    'dashboard e verifique se o ultimo build foi concluido com sucesso. Se necessario, clique em '
    '"Retry deployment" para refazer o deploy completo. Verifique tambem se voce esta acessando '
    '/admin e nao /admin/ (embora ambos devam funcionar).', body
))

story.append(Paragraph('<b>5.3 API retorna 404 ou 503</b>', h2))
story.append(Paragraph(
    'Se a API route /api/catalog nao funciona, verifique: (1) se o binding KV esta configurado '
    'corretamente em Settings > Functions > KV namespace bindings, com o nome exato "CATALOG_KV"; '
    '(2) se o namespace KV selecionado e o mesmo que voce criou; (3) se voce refez o deploy apos '
    'configurar o binding. Enquanto o KV nao estiver disponivel, o sistema funciona normalmente '
    'usando o arquivo catalog.json estatico como fallback.', body
))

story.append(Paragraph('<b>5.4 Erro de build - modulo nao encontrado</b>', h2))
story.append(Paragraph(
    'Se o build falhar com erros de modulo nao encontrado, certifique-se de que o package.json '
    'do repositorio esta atualizado com todas as dependencias. O diff do commit deve mostrar a '
    'adicao de "@cloudflare/next-on-pages" e a mudanca do Next.js para a versao 15.5.2. Se o '
    'erro persistir, tente fazer um deploy manual via "Wrangler CLI" rodando "npx @cloudflare/next-on-pages" '
    'localmente e depois "npx wrangler pages deploy .vercel/output/static".', body
))

story.append(Paragraph('<b>5.5 Deteccao facial nao funciona no deploy</b>', h2))
story.append(Paragraph(
    'Se a deteccao facial nao funciona apos o deploy, o problema geralmente esta relacionado ao '
    'carregamento dos modelos do face-api.js. Verifique se a pasta public/models/ esta no repositorio '
    'e se os arquivos .bin e .json estao presentes. O Cloudflare Pages deve servir estes arquivos '
    'automaticamente. Voce pode verificar abrindo as ferramentas de desenvolvedor do navegador '
    '(F12) e verificando a aba Network para ver se ha erros 404 ao carregar os modelos.', body
))

# ===================== SECTION 6: COSTS =====================
story.append(Spacer(1, 12))
story.append(Paragraph('<b>6. Custos</b>', h1))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'O Cloudflare Pages e completamente gratuito para a maioria dos casos de uso. Abaixo estao '
    'os limites do plano gratuito que se aplicam ao Base Perfeita:', body
))

cost_data = [
    [Paragraph('<b>Recurso</b>', header_cell), Paragraph('<b>Limite Free</b>', header_cell), Paragraph('<b>Impacto</b>', header_cell)],
    [Paragraph('Requests', cell), Paragraph('100.000/dia', cell_center), Paragraph('Suficiente para uso normal', cell)],
    [Paragraph('KV leituras', cell), Paragraph('100.000/dia', cell_center), Paragraph('Cada carregamento faz 1 leitura', cell)],
    [Paragraph('KV escritas', cell), Paragraph('1.000/dia', cell_center), Paragraph('So ao salvar no admin', cell)],
    [Paragraph('Largura de banda', cell), Paragraph('Ilimitado', cell_center), Paragraph('Sem preocupacoes', cell)],
    [Paragraph('Builds/mes', cell), Paragraph('500', cell_center), Paragraph('Mais que suficiente', cell)],
]
cost_table = Table(cost_data, colWidths=[4*cm, 3.5*cm, 7*cm])
cost_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('BACKGROUND', (0,1), (-1,1), colors.white),
    ('BACKGROUND', (0,2), (-1,2), LIGHT_GRAY),
    ('BACKGROUND', (0,3), (-1,3), colors.white),
    ('BACKGROUND', (0,4), (-1,4), LIGHT_GRAY),
    ('BACKGROUND', (0,5), (-1,5), colors.white),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(Spacer(1, 12))
story.append(cost_table)
story.append(Spacer(1, 18))

# ===================== SECTION 7: SUMMARY =====================
story.append(Paragraph('<b>7. Resumo Rapido dos Passos</b>', h1))
story.append(Spacer(1, 6))

summary_steps = [
    ['1', 'Criar namespace KV no Cloudflare (Workers > KV > Create > nome: CATALOG_KV)'],
    ['2', 'Conectar repositorio ao Cloudflare Pages (Workers > Pages > Create > Connect to Git)'],
    ['3', 'Configurar build: preset None, command "npx @cloudflare/next-on-pages", output ".vercel/output/static"'],
    ['4', 'Fazer deploy inicial (Save and Deploy)'],
    ['5', 'Configurar KV binding (Settings > Functions > KV namespace bindings > CATALOG_KV)'],
    ['6', 'Refazer deploy para aplicar o binding (Retry deployment)'],
    ['7', 'Testar: acessar a URL, testar analise facial, acessar /admin'],
]
for num, text in summary_steps:
    step_data = [[
        Paragraph(f'<b>{num}</b>', step_num),
        Paragraph(text, ParagraphStyle(name=f'summary_{num}', fontName='SimHei', fontSize=10, leading=16, alignment=TA_LEFT, wordWrap='CJK'))
    ]]
    step_box = Table(step_data, colWidths=[1*cm, 14*cm])
    step_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), PINK),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
    ]))
    story.append(step_box)
    story.append(Spacer(1, 4))

# Build
doc.build(story)
print(f'PDF gerado em: {pdf_path}')
