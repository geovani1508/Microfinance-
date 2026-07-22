import fs from 'fs';

const filePath = 'index.html';
let c = fs.readFileSync(filePath, 'utf8');

const oldStr = "  if(r.created_at||r.createdAt) lines.push('Date: '+(r.created_at||r.createdAt));\r\n  document.getElementById('detailBody').textContent=lines.join('\\n')||'Aucun détail disponible.';";

const newStr = "  if(r.created_at||r.createdAt) lines.push('Date: '+(r.created_at||r.createdAt));\r\n  var html=lines.map(function(l){return '<div style=\"padding:3px 0\">'+esc(l)+'</div>';}).join('')||'Aucun détail disponible.';\r\n  var fileB64=r.id_doc_file_base64||r.idDocFileBase64||'';\r\n  var fileNm=r.id_doc_file_name||r.idDocFileName||'';\r\n  var fileMime=r.id_doc_file_mime||r.idDocFileMime||'';\r\n  if(fileB64&&fileNm){\r\n    html+='<div style=\"margin-top:14px;border-top:1px solid var(--border);padding-top:12px;\">';\r\n    html+='<div style=\"font-weight:700;font-size:14px;margin-bottom:8px;\">📎 Document : '+esc(fileNm)+'</div>';\r\n    html+='<div style=\"max-width:100%;overflow:hidden;border-radius:10px;border:1px solid var(--border);padding:4px;text-align:center;\">';\r\n    if(fileMime.startsWith('image/')){\r\n      html+='<img src=\"'+fileB64+'\" alt=\"Document\" style=\"max-width:100%;max-height:400px;border-radius:8px;display:block;margin:0 auto;\" />';\r\n    } else {\r\n      html+='<iframe src=\"'+fileB64+'\" style=\"width:100%;height:500px;border:none;border-radius:8px;\" title=\"PDF\"></iframe>';\r\n      html+='<div style=\"margin-top:8px\"><a href=\"'+fileB64+'\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-block;padding:10px 20px;background:linear-gradient(135deg,rgba(45,212,191,1),rgba(96,165,250,1));color:#001018;border-radius:10px;font-weight:700;text-decoration:none;\">📥 Ouvrir</a></div>';\r\n    }\r\n    html+='</div></div>';\r\n  }\r\n  document.getElementById('detailBody').innerHTML=html;";

const idx = c.indexOf(oldStr);
if (idx === -1) {
  console.error('OLD STR NOT FOUND');
  // Debug: show chars around the target area
  const searchArea = "if(r.created_at||r.createdAt) lines.push('Date";
  const si = c.indexOf(searchArea);
  if (si > -1) {
    const snippet = c.substring(si, si + 200);
    console.log('Found area, snippet chars:', JSON.stringify(snippet));
  }
  process.exit(1);
}

c = c.replace(oldStr, newStr);
fs.writeFileSync(filePath, c, 'utf8');
console.log('SUCCESS - File patched');

