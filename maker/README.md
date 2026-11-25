# Flipbook Maker

Editor local de PDFs para criar flipbooks com efeito de folha, links clicáveis e exportação ZIP offline.

## Requisitos
- Node.js 20 ou superior
- npm

## Desenvolvimento
```bash
npm install
npm run build
```

O editor é publicado em `/maker/`. O leitor de flipbook continua disponível nas rotas antigas do projecto.

## Utilização
1. Abre `/maker/`.
2. Importa um PDF.
3. Selecciona **Adicionar link** e desenha uma área sobre a página.
4. Introduz o texto e o URL (por exemplo `https://wa.me/244923000000`).
5. Exporta o ZIP.
6. Extrai o ZIP e abre `index.html`.

## Privacidade e modo offline
O PDF é lido no navegador. O editor não envia documentos para servidores nem utiliza base de dados. O ZIP contém as páginas renderizadas, os links, o motor PageFlip e o HTML do leitor. O catálogo abre sem internet; links externos precisam de ligação à internet quando forem utilizados.

## Limitações conhecidas
- PDFs protegidos por palavra-passe não são suportados.
- A primeira versão preserva hiperligações externas do PDF. Destinos internos do tipo “ir para página” ainda não são convertidos.
- O tamanho do ZIP depende do número de páginas e da resolução das imagens.
- O APK não é gerado por esta ferramenta; o ZIP HTML pode ser empacotado separadamente numa aplicação Android.

## Bibliotecas
- PDF.js — Apache-2.0
- StPageFlip / page-flip — MIT
- JSZip — MIT
- Vite — MIT
