# Cardápio + Flipbook Maker

O repositório mantém o leitor Cardápio existente e acrescenta um editor local de flipbooks na rota `/maker/`.

## Flipbook Maker

O editor importa PDF no navegador, renderiza as páginas localmente, preserva hiperligações externas do PDF, permite desenhar áreas clicáveis adicionais e exporta um ZIP autónomo com o leitor PageFlip, páginas e links.

### Utilização
1. Abre `/maker/`.
2. Importa o PDF.
3. Activa **Adicionar link** e desenha a área clicável.
4. Introduz o texto e o endereço, por exemplo `https://wa.me/244923000000`.
5. Exporta o ZIP.
6. Extrai o ZIP e abre `index.html`.

O PDF não é enviado para servidores e não existe base de dados. O ZIP funciona offline; links externos precisam de internet quando forem abertos.

### Build
Requer Node.js 20 ou superior.

```bash
npm install
npm run build
```

O Vercel publica o editor em `/maker/` e mantém as rotas existentes do leitor.

### Bibliotecas
- PDF.js — Apache-2.0
- StPageFlip / page-flip — MIT
- JSZip — MIT
- Vite — MIT

## Leitor Cardápio existente

Para adicionar um ebook, edita `books.js` e cria uma entrada com slug, título e URL pública do PDF:

```js
window.CARDAPIO_BOOKS = {
  "menu-restaurante": {
    title: "Menu do Restaurante",
    url: "https://exemplo.com/menu.pdf"
  }
};
```

O slug fica disponível no endereço `/menu-restaurante`.

**Nota:** o leitor antigo carrega as bibliotecas por CDN e necessita de internet. O editor e os ZIPs exportados pelo Flipbook Maker usam recursos locais e não dependem de CDN.
