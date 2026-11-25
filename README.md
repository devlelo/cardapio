# Cardápio — leitor direto de PDF

Leitor simples em HTML, CSS e JavaScript com DearFlip.js.

## Como adicionar um ebook

1. Carrega o PDF no Google Drive.
2. Em Partilhar, define **Qualquer pessoa com o link** como leitor.
3. Abre `books.js` no GitHub e adiciona um registo:
   ```js
   window.CARDAPIO_BOOKS = {
     "menu-restaurante": {
       title: "Menu do Restaurante",
       url: "https://drive.google.com/file/d/ID_DO_PDF/view?usp=sharing"
     }
   };
   ```
4. Faz commit. O Vercel publica a alteração automaticamente.
5. O ebook fica disponível em `https://TEU-DOMINIO/menu-restaurante`.

O nome da chave (por exemplo, `menu-restaurante`) é o slug do link. Podes adicionar vários registos separados por vírgulas.

## DearFlip

O projeto espera a distribuição oficial do DearFlip na pasta `dflip/`, mantendo a estrutura original:
- `dflip/css/dflip.min.css`
- `dflip/js/libs/jquery.min.js`
- `dflip/js/dflip.min.js`
- restantes pastas e ficheiros que acompanham a distribuição

Obtém a distribuição através do fornecedor oficial e coloca a pasta `dflip/` na raiz do repositório. O build copia-a para `dist/dflip/`. Não incluímos nem redistribuímos os ficheiros comerciais do plugin.

## Nota sobre Google Drive

O leitor transforma links de partilha comuns num endereço de download direto. Ainda assim, o Google Drive pode bloquear leitura externa por CORS, limites de transferência ou confirmação de download, especialmente em PDFs grandes. Se isso acontecer, o leitor precisa de um alojamento de ficheiros com suporte adequado a CORS e pedidos Range (por exemplo, Cloudflare R2).

## Build

`npm run build`
