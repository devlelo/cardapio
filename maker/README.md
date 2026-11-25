# Flipbook Maker

Editor local de PDF com links personalizados e exportação de um leitor autónomo em formato de livro.

## Motor do leitor

O leitor utiliza **pdflip 0.1.0**, de WapplerSystems, sob licença BSD-3-Clause. O motor foi concebido para PDF e oferece:
- dobra de papel com curvatura e sombras acompanhando o ponteiro;
- modo de página única ou dupla, conforme a orientação e o espaço;
- capa rígida opcional e páginas em papel flexível;
- gestos de toque, navegação por teclado e zoom;
- links internos e externos já existentes no PDF;
- texto seleccionável, pesquisa, índice e miniaturas;
- cache de páginas com orçamento de memória;
- execução local, sem CDN.

O pdflip utiliza PDF.js e inclui os seus recursos de execução em standalone/pdflip/. O build copia o runtime completo, incluindo worker, CMaps, fontes e WASM.

## Desenvolvimento

Requer Node.js 22 ou superior.

~~~bash
npm install
npm run build
~~~

O editor é publicado em /maker/. O leitor standalone de demonstração fica em /maker/standalone/.

## Fluxo de utilização

1. Abre /maker/ e importa o PDF.
2. Activa **Adicionar link** e desenha uma área clicável na página.
3. Introduz o texto e o endereço, por exemplo https://wa.me/244923000000.
4. Usa **Pré-visualizar** para abrir o PDF no leitor pdflip.
5. Usa **Exportar ZIP** para gerar o documento, o leitor, o runtime e os recursos offline.
6. Extrai o ZIP e publica a pasta num alojamento HTTPS, como Vercel.
7. No Android, abre o endereço e instala como PWA. Depois da primeira abertura com internet, o leitor e o PDF ficam disponíveis offline, sujeito ao espaço disponível no dispositivo.

## Privacidade e limitações

- O PDF é processado localmente no navegador.
- Não existe backend nem base de dados.
- As ligações personalizadas são gravadas como anotações URI dentro do PDF exportado; o leitor pdflip apresenta-as como links do documento.
- Os links externos precisam de internet quando são abertos.
- O modo offline é feito por PWA em HTTPS/localhost. Abrir directamente por file:// não é suportado de forma fiável nos navegadores Android.
- PDFs muito grandes continuam limitados pela memória e capacidade do dispositivo.

## Licenças

- pdflip — BSD-3-Clause; ver standalone/LICENSE-pdflip e o repositório original.
- PDF.js — Apache-2.0; incluído em standalone/pdflip/pdfjs/LICENSE.
- pdf-lib — MIT.
- JSZip — MIT.
