const fs=require("fs"),path=require("path");
const root=process.cwd(),out=path.join(root,"dist"),dir=path.join(root,"pdfs");
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const f of ["index.html","style.css","app.js"])fs.copyFileSync(path.join(root,f),path.join(out,f));
function copy(a,b){if(!fs.existsSync(a))return;fs.mkdirSync(b,{recursive:true});for(const e of fs.readdirSync(a,{withFileTypes:true})){const x=path.join(a,e.name),y=path.join(b,e.name);if(e.isDirectory())copy(x,y);else fs.copyFileSync(x,y);}}
copy(dir,path.join(out,"pdfs"));
const slug=n=>n.slice(0,-4).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const books=fs.existsSync(dir)?fs.readdirSync(dir).filter(n=>n.toLowerCase().endsWith(".pdf")).sort().map(n=>({slug:slug(n),title:n.slice(0,-4).replace(/[-_]+/g," ").trim(),file:"/pdfs/"+encodeURIComponent(n)})).filter(x=>x.slug):[];
fs.writeFileSync(path.join(out,"books.json"),JSON.stringify(books,null,2));
console.log("PDFs detetados:",books.length);
