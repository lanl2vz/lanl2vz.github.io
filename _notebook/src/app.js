(() => {
  'use strict';
  const root = document.getElementById('ln-notebook');
  const main = root.querySelector('#ln-main');
  const assets = __ASSETS__;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const notes = __NOTES__;
  let view='notebook', filter='All notes', query='', equationCount=0, saveTimer;
  let attachments={};
  let draft={title:'A small observation',body:String.raw`Every good note begins with a question.

## An equation to keep

The Gaussian integral has a beautifully compact answer:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,\mathrm{d}x = \sqrt{\pi}.
$$

What changes if we replace $x^2$ with $a x^2$?

> Leave a little room for the next thought.
`};
  let dbPromise;
  function openDB(){
    if(!dbPromise) dbPromise=new Promise((resolve,reject)=>{
      try {
        const req=indexedDB.open('lanl2vz-notebook-drafts-v1',1);
        req.onupgradeneeded=()=>req.result.createObjectStore('drafts');
        req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
      } catch(error){reject(error)}
    });
    return dbPromise;
  }
  function dbAction(mode,callback){return openDB().then(db=>new Promise((resolve,reject)=>{const tx=db.transaction('drafts',mode);const req=callback(tx.objectStore('drafts'));tx.oncomplete=()=>resolve(req?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)}))}
  let draftLoadFailed=false;
  const loadedDraft=dbAction('readonly',s=>s.get('current')).then(value=>{if(value&&typeof value.title==='string'&&typeof value.body==='string'){draft={title:value.title,body:value.body};attachments=value.attachments||{}}}).catch(()=>{draftLoadFailed=true});
  const resolveFile=url=>url.startsWith('attachment:')?attachments[url.slice(11)]:(assets.files[url]||null);
  const resolveAsset=url=>resolveFile(url)?.url;
  marked.use({extensions:[
    {name:'displayMath',level:'block',start:src=>src.indexOf('$$'),tokenizer(src){const m=/^\$\$\s*\n?([\s\S]+?)\n?\$\$(?:\s*\n|$)/.exec(src);if(m)return {type:'displayMath',raw:m[0],text:m[1]}},renderer(token){let math;try{math=katex.renderToString(token.text,{displayMode:true,throwOnError:false,trust:false,strict:'ignore',maxExpand:500})}catch{math=esc(token.text)}return `<div class="equation"><div class="math">${math}</div><span class="equation-number">(${++equationCount})</span></div>`}},
    {name:'inlineMath',level:'inline',start:src=>src.indexOf('$'),tokenizer(src){const m=/^\$(?!\$)([^\n$]+?)\$(?!\$)/.exec(src);if(m)return {type:'inlineMath',raw:m[0],text:m[1]}},renderer(token){try{return katex.renderToString(token.text,{throwOnError:false,trust:false,strict:'ignore',maxExpand:500})}catch{return esc(token.text)}}}
  ],renderer:{
    html(token){return esc(token.text)},
    image(token){const url=resolveAsset(token.href);return url?`<img src="${esc(url)}" alt="${esc(token.text)}" loading="lazy">`:`<span class="remote-omitted">Image: ${esc(token.text)}. Attach a local image to preview it here.</span>`},
    link(token){const text=this.parser.parseInline(token.tokens);const local=resolveFile(token.href);if(local)return `<a href="#attachment" data-file="${esc(token.href)}" download="${esc(local.name)}">${text} ↓</a>`;if(/^https?:\/\//i.test(token.href))return `<a href="${esc(token.href)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${text} ↗</a>`;return text}
  }});
  function markdown(text){equationCount=0;return DOMPurify.sanitize(marked.parse(text),{FORBID_TAGS:['script','iframe','object','embed','form','input','button','style'],FORBID_ATTR:['srcset'],ADD_ATTR:['target','download','referrerpolicy']})}
  const dateLabel=n=>new Date(n.isoDate+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  function entry(n){return `<li class="entry"><time class="entry-date" datetime="${n.isoDate}">${esc(n.dateShort)}</time><div><h3><button data-note="${esc(n.id)}">${esc(n.title)}</button>${n.example?'<span class="example-label">[example]</span>':''}</h3><p>${esc(n.desc)}</p></div></li>`}
  function currentNotes(){const q=query.trim().toLowerCase();return notes.filter(n=>(filter==='All notes'||n.topic===filter)&&(!q||`${n.title} ${n.desc} ${n.body} ${n.topic}`.toLowerCase().includes(q)))}
  function groupedEntries(items){let year='';return items.map((n,i)=>{const heading=n.year!==year?`${i?'</ol>':''}<h2 class="index-year">${n.year}</h2><ol class="entries">`:'';year=n.year;return heading+entry(n)}).join('')+(items.length?'</ol>':'')}
  function updateList(){const list=root.querySelector('#ln-entries');if(list){const found=currentNotes();list.innerHTML=found.length?groupedEntries(found):'<p class="empty">No notes found. Try another subject or search.</p>';root.querySelector('#ln-result-count').textContent=`${found.length} ${found.length===1?'entry':'entries'}`;}root.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)))}
  function notebook(){main.innerHTML=`<header class="page-heading"><h1>Notes</h1><p>Mathematics, computation, and miscellaneous observations.</p></header><div class="browse-controls"><span>Subject:</span>${['All notes',...new Set(notes.map(n=>n.topic))].map(f=>`<button data-filter="${esc(f)}" aria-pressed="${filter===f}">${esc(f)}</button>`).join('')}<button class="search-toggle" data-action="search" aria-label="Search notes" aria-expanded="${!!query}">Search</button></div><label class="searchbox" ${query?'':'hidden'} id="ln-search-box"><span>Find:</span><input type="search" id="ln-search" value="${esc(query)}" placeholder="Search notes" aria-label="Search the notebook"></label><span id="ln-result-count" class="sr-only" role="status"></span><div id="ln-entries" aria-label="Notes"></div><button class="all-entries" data-view="archive">Complete archive</button>`;updateList()}
  function article(id){const n=notes.find(n=>n.id===id);if(!n){main.innerHTML='<header class="page-heading"><h1>Note not found</h1><p><button data-view="notebook">Back to notes</button></p></header>';return}view='article';main.innerHTML=`<button class="back-link" data-view="notebook">Back to notes</button><header class="article-header"><h1>${esc(n.title)}</h1><div class="article-byline">${n.example?'Example note':'Working note'} · ${esc(n.topic)}<time datetime="${n.isoDate}">${dateLabel(n)}</time></div>${n.deck?`<p class="article-deck"><b>Summary.</b> ${esc(n.deck)}</p>`:''}</header><article class="prose" id="ln-article-body">${markdown(n.body)}<div class="article-bottom"><button data-view="notebook">Back to notes</button><button data-action="export-note" data-id="${esc(n.id)}">Markdown source</button></div></article>`;root.querySelectorAll('#ln-article-body h2').forEach((heading,i)=>{heading.id=`ln-section-${i}`;heading.textContent=`${i+1}. ${heading.textContent}`})}
  function archive(){main.innerHTML=`<header class="page-heading"><h1>Archive</h1><p>All notes, in reverse chronological order.</p></header><section class="archive-layout" aria-label="All entries">${groupedEntries(notes)}</section>`}
  function about(){main.innerHTML=`<section class="about-layout"><header class="page-heading"><h1>About this notebook</h1></header><div class="prose"><p>A personal collection of notes on mathematics, computation, and related topics. Notes may include unfinished calculations, figures, and supplementary PDFs.</p><p><i>“Piling up stuffs from random thoughts.”</i></p><p>Entries marked <i>example</i> demonstrate the notebook format; they are not research publications.</p><h2>Writing</h2><p>Notes are written in Markdown, with LaTeX for equations. The local editor accepts images and PDFs, and exports a Markdown file.</p><p>Drafts can be saved in this browser. The editor makes no uploads and has no GitHub account connection. Publication is a separate step.</p><p><button data-view="editor">Open the local editor</button></p></div></section>`}
  async function editor(){await loadedDraft;if(view!=='editor')return;main.innerHTML=`<div class="editor-heading"><h1>Local editor</h1><div class="editor-actions"><button data-action="save">Save on this device</button><button class="solid-button" data-action="export-draft">Download .md</button></div></div><div class="editor-notice">Drafts stay in this browser. No uploads or GitHub connection. Download a copy to keep a backup.</div><div class="editor-grid"><section class="editor-pane"><div class="pane-label"><span>Markdown</span><span>LaTeX supported</span></div><div class="editor-fields"><label for="ln-draft-title">Note title</label><input id="ln-draft-title" value="${esc(draft.title)}" placeholder="Untitled note" maxlength="200"><label for="ln-draft-body">Your note</label><div class="editor-toolbar" aria-label="Insert into note"><button data-insert="heading">Heading</button><button data-insert="equation">∑ Equation</button><button data-action="attach-image">+ Image</button><button data-action="attach-pdf">+ PDF</button></div><textarea id="ln-draft-body" spellcheck="false" placeholder="Start with a question…">${esc(draft.body)}</textarea><input id="ln-file" type="file" hidden><div id="ln-editor-error" class="error-message" role="alert"></div></div></section><section class="editor-pane" aria-label="Rendered note"><div class="pane-label"><span>Preview</span><span></span></div><div class="editor-preview"><h1 id="ln-rendered-title"></h1><div class="prose" id="ln-rendered-body"></div></div></section></div><div class="editor-foot"><span id="ln-draft-status" class="status" role="status">${draftLoadFailed?'Device storage is unavailable here. Download your draft before closing.':'Ready to write. Changes stay in memory until you save.'}</span><span>$ inline math $ &nbsp; · &nbsp; $$ display math $$</span></div>`;updateDraftPreview()}
  function updateDraftPreview(){const title=root.querySelector('#ln-rendered-title');if(!title)return;title.textContent=draft.title||'Untitled note';root.querySelector('#ln-rendered-body').innerHTML=markdown(draft.body)}
  function captureDraft(){const title=root.querySelector('#ln-draft-title');if(title)draft={title:title.value,body:root.querySelector('#ln-draft-body').value}}
  function setStatus(text){const el=root.querySelector('#ln-draft-status');if(el)el.textContent=text}
  async function saveDraft(button){captureDraft();button.disabled=true;try{await dbAction('readwrite',s=>s.put({...draft,attachments},'current'));setStatus('Saved in this browser. Nothing uploaded.')}catch{setStatus('Could not save in this browser. Download your draft to keep it.')}finally{button.disabled=false}}
  function goto(next,id){captureDraft();view=next;root.querySelectorAll('nav [data-view]').forEach(b=>{if(b.dataset.view===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});if(next==='article')article(id);else if(next==='archive')archive();else if(next==='about')about();else if(next==='editor')editor();else notebook();if(window.LANL2VZ_STANDALONE){const hash=next==='article'?`#note/${id}`:`#${next}`;if(location.hash!==hash)history.pushState(null,'',hash)}root.scrollIntoView({block:'start',behavior:'instant'})}
  function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';root.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
  function fileSlug(title){return title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75)||'untitled-note'}
  function exportMarkdown(title,body){const source=body.replace(/\]\((assets\/[^)]+|attachment:[^)]+)\)/g,(m,url)=>`](${resolveAsset(url)||url})`);download(new Blob([`# ${title.replace(/[\r\n]/g,' ')}\n\n${source}\n`],{type:'text/markdown;charset=utf-8'}),`${fileSlug(title)}.md`)}
  function insertText(text){const area=root.querySelector('#ln-draft-body');const start=area.selectionStart,end=area.selectionEnd;area.value=area.value.slice(0,start)+text+area.value.slice(end);area.focus();area.setSelectionRange(start+text.length,start+text.length);draft.body=area.value;updateDraftPreview();setStatus('Unsaved changes. Save here or download a copy.')}
  async function attach(file){if(!file)return;const error=root.querySelector('#ln-editor-error');error.textContent='';if(file.size>6*1024*1024){error.textContent='Please choose an image or PDF smaller than 6 MB.';return}if(Object.values(attachments).reduce((s,a)=>s+(a.size||0),0)+file.size>20*1024*1024){error.textContent='This draft has reached its 20 MB attachment limit.';return}const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());const sig=String.fromCharCode(...bytes);const pdf=sig.startsWith('%PDF-');let mime;if(pdf)mime='application/pdf';else if(bytes[0]===137&&sig.slice(1,4)==='PNG')mime='image/png';else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)mime='image/jpeg';else if(sig.startsWith('GIF87a')||sig.startsWith('GIF89a'))mime='image/gif';else if(sig.startsWith('RIFF')&&sig.slice(8,12)==='WEBP')mime='image/webp';else{error.textContent='Supported attachments: PNG, JPEG, GIF, WebP, and PDF.';return}const reader=new FileReader();reader.onload=()=>{const id=`file-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;const url=reader.result.replace(/^data:[^;]+;/,`data:${mime};`);attachments[id]={name:file.name,url,size:file.size};const name=file.name.replace(/[\[\]\\\n\r]/g,' ');insertText(`\n\n${pdf?'':'!'}[${name}](attachment:${id})\n\n`)};reader.onerror=()=>{error.textContent='The attachment could not be read. Please try again.'};reader.readAsDataURL(file)}
  root.addEventListener('click',event=>{const button=event.target.closest('button,a[data-view],a[data-file]');if(!button)return;
    if(button.dataset.file){event.preventDefault();const item=resolveFile(button.dataset.file);if(item){const mime=item.url.slice(5,item.url.indexOf(';'));const bytes=Uint8Array.from(atob(item.url.split(',')[1]),c=>c.charCodeAt(0));download(new Blob([bytes],{type:mime}),item.name)}return}
    if(button.dataset.view){event.preventDefault();goto(button.dataset.view);return}
    if(button.dataset.note){goto('article',button.dataset.note);return}
    if(button.dataset.filter){filter=button.dataset.filter;updateList();return}
    if(button.dataset.subject){filter=button.dataset.subject;query='';goto('notebook');return}
    if(button.dataset.section){root.querySelector(`#ln-section-${button.dataset.section}`)?.scrollIntoView({block:'start',behavior:'smooth'});return}
    if(button.dataset.insert){insertText(button.dataset.insert==='heading'?'\n\n## A new thought\n\n':'\n\n$$\nE = mc^2\n$$\n\n');return}
    switch(button.dataset.action){
      case 'search':{const box=root.querySelector('#ln-search-box');box.hidden=!box.hidden;button.setAttribute('aria-expanded',String(!box.hidden));if(!box.hidden)root.querySelector('#ln-search').focus();break}
      case 'save':saveDraft(button);break;
      case 'export-draft':captureDraft();exportMarkdown(draft.title,draft.body);setStatus('Download requested. Keep the file as your backup.');break;
      case 'export-note':{const n=notes.find(n=>n.id===button.dataset.id);exportMarkdown(n.title,n.body);break}
      case 'attach-image':case 'attach-pdf':{const file=root.querySelector('#ln-file');file.accept=button.dataset.action==='attach-pdf'?'.pdf,application/pdf':'.png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp';file.value='';file.click();break}
    }
  });
  root.addEventListener('input',event=>{if(event.target.id==='ln-search'){query=event.target.value;updateList()}if(event.target.id==='ln-draft-title'||event.target.id==='ln-draft-body'){captureDraft();clearTimeout(saveTimer);saveTimer=setTimeout(updateDraftPreview,120);setStatus('Unsaved changes. Save here or download a copy.')}});
  root.addEventListener('change',event=>{if(event.target.id==='ln-file')attach(event.target.files[0])});
  root.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='s'&&view==='editor'){event.preventDefault();saveDraft(root.querySelector('[data-action=save]'))}});
  if(window.LANL2VZ_STANDALONE){const route=()=>{const hash=location.hash.slice(1);if(hash.startsWith('note/'))goto('article',hash.slice(5));else goto(['archive','about','editor'].includes(hash)?hash:'notebook')};window.addEventListener('popstate',route);route()}else notebook();
})();
