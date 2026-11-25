# Flipbook Maker

Editor de PDF com pré-visualização de livro em ecrã inteiro, curvatura realista de página, links clicáveis e exportação de pacote autónomo.

## Motor do leitor

O leitor utiliza **SdFlip 1.0.0** (MIT), incorporado localmente em `vendor/sdflip/`. O motor oferece:
- página única em ecrãs verticais e dupla página em ecrãs largos;
- curvatura de papel com sombras;
- gestos de toque, zoom e ecrã inteiro;
- links externos e internos do PDF;
- pesquisa, índice e miniaturas;
- cache de páginas para reduzir consumo de memória.

O PDF.js é servido localmente a partir da dependência `pdfjs-dist`; não é carregado de CDN.

## Desenvolvimento

Requer Node.js 20 ou superior.

```bash
npm install
npm run build
```

O editor é publicado em `/maker/`. A página do leitor standalone fica em `/maker/standalone/`.

## Fluxo de utilização

1. Abre `/maker/` e importa o PDF.
2. Se quiseres, desenha áreas clicáveis para links personalizados, como WhatsApp.
3. Usa **Pré-visualizar** para abrir o leitor de papel em ecrã inteiro.
4. Usa **Exportar ZIP** para gerar um pacote com PDF, links, motor, PDF.js e PWA.
5. Extrai o ZIP e publica os ficheiros na mesma pasta num alojamento HTTPS, como Vercel.
6. No Android, abre o endereço e escolhe **Adicionar ao ecrã inicial**. Depois da primeira abertura, o service worker guarda o leitor e o PDF para utilização offline, sujeito ao espaço disponível no dispositivo.

## Privacidade e limitações

- O PDF é processado localmente no navegador.
- Não existe backend nem base de dados.
- As ligações personalizadas são gravadas como anotações URI dentro do PDF exportado.
- Os links externos precisam de internet quando são abertos.
- O modo offline é feito por PWA em HTTPS/localhost. Abrir directamente por `file://` não é suportado de forma fiável pelos navegadores Android, devido às regras de módulos e workers.
- PDFs protegidos por palavra-passe, ficheiros danificados ou PDFs muito pesados podem exigir tratamento específico.

## Licenças

- SdFlip — MIT; ver `vendor/sdflip/LICENSE`.
- PDF.js — Apache-2.0; ver `standalone/LICENSE-PDFjs` no pacote exportado.
- pdf-lib — MIT.
- JSZip — MIT.
