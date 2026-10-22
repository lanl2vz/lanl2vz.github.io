(() => {
  'use strict';
  const root = document.getElementById('ln-notebook');
  const main = root.querySelector('#ln-main');
  const assets = __ASSETS__;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const notes = __NOTES__;
  let filter='All notes', query='', equationCount=0;
  const resolveFile=url=>assets.files[url]||null;
  const resolveAsset=url=>resolveFile(url)?.url;
  marked.use({extensions:[
    {name:'displayMath',level:'block',start:src=>src.indexOf('$$'),tokenizer(src){const m=/^\$\$\s*\n?([\s\S]+?)\n?\$\$(?:\s*\n|$)/.exec(src);if(m)return {type:'displayMath',raw:m[0],text:m[1]}},renderer(token){let math;try{math=katex.renderToString(token.text,{displayMode:true,throwOnError:false,trust:false,strict:'ignore',maxExpand:500})}catch{math=esc(token.text)}return `<div class="equation"><div class="math">${math}</div><span class="equation-number">(${++equationCount})</span></div>`}},
    {name:'inlineMath',level:'inline',start:src=>src.indexOf('$'),tokenizer(src){const m=/^\$(?!\$)([^\n$]+?)\$(?!\$)/.exec(src);if(m)return {type:'inlineMath',raw:m[0],text:m[1]}},renderer(token){try{return katex.renderToString(token.text,{throwOnError:false,trust:false,strict:'ignore',maxExpand:500})}catch{return esc(token.text)}}}
  ],renderer:{
    html(token){return esc(token.text)},
    image(token){const url=resolveAsset(token.href);return url?`<img src="${esc(url)}" alt="${esc(token.text)}" loading="lazy">`:`<span class="remote-omitted">Image unavailable: ${esc(token.text)}.</span>`},
    link(token){const text=this.parser.parseInline(token.tokens);const local=resolveFile(token.href);if(local)return `<a href="#attachment" data-file="${esc(token.href)}" download="${esc(local.name)}">${text} ↓</a>`;if(/^https?:\/\//i.test(token.href))return `<a href="${esc(token.href)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${text} ↗</a>`;return text}
  }});
  function markdown(text){equationCount=0;return DOMPurify.sanitize(marked.parse(text),{FORBID_TAGS:['script','iframe','object','embed','form','input','button','style'],FORBID_ATTR:['srcset'],ADD_ATTR:['target','download','referrerpolicy']})}
  const dateLabel=n=>new Date(n.isoDate+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  function entry(n){return `<li class="entry"><time class="entry-date" datetime="${n.isoDate}">${esc(n.dateShort)}</time><div><h3><button data-note="${esc(n.id)}">${esc(n.title)}</button>${n.example?'<span class="example-label">[example]</span>':''}</h3><p>${esc(n.desc)}</p></div></li>`}
  function currentNotes(){const q=query.trim().toLowerCase();return notes.filter(n=>(filter==='All notes'||n.topic===filter)&&(!q||`${n.title} ${n.desc} ${n.body} ${n.topic}`.toLowerCase().includes(q)))}
  function groupedEntries(items){let year='';return items.map((n,i)=>{const heading=n.year!==year?`${i?'</ol>':''}<h2 class="index-year">${n.year}</h2><ol class="entries">`:'';year=n.year;return heading+entry(n)}).join('')+(items.length?'</ol>':'')}
  function updateList(){const list=root.querySelector('#ln-entries');if(list){const found=currentNotes();list.innerHTML=found.length?groupedEntries(found):'<p class="empty">No notes found. Try another subject or search.</p>';root.querySelector('#ln-result-count').textContent=`${found.length} ${found.length===1?'entry':'entries'}`;}root.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)))}
  function notebook(){main.innerHTML=`<header class="page-heading"><h1>Notes</h1><p>Mathematics, computation, and miscellaneous observations.</p></header><div class="browse-controls"><span>Subject:</span>${['All notes',...new Set(notes.map(n=>n.topic))].map(f=>`<button data-filter="${esc(f)}" aria-pressed="${filter===f}">${esc(f)}</button>`).join('')}<button class="search-toggle" data-action="search" aria-label="Search notes" aria-expanded="${!!query}">Search</button></div><label class="searchbox" ${query?'':'hidden'} id="ln-search-box"><span>Find:</span><input type="search" id="ln-search" value="${esc(query)}" placeholder="Search notes" aria-label="Search the notebook"></label><span id="ln-result-count" class="sr-only" role="status"></span><div id="ln-entries" aria-label="Notes"></div><button class="all-entries" data-view="archive">Complete archive</button>`;updateList()}
  function article(id){const n=notes.find(n=>n.id===id);if(!n){main.innerHTML='<header class="page-heading"><h1>Note not found</h1><p><button data-view="notebook">Back to notes</button></p></header>';return}main.innerHTML=`<button class="back-link" data-view="notebook">Back to notes</button><header class="article-header"><h1>${esc(n.title)}</h1><div class="article-byline">${n.example?'Example note':'Working note'} · ${esc(n.topic)}<time datetime="${n.isoDate}">${dateLabel(n)}</time></div>${n.deck?`<p class="article-deck"><b>Summary.</b> ${esc(n.deck)}</p>`:''}</header><article class="prose" id="ln-article-body">${markdown(n.body)}<div class="article-bottom"><button data-view="notebook">Back to notes</button><button data-action="export-note" data-id="${esc(n.id)}">Markdown source</button></div></article>`;root.querySelectorAll('#ln-article-body h2').forEach((heading,i)=>{heading.id=`ln-section-${i}`;heading.textContent=`${i+1}. ${heading.textContent}`})}
  function archive(){main.innerHTML=`<header class="page-heading"><h1>Archive</h1><p>All notes, in reverse chronological order.</p></header><section class="archive-layout" aria-label="All entries">${groupedEntries(notes)}</section>`}
  function about(){main.innerHTML=`<section class="about-layout"><header class="page-heading"><h1>About this notebook</h1></header><div class="prose"><p>A personal collection of notes on mathematics, computation, and related topics. Notes may include unfinished calculations, figures, and supplementary PDFs.</p><p><i>“Piling up stuffs from random thoughts.”</i></p><p>Entries marked <i>example</i> demonstrate the notebook format; they are not research publications.</p></div></section>`}
  function goto(next,id){root.querySelectorAll('nav [data-view]').forEach(b=>{if(b.dataset.view===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});if(next==='article')article(id);else if(next==='archive')archive();else if(next==='about')about();else notebook();if(window.LANL2VZ_STANDALONE){const hash=next==='article'?`#note/${id}`:`#${next}`;if(location.hash!==hash)history.pushState(null,'',hash)}root.scrollIntoView({block:'start',behavior:'instant'})}
  function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';root.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
  function fileSlug(title){return title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75)||'untitled-note'}
  function exportMarkdown(title,body){const source=body.replace(/\]\((assets\/[^)]+)\)/g,(m,url)=>`](${resolveAsset(url)||url})`);download(new Blob([`# ${title.replace(/[\r\n]/g,' ')}\n\n${source}\n`],{type:'text/markdown;charset=utf-8'}),`${fileSlug(title)}.md`)}
  root.addEventListener('click',event=>{const button=event.target.closest('button,a[data-view],a[data-file]');if(!button)return;
    if(button.dataset.file){event.preventDefault();const item=resolveFile(button.dataset.file);if(item){const mime=item.url.slice(5,item.url.indexOf(';'));const bytes=Uint8Array.from(atob(item.url.split(',')[1]),c=>c.charCodeAt(0));download(new Blob([bytes],{type:mime}),item.name)}return}
    if(button.dataset.view){event.preventDefault();goto(button.dataset.view);return}
    if(button.dataset.note){goto('article',button.dataset.note);return}
    if(button.dataset.filter){filter=button.dataset.filter;updateList();return}
    if(button.dataset.subject){filter=button.dataset.subject;query='';goto('notebook');return}
    if(button.dataset.section){root.querySelector(`#ln-section-${button.dataset.section}`)?.scrollIntoView({block:'start',behavior:'smooth'});return}
    switch(button.dataset.action){
      case 'search':{const box=root.querySelector('#ln-search-box');box.hidden=!box.hidden;button.setAttribute('aria-expanded',String(!box.hidden));if(!box.hidden)root.querySelector('#ln-search').focus();break}
      case 'export-note':{const n=notes.find(n=>n.id===button.dataset.id);exportMarkdown(n.title,n.body);break}
    }
  });
  root.addEventListener('input',event=>{if(event.target.id==='ln-search'){query=event.target.value;updateList()}});
  if(window.LANL2VZ_STANDALONE){const route=()=>{const hash=location.hash.slice(1);if(hash.startsWith('note/'))goto('article',hash.slice(5));else goto(['archive','about'].includes(hash)?hash:'notebook')};window.addEventListener('popstate',route);route()}else notebook();
})();
