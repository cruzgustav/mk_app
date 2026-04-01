from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# ---- Font Registration ----
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ---- Colors ----
ROSE = colors.HexColor('#E11D48')
DARK = colors.HexColor('#1E293B')
GRAY = colors.HexColor('#64748B')
LIGHT_BG = colors.HexColor('#FFF1F2')
BLUE = colors.HexColor('#1F4E79')
STEP_BG = colors.HexColor('#FFF7ED')
STEP_BORDER = colors.HexColor('#F97316')
CODE_BG = colors.HexColor('#F1F5F9')
WHITE = colors.white

# ---- Styles ----
title_style = ParagraphStyle(
    name='Title', fontName='SimHei', fontSize=28, leading=36,
    alignment=TA_CENTER, textColor=ROSE, spaceAfter=12
)
subtitle_style = ParagraphStyle(
    name='Subtitle', fontName='SimHei', fontSize=13, leading=20,
    alignment=TA_CENTER, textColor=GRAY, spaceAfter=6
)
h1_style = ParagraphStyle(
    name='H1', fontName='SimHei', fontSize=16, leading=24,
    textColor=ROSE, spaceBefore=18, spaceAfter=10
)
h2_style = ParagraphStyle(
    name='H2', fontName='SimHei', fontSize=13, leading=20,
    textColor=DARK, spaceBefore=14, spaceAfter=8
)
body_style = ParagraphStyle(
    name='Body', fontName='SimHei', fontSize=10, leading=17,
    textColor=DARK, alignment=TA_LEFT, spaceAfter=4, wordWrap='CJK'
)
code_style = ParagraphStyle(
    name='Code', fontName='DejaVuSans', fontSize=8.5, leading=13,
    textColor=DARK, backColor=CODE_BG, leftIndent=10, rightIndent=10,
    spaceBefore=2, spaceAfter=2, borderPadding=(6, 8, 6, 8)
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='SimHei', fontSize=10, leading=17,
    textColor=DARK, leftIndent=20, bulletIndent=8, spaceAfter=3, wordWrap='CJK'
)
tip_style = ParagraphStyle(
    name='Tip', fontName='SimHei', fontSize=9.5, leading=16,
    textColor=colors.HexColor('#92400E'), backColor=colors.HexColor('#FFFBEB'),
    leftIndent=10, rightIndent=10, spaceBefore=4, spaceAfter=4,
    borderPadding=(8, 10, 8, 10), wordWrap='CJK'
)
step_num_style = ParagraphStyle(
    name='StepNum', fontName='SimHei', fontSize=10, leading=16,
    textColor=WHITE, alignment=TA_CENTER
)
step_title_style = ParagraphStyle(
    name='StepTitle', fontName='SimHei', fontSize=11, leading=18,
    textColor=DARK, spaceBefore=4, spaceAfter=6
)
footer_style = ParagraphStyle(
    name='Footer', fontName='SimHei', fontSize=8, leading=12,
    textColor=GRAY, alignment=TA_CENTER
)
header_cell_style = ParagraphStyle(
    name='HeaderCell', fontName='SimHei', fontSize=10, leading=14,
    textColor=WHITE, alignment=TA_CENTER
)
cell_style = ParagraphStyle(
    name='Cell', fontName='SimHei', fontSize=9.5, leading=14,
    textColor=DARK, alignment=TA_CENTER, wordWrap='CJK'
)
cell_left_style = ParagraphStyle(
    name='CellLeft', fontName='SimHei', fontSize=9.5, leading=14,
    textColor=DARK, alignment=TA_LEFT, wordWrap='CJK'
)
small_style = ParagraphStyle(
    name='Small', fontName='SimHei', fontSize=9, leading=14,
    textColor=GRAY, alignment=TA_LEFT, wordWrap='CJK'
)

# ---- Helpers ----
def heading(text, style=h1_style):
    return Paragraph(f'<b>{text}</b>', style)

def subheading(text):
    return Paragraph(f'<b>{text}</b>', h2_style)

def body(text):
    return Paragraph(text, body_style)

def bullet(text):
    return Paragraph(text, bullet_style)

def code(text):
    return Paragraph(text, code_style)

def tip(text):
    return Paragraph(text, tip_style)

def spacer(h=8):
    return Spacer(1, h)

def step_block(num, title, items):
    """Create a step block with orange number badge"""
    elements = []
    # Step header with number badge
    num_para = Paragraph(f'<b>Passo {num}</b>', step_num_style)
    title_para = Paragraph(f'<b>{title}</b>', step_title_style)
    header_table = Table(
        [[num_para, title_para]],
        colWidths=[1.2*cm, 14.3*cm]
    )
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), STEP_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, 0), 0),
        ('RIGHTPADDING', (0, 0), (0, 0), 0),
        ('TOPPADDING', (0, 0), (0, 0), 6),
        ('BOTTOMPADDING', (0, 0), (0, 0), 6),
        ('LEFTPADDING', (1, 0), (1, 0), 8),
        ('TOPPADDING', (1, 0), (1, 0), 8),
        ('BOTTOMPADDING', (1, 0), (1, 0), 8),
        ('BACKGROUND', (1, 0), (1, 0), STEP_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, STEP_BORDER),
    ]))
    elements.append(header_table)
    elements.append(spacer(4))
    for item in items:
        elements.append(item)
        elements.append(spacer(3))
    elements.append(spacer(8))
    return elements


# ---- Build Document ----
pdf_path = '/home/z/my-project/download/guia-deploy-cloudflare-pages.pdf'
doc = SimpleDocTemplate(
    pdf_path, pagesize=A4,
    topMargin=1.8*cm, bottomMargin=1.8*cm,
    leftMargin=2*cm, rightMargin=2*cm,
    title='guia-deploy-cloudflare-pages',
    author='Z.ai', creator='Z.ai',
    subject='Guia de deploy do Base Perfeita no Cloudflare Pages com KV'
)

story = []

# ============== COVER PAGE ==============
story.append(Spacer(1, 100))
story.append(Paragraph('<b>Guia de Deploy</b>', title_style))
story.append(Spacer(1, 8))
story.append(Paragraph('<b>Base Perfeita no Cloudflare Pages</b>', ParagraphStyle(
    name='CoverSub2', fontName='SimHei', fontSize=18, leading=26,
    alignment=TA_CENTER, textColor=DARK
)))
story.append(Spacer(1, 30))
story.append(Paragraph('Deploy completo com KV, Pages Functions e static export', subtitle_style))
story.append(Spacer(1, 50))

# Cover info box
cover_data = [
    [Paragraph('<b>Projeto</b>', cell_left_style), Paragraph('Base Perfeita', cell_left_style)],
    [Paragraph('<b>Framework</b>', cell_left_style), Paragraph('Next.js 16 + React 19', cell_left_style)],
    [Paragraph('<b>Hospedagem</b>', cell_left_style), Paragraph('Cloudflare Pages (gratuito)', cell_left_style)],
    [Paragraph('<b>Banco de dados</b>', cell_left_style), Paragraph('Cloudflare KV (gratuito)', cell_left_style)],
    [Paragraph('<b>IA Facial</b>', cell_left_style), Paragraph('face-api.js (client-side)', cell_left_style)],
]
cover_table = Table(cover_data, colWidths=[4*cm, 11.5*cm])
cover_table.setStyle(TableStyle([
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8FAFC')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(cover_table)
story.append(Spacer(1, 60))
story.append(Paragraph('Gerado automaticamente por Z.ai', footer_style))

story.append(PageBreak())

# ============== SECTION 1: OVERVIEW ==============
story.append(heading('Visao Geral da Arquitetura'))
story.append(body(
    'O projeto Base Perfeita foi adaptado para funcionar completamente no Cloudflare Pages. '
    'Todo o frontend e gerado como arquivos estaticos (HTML/CSS/JS) e a API de catalogo usa '
    'Cloudflare Pages Functions com KV como banco de dados. O custo total e zero reais por mes.'
))
story.append(spacer(10))

# Architecture diagram as table
arch_data = [
    [Paragraph('<b>Camada</b>', header_cell_style),
     Paragraph('<b>Tecnologia</b>', header_cell_style),
     Paragraph('<b>Detalhes</b>', header_cell_style)],
    [Paragraph('Frontend', cell_style),
     Paragraph('Next.js Static Export', cell_left_style),
     Paragraph('HTML/CSS/JS puro, servido pelo CDN do Cloudflare', cell_left_style)],
    [Paragraph('API', cell_style),
     Paragraph('Pages Functions', cell_left_style),
     Paragraph('Edge functions em TypeScript, rodam proximo ao usuario', cell_left_style)],
    [Paragraph('Banco', cell_style),
     Paragraph('Cloudflare KV', cell_left_style),
     Paragraph('Key-value store global com replicacao automatica', cell_left_style)],
    [Paragraph('IA Facial', cell_style),
     Paragraph('face-api.js', cell_left_style),
     Paragraph('100% client-side no navegador do usuario', cell_left_style)],
]
arch_table = Table(arch_data, colWidths=[3*cm, 4*cm, 8.5*cm])
arch_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('BACKGROUND', (0, 1), (-1, 1), WHITE),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), WHITE),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(arch_table)
story.append(spacer(6))
story.append(Paragraph('Tabela 1: Arquitetura do deploy no Cloudflare Pages', ParagraphStyle(
    name='Caption', fontName='SimHei', fontSize=9, leading=12,
    alignment=TA_CENTER, textColor=GRAY
)))
story.append(spacer(12))

story.append(heading('Limites Gratuitos do Cloudflare', h2_style))
limits_data = [
    [Paragraph('<b>Recurso</b>', header_cell_style),
     Paragraph('<b>Limite Free</b>', header_cell_style),
     Paragraph('<b>Uso Estimado</b>', header_cell_style),
     Paragraph('<b>Suficiente?</b>', header_cell_style)],
    [Paragraph('KV Leitura', cell_style),
     Paragraph('100.000/dia', cell_style),
     Paragraph('50-200/dia', cell_style),
     Paragraph('Sim', cell_style)],
    [Paragraph('KV Escrita', cell_style),
     Paragraph('1.000/dia', cell_style),
     Paragraph('5-20/dia', cell_style),
     Paragraph('Sim', cell_style)],
    [Paragraph('KV Armazenamento', cell_style),
     Paragraph('1 GB', cell_style),
     Paragraph('~10 KB', cell_style),
     Paragraph('Sim', cell_style)],
    [Paragraph('Pages Builds', cell_style),
     Paragraph('500/mes', cell_style),
     Paragraph('2-5/mes', cell_style),
     Paragraph('Sim', cell_style)],
    [Paragraph('Banda', cell_style),
     Paragraph('Ilimitada', cell_style),
     Paragraph('-', cell_style),
     Paragraph('Sim', cell_style)],
    [Paragraph('Requisicoes', cell_style),
     Paragraph('100.000/dia', cell_style),
     Paragraph('100-500/dia', cell_style),
     Paragraph('Sim', cell_style)],
]
limits_table = Table(limits_data, colWidths=[4*cm, 3.5*cm, 3.5*cm, 4.5*cm])
limits_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    *[('BACKGROUND', (0, i), (-1, i), WHITE if i % 2 == 1 else colors.HexColor('#F5F5F5')) for i in range(1, 7)],
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(limits_table)
story.append(spacer(6))
story.append(Paragraph('Tabela 2: Limites gratuitos do Cloudflare Pages e KV', ParagraphStyle(
    name='Caption2', fontName='SimHei', fontSize=9, leading=12,
    alignment=TA_CENTER, textColor=GRAY
)))

story.append(PageBreak())

# ============== SECTION 2: PREREQUISITES ==============
story.append(heading('Pre-requisitos'))
story.append(body('Antes de comecar, voce precisa ter:'))
story.append(spacer(6))
story.append(bullet('Uma conta no Cloudflare (gratuita em cloudflare.com)'))
story.append(bullet('O projeto Base Perfeita no seu computador'))
story.append(bullet('Node.js 18+ ou Bun instalado'))
story.append(bullet('Git instalado e o projeto em um repositorio GitHub'))
story.append(bullet('Wrangler CLI instalado globalmente (ferramenta do Cloudflare)'))
story.append(spacer(10))

story.append(heading('Instalando o Wrangler CLI', h2_style))
story.append(body('O Wrangler e a ferramenta de linha de comando do Cloudflare. Instale com:'))
story.append(spacer(4))
story.append(code('npm install -g wrangler'))
story.append(spacer(6))
story.append(body('Depois de instalar, faca login:'))
story.append(spacer(4))
story.append(code('wrangler login'))
story.append(spacer(4))
story.append(body('Isso abre o navegador para autorizar o acesso. Siga as instrucoes na tela.'))
story.append(spacer(6))
story.append(tip('Dica: Se der erro de permissao no Linux/Mac, use sudo: sudo npm install -g wrangler'))

story.append(PageBreak())

# ============== SECTION 3: STEP BY STEP ==============
story.append(heading('Deploy Passo a Passo'))

# STEP 1
story.extend(step_block(1, 'Criar o namespace KV no Cloudflare', [
    body('Abra o terminal na pasta do projeto e execute:'),
    spacer(4),
    code('npx wrangler kv namespace create "CATALOG_KV"'),
    spacer(4),
    body('O Wrangler vai retornar algo assim:'),
    spacer(4),
    code('{ id: "abc123def456...xyz" }'),
    spacer(4),
    body('Copie o valor do "id" (exemplo: abc123def456...xyz). Voce vai precisar dele no proximo passo.'),
    spacer(6),
    tip('Dica: Se quiser um namespace separado para testes locais, rode: npx wrangler kv namespace create "CATALOG_KV" --preview'),
]))

# STEP 2
story.extend(step_block(2, 'Configurar o wrangler.toml', [
    body('Abra o arquivo wrangler.toml na raiz do projeto. Ele esta assim:'),
    spacer(4),
    code('name = "base-perfeita"<br/>compatibility_date = "2024-12-01"<br/>compatibility_flags = ["nodejs_compat"]<br/><br/>[[kv_namespaces]]<br/>binding = "CATALOG_KV"<br/>id = "COLE_AQUI_O_ID_DO_NAMESPACE"<br/>preview_id = "COLE_AQUI_O_ID_DO_PREVIEW_NAMESPACE"'),
    spacer(4),
    body('Substitua COLE_AQUI_O_ID_DO_NAMESPACE pelo ID que voce copiou no passo 1.'),
    spacer(4),
    body('Se tambem criou o preview namespace, cole o preview_id tambem. Se nao, pode remover essa linha.'),
    spacer(6),
    tip('Importante: Nao coloque aspas no ID. O valor deve ser apenas o hash, sem aspas.'),
]))

# STEP 3
story.extend(step_block(3, 'Conectar o repositorio no Cloudflare Pages', [
    body('Acesse o painel do Cloudflare (dash.cloudflare.com) e siga:'),
    spacer(4),
    bullet('Vá em "Workers & Pages" no menu lateral'),
    bullet('Clique em "Create" e depois "Pages"'),
    bullet('Escolha "Connect to Git"'),
    bullet('Selecione o repositorio GitHub do Base Perfeita'),
    bullet('Configure as opcoes de build:'),
    spacer(4),
]))
story.append(spacer(2))

build_config_data = [
    [Paragraph('<b>Configuracao</b>', header_cell_style),
     Paragraph('<b>Valor</b>', header_cell_style)],
    [Paragraph('Build command', cell_left_style),
     Paragraph('npm run build', cell_left_style)],
    [Paragraph('Build output directory', cell_left_style),
     Paragraph('out', cell_left_style)],
    [Paragraph('Node.js version', cell_left_style),
     Paragraph('18 (ou a que estiver usando)', cell_left_style)],
]
build_table = Table(build_config_data, colWidths=[5.5*cm, 10*cm])
build_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('BACKGROUND', (0, 1), (-1, 1), WHITE),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), WHITE),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(build_table)
story.append(spacer(8))

story.append(body('Clique em "Save and Deploy". O Cloudflare vai clonar o repo, instalar dependencias e rodar o build automaticamente.'))

# STEP 4
story.extend(step_block(4, 'Vincular o KV ao projeto Pages', [
    body('Apos o primeiro deploy, vincule o KV:'),
    spacer(4),
    bullet('Vá em "Workers & Pages" no Cloudflare'),
    bullet('Clique no projeto "base-perfeita"'),
    bullet('Vá em "Settings" depois "Functions" depois "KV namespace bindings"'),
    bullet('Clique em "Add binding"'),
    bullet('No campo "Variable name", digite: CATALOG_KV'),
    bullet('No campo "KV namespace", selecione o namespace criado no Passo 1'),
    bullet('Clique em "Save"'),
    spacer(4),
    body('O deploy vai reiniciar automaticamente para aplicar o binding.'),
]))

# STEP 5
story.extend(step_block(5, 'Testar o deploy', [
    body('Acesse a URL fornecida pelo Cloudflare (algo como:'),
    spacer(4),
    code('base-perfeita.pages.dev'),
    spacer(4),
    body('Verifique se:'),
    spacer(4),
    bullet('A pagina principal carrega com o widget "Encontre sua Base Perfeita"'),
    bullet('O painel admin funciona em /admin'),
    bullet('A API /api/catalog retorna 404 (KV vazio, mas e esperado)'),
    bullet('Os modelos de IA carregam (olhe o console do navegador)'),
]))

story.append(PageBreak())

# ============== SECTION 4: FIRST USE ==============
story.append(heading('Primeiro Uso do Admin'))
story.append(body(
    'Na primeira vez que acessar o admin, o KV estara vazio. O sistema automaticamente carrega '
    'o catalog.json padrao (que vem no projeto). Quando voce fizer a primeira edicao no admin, '
    'os dados serao salvos no KV e passam a ser a fonte de verdade.'
))
story.append(spacer(10))

story.append(heading('Fluxo de dados do catalogo', h2_style))
story.append(body('O sistema funciona com 3 camadas de fallback:'))
story.append(spacer(6))

flow_data = [
    [Paragraph('<b>Prioridade</b>', header_cell_style),
     Paragraph('<b>Fonte</b>', header_cell_style),
     Paragraph('<b>Quando e usada</b>', header_cell_style)],
    [Paragraph('1a (leitura)', cell_style),
     Paragraph('Cloudflare KV', cell_left_style),
     Paragraph('Quando ha dados salvos no KV (admin ja usou)', cell_left_style)],
    [Paragraph('1b (escrita)', cell_style),
     Paragraph('Cloudflare KV', cell_left_style),
     Paragraph('Quando admin salva alteracoes', cell_left_style)],
    [Paragraph('2 (fallback)', cell_style),
     Paragraph('catalog.json estatico', cell_left_style),
     Paragraph('Quando KV esta vazio (primeiro acesso)', cell_left_style)],
    [Paragraph('3 (offline)', cell_style),
     Paragraph('localStorage', cell_left_style),
     Paragraph('Cache local do navegador + fallback offline', cell_left_style)],
]
flow_table = Table(flow_data, colWidths=[3*cm, 4*cm, 8.5*cm])
flow_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('BACKGROUND', (0, 1), (-1, 1), WHITE),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), WHITE),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(flow_table)

story.append(PageBreak())

# ============== SECTION 5: FILES ==============
story.append(heading('Arquivos Modificados/Criados'))
story.append(body('Estes sao os arquivos que foram criados ou modificados para o deploy no Cloudflare:'))
story.append(spacer(8))

files_data = [
    [Paragraph('<b>Arquivo</b>', header_cell_style),
     Paragraph('<b>Status</b>', header_cell_style),
     Paragraph('<b>Funcao</b>', header_cell_style)],
    [Paragraph('next.config.ts', cell_left_style),
     Paragraph('Modificado', cell_style),
     Paragraph('output: "export" para gerar HTML estatico', cell_left_style)],
    [Paragraph('wrangler.toml', cell_left_style),
     Paragraph('Novo', cell_style),
     Paragraph('Config do Cloudflare com binding do KV', cell_left_style)],
    [Paragraph('functions/api/catalog.ts', cell_left_style),
     Paragraph('Novo', cell_style),
     Paragraph('Pages Function: GET/PUT catalog via KV', cell_left_style)],
    [Paragraph('public/_headers', cell_left_style),
     Paragraph('Novo', cell_style),
     Paragraph('Cache dos modelos face-api (1 ano)', cell_left_style)],
    [Paragraph('src/app/api/', cell_left_style),
     Paragraph('Deletado', cell_style),
     Paragraph('API route antiga (usava fs, incompativel)', cell_left_style)],
    [Paragraph('package.json', cell_left_style),
     Paragraph('Modificado', cell_style),
     Paragraph('build script simplificado', cell_left_style)],
]
files_table = Table(files_data, colWidths=[5.5*cm, 2.5*cm, 7.5*cm])
files_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    *[('BACKGROUND', (0, i), (-1, i), WHITE if i % 2 == 1 else colors.HexColor('#F5F5F5')) for i in range(1, 7)],
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(files_table)

story.append(spacer(18))

# ============== SECTION 6: TROUBLESHOOTING ==============
story.append(heading('Resolucao de Problemas'))
story.append(spacer(8))

story.append(subheading('Build falha com erro de "output"'))
story.append(body(
    'Se o build falhar com erro relacionado a "output", verifique se o next.config.ts tem '
    'exatamente output: "export". Nao use "standalone" nem remova a propriedade output. O Cloudflare '
    'Pages precisa de arquivos estaticos, nao de um servidor Node.'
))
story.append(spacer(10))

story.append(subheading('API retorna 404 ou erro 500'))
story.append(body(
    'Significa que o KV nao esta vinculado corretamente. Volte ao Passo 4 e verifique: '
    '(1) o Variable name esta exatamente "CATALOG_KV" (maiusculo), (2) o namespace selecionado '
    'e o mesmo criado no Passo 1, (3) salvou as configuracoes e o deploy reiniciou.'
))
story.append(spacer(10))

story.append(subheading('Admin nao salva dados'))
story.append(body(
    'Abra o console do navegador (F12) e va na aba "Network". Faca uma alteracao no admin e '
    'observe a requisicao PUT para /api/catalog. Se retornar 500, o KV nao esta vinculado. '
    'Se retornar 200, os dados foram salvos com sucesso. Recarregue a pagina para confirmar.'
))
story.append(spacer(10))

story.append(subheading('Modelos de IA demoram para carregar'))
story.append(body(
    'Os modelos face-api pesam cerca de 3 MB. No primeiro acesso podem demorar 5-10 segundos '
    'dependendo da conexao. Apos o primeiro carregamento, o navegador faz cache dos arquivos '
    'gracas ao header _headers que configura cache de 1 ano para /models/*.'
))
story.append(spacer(10))

story.append(subheading('Deploy local com wrangler'))
story.append(body('Para testar localmente com o KV real:'))
story.append(spacer(4))
story.append(code('npx wrangler pages dev out --kv=CATALOG_KV'))
story.append(spacer(4))
story.append(body('Isso sobe um servidor local em http://localhost:8788 com acesso ao KV real.'))

story.append(PageBreak())

# ============== SECTION 7: CHEATSHEET ==============
story.append(heading('Comandos Rapidos (Cheatsheet)'))
story.append(spacer(8))

cmds_data = [
    [Paragraph('<b>Acao</b>', header_cell_style),
     Paragraph('<b>Comando</b>', header_cell_style)],
    [Paragraph('Criar KV namespace', cell_left_style),
     Paragraph('npx wrangler kv namespace create "CATALOG_KV"', cell_left_style)],
    [Paragraph('Listar KV namespaces', cell_left_style),
     Paragraph('npx wrangler kv namespace list', cell_left_style)],
    [Paragraph('Login no Cloudflare', cell_left_style),
     Paragraph('npx wrangler login', cell_left_style)],
    [Paragraph('Deploy local', cell_left_style),
     Paragraph('npx wrangler pages dev out --kv=CATALOG_KV', cell_left_style)],
    [Paragraph('Deploy de producao', cell_left_style),
     Paragraph('npx wrangler pages deploy out', cell_left_style)],
    [Paragraph('Build estatico', cell_left_style),
     Paragraph('npm run build', cell_left_style)],
    [Paragraph('Ver logs do deploy', cell_left_style),
     Paragraph('npx wrangler pages deployment tail', cell_left_style)],
]
cmds_table = Table(cmds_data, colWidths=[5*cm, 10.5*cm])
cmds_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    *[('BACKGROUND', (0, i), (-1, i), WHITE if i % 2 == 1 else colors.HexColor('#F5F5F5')) for i in range(1, 8)],
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(cmds_table)

story.append(spacer(24))

# ============== SECTION 8: SUMMARY ==============
story.append(heading('Checklist Final'))
story.append(body('Confirme que todos os itens estao marcados antes de considerar o deploy completo:'))
story.append(spacer(8))

check_data = [
    [Paragraph('<b>Item</b>', header_cell_style),
     Paragraph('<b>Status</b>', header_cell_style)],
    [Paragraph('KV namespace criado via wrangler', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('ID do KV colado no wrangler.toml', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('Repositorio conectado ao Cloudflare Pages', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('Build command: npm run build', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('Output directory: out', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('KV binding configurado nas Settings do Pages', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('Deploy bem-sucedido (sem erros)', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('Widget principal funciona', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('Painel admin (/admin) funciona', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('API /api/catalog responde (GET/PUT)', cell_left_style),
     Paragraph('[ ]', cell_style)],
    [Paragraph('Modelos de IA carregam no navegador', cell_left_style),
     Paragraph('[ ]', cell_style)],
]
check_table = Table(check_data, colWidths=[12*cm, 3.5*cm])
check_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    *[('BACKGROUND', (0, i), (-1, i), WHITE if i % 2 == 1 else colors.HexColor('#F5F5F5')) for i in range(1, 11)],
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(check_table)

# ---- Build ----
doc.build(story)
print(f"PDF gerado: {pdf_path}")
