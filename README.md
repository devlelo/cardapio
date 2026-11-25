# Cardápio + Flipbook Maker

O repositório mantém o leitor Cardápio existente e acrescenta um editor local de flipbooks na rota /maker/.

## Flipbook Maker

O editor importa PDFs no navegador, preserva links existentes, permite desenhar áreas clicáveis adicionais e exporta um ZIP autónomo com o leitor **pdflip**, PDF.js e recursos locais.

### Utilização

1. Abre /maker/.
2. Importa o PDF.
3. Activa **Adicionar link** e desenha a área clicável.
4. Introduz o texto e o endereço, por exemplo https://wa.me/244923000000.
5. Usa **Pré-visualizar** para ver o livro com curvatura real de página.
6. Exporta o ZIP e publica a pasta extraída num alojamento HTTPS.
7. No Android, abre o endereço e instala como PWA para utilização offline depois da primeira abertura.

O PDF é processado no dispositivo e não é enviado para servidores. Não existe backend nem base de dados. Os links externos precisam de internet quando forem abertos. Abrir o ZIP directamente por file:// não é fiável em Android; usa HTTPS/localhost.

### Build

Requer Node.js 22 ou superior.

~~~bash
npm install
npm run build
~~~

O Vercel publica o editor em /maker/ e mantém as rotas existentes do leitor.

### Bibliotecas

- pdflip — BSD-3-Clause
- PDF.js — Apache-2.0
- pdf-lib — MIT
- JSZip — MIT
- Vite — MIT

## Leitor Cardápio existente

Para adicionar um ebook, edita books.js e cria uma entrada com slug, título e URL pública do PDF:

~~~js
window.CARDAPIO_BOOKS = {
  menu-restaurante: {
    title: Menu do Restaurante,
    url: https://exemplo.com/menu.pdf
  }
};
~~~

O slug fica disponível no endereço /menu-restaurante.

**Nota:** o leitor antigo mantém a sua implementação actual. A substituição pelo pdflip aplica-se ao Flipbook Maker e aos ZIPs exportados por ele.
