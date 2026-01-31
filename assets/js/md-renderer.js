/* assets/js/md-renderer.js */

function escapeHtml(str){
  return str.replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

function parseFrontMatter(md){
  const fm = {meta:{}, content: md};
  if(md.startsWith('---')){
    const parts = md.split(/\n-{3,}\n/);
    if(parts.length >= 2){
      const rawMeta = parts[0].replace(/^---\n/,'');
      rawMeta.split('\n').forEach(line => {
        const m = line.match(/^([^:]+):\s*(.*)$/);
        if(m) fm.meta[m[1].trim().toLowerCase()] = m[2].trim();
      });
      fm.content = parts.slice(1).join('\n---\n');
    }
  }
  return fm;
}

function inlineFormat(text){
  text = escapeHtml(text);
  // Images
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="paper-img">');
  // Links
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.*?)_/g, '<em>$1</em>');
  // Inline Code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  return text;
}

function mdToHtml(md){
  const lines = md.replace(/\r/g,'').split('\n');
  let out = '';
  let i = 0;
  let inCode = false;
  let codeLang = '';
  let codeBuf = [];
  let listType = null; 
  let listBuf = [];

  function flushList(){
    if(!listType) return;
    out += `<${listType}>` + listBuf.map(li=>`<li>${inlineFormat(li.trim())}</li>`).join('') + `</${listType}>`;
    listType = null; listBuf = [];
  }

  while(i < lines.length){
    let line = lines[i];

    // Code blocks
    const fence = line.match(/^```(\S*)/);
    if(fence){
      if(!inCode){ inCode = true; codeLang = fence[1] || ''; codeBuf = []; i++; continue; }
      else { 
        const codeHtml = '<pre><code' + (codeLang?` class="lang-${escapeHtml(codeLang)}"`:'') + '>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>';
        out += codeHtml; inCode = false; codeLang=''; codeBuf = []; i++; continue;
      }
    }
    if(inCode){ codeBuf.push(line); i++; continue; }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)/);
    if(h){ flushList(); out += `<h${h[1].length}>${inlineFormat(h[2].trim())}</h${h[1].length}>`; i++; continue; }

    // Horizontal Rule
    if(/^(-{3,}|\*{3,})\s*$/.test(line)){ flushList(); out += '<hr>'; i++; continue; }

    // Blockquote
    const bq = line.match(/^>\s?(.*)/);
    if(bq){ flushList(); out += `<blockquote>${inlineFormat(bq[1])}</blockquote>`; i++; continue; }

    // Lists
    const ul = line.match(/^\s*[-\*]\s+(.*)/);
    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    if(ul){ if(listType !== 'ul') flushList(), listType='ul'; listBuf.push(ul[1]); i++; continue; }
    if(ol){ if(listType !== 'ol') flushList(), listType='ol'; listBuf.push(ol[1]); i++; continue; }

    // Paragraphs
    if(line.trim() !== ''){ flushList(); let para = line;
      let j = i+1;
      while(j < lines.length && lines[j].trim() !== '' && !/^(#{1,6}|>| |\s*[-\*]|\s*\d+\.|```)/.test(lines[j])){
        para += ' ' + lines[j].trim(); j++;
      }
      out += `<p>${inlineFormat(para.trim())}</p>`; i = j; continue;
    }
    flushList(); i++;
  }
  flushList();
  return out;
}

async function renderMarkdownTo(selectorId='paperContent'){
  const el = document.getElementById(selectorId);
  if(!el) return;

  const params = new URLSearchParams(window.location.search);
  let mdName = params.get('doc');

  if (!mdName) {
    const path = window.location.pathname;
    const htmlName = path.substring(path.lastIndexOf('/')+1) || 'index.html';
    mdName = htmlName.replace(/\.html?$/,'') + '.md';
  }

  try{
    const res = await fetch(mdName);
    if(!res.ok) throw new Error('Paper not found: ' + mdName);
    
    const raw = await res.text();
    const {meta, content} = parseFrontMatter(raw);
    
    el.innerHTML = ''; 

    // 1. Render Meta Data (Title, Author, Date)
    if(meta.title){ 
        document.title = meta.title + " | Eden's Library"; 
        const h = document.createElement('h1'); 
        h.innerText = meta.title; 
        el.appendChild(h); 
    }
    if(meta.author || meta.date){
      const p = document.createElement('p');
      p.style.opacity = '0.8';
      p.style.marginBottom = '1rem'; // Reduced margin to fit button closer
      p.innerHTML = `${meta.author?'<strong>Author:</strong> '+escapeHtml(meta.author):''}${meta.date?'<br><strong>Date:</strong> '+escapeHtml(meta.date):''}`;
      el.appendChild(p);
    }

    // --- NEW: FONT TOGGLE BUTTON ---
    const btnBox = document.createElement('div');
    btnBox.style.marginBottom = '2rem';
    btnBox.style.borderBottom = '2px dashed var(--primary-color)';
    btnBox.style.paddingBottom = '1rem';

    const btn = document.createElement('button');
    btn.innerText = "Aa | Switch to Readable Font";
    btn.className = "font-toggle-btn"; 
    
    // The Toggle Logic
    btn.onclick = () => {
        const isSystem = el.classList.toggle('system-font-mode');
        btn.innerText = isSystem ? "✎ | Switch to Silly Font" : "Aa | Switch to Readable Font";
    };

    btnBox.appendChild(btn);
    el.appendChild(btnBox);
    // -------------------------------

    // 3. Render Main Content
    const html = mdToHtml(content);
    const container = document.createElement('div'); 
    container.innerHTML = html;
    el.appendChild(container);

  }catch(err){
    console.error(err);
    el.innerHTML = '<p style="color: #8b4513; font-weight: bold;">Oops! Could not load this paper.<br><span style="font-size:0.8em; opacity:0.7">(' + err.message + ')</span></p>';
  }
}

if(typeof window !== 'undefined'){
  window.addEventListener('DOMContentLoaded', ()=> renderMarkdownTo());
}