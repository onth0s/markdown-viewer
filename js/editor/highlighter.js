import { escapeHtml } from '../common/utils.js';

export { escapeHtml };

const MAX_DEPTH = 32;

let countOpenSpans = (s) => {
  let m = s.match(/<span\b/g);
  return m ? m.length : 0;
};

let wrapIfRoom = (currentLine, wrapperClass, inner) => {
  let depth = countOpenSpans(currentLine);
  if (depth + 1 >= MAX_DEPTH) return inner;
  return '<span class="' + wrapperClass + '">' + inner + '</span>';
};

export let highlightMd = (txt) => {
  let h = escapeHtml(txt);
  let lines = h.split('\n');
  let result = [];
  let i = 0;

  while (i < lines.length) {
    let l = lines[i];
    let m = l.match(/^(`{3,})\s*(\w*)/);

    if (m) {
      let fenceMarker = m[1];
      let lang = m[2] ? '<span class="hl-fence-lang">' + m[2] + '</span>' : '';
      let open = '<span class="hl-fence hl-fence-open">' + m[1] + '</span>' + lang;

      let codeLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== fenceMarker) {
        codeLines.push(lines[i]);
        i++;
      }

      let close = i < lines.length
        ? '<span class="hl-fence hl-fence-close">' + lines[i].trim() + '</span>'
        : '';

      result.push(
        '<span class="hl-fenced-block">' +
        open + '\n' +
        (codeLines.length > 0 ? '<span class="hl-code-content">' + codeLines.join('\n') + '</span>\n' : '') +
        close +
        '</span>'
      );
      i++;
      continue;
    }

    l = l.replace(/^(&gt;)+/, (m) => wrapIfRoom(l, 'hl-quote', m));

    l = l.replace(/^(\s*)([-*+]|\d{1,3}\.)(\s)/, (_, sp, mk, ws) => {
      let marker = wrapIfRoom(l, 'hl-list-marker', mk);
      return sp + marker + ws;
    });

    l = l.replace(/^(-{3,}|\*{3,}|_{3,})$/, (m) => wrapIfRoom(l, 'hl-hr', m));

    l = l.replace(/^(\|[\s:-]+\|[\s:-]+\|)/, (m) => wrapIfRoom(l, 'hl-table-sep', m));

    l = l.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_, alt, url) => {
      let inner = '![<span class="hl-img-alt">' + alt + '</span>](<span class="hl-img-url">' + url + '</span>)';
      return wrapIfRoom(l, 'hl-image', inner);
    });

    l = l.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, text, url) => {
      let inner = '[<span class="hl-link-text">' + text + '</span>](<span class="hl-link-url">' + url + '</span>)';
      return wrapIfRoom(l, 'hl-link', inner);
    });

    l = l.replace(/(`[^`\n]+`)/g, (m) => wrapIfRoom(l, 'hl-code', m));

    l = l.replace(/(\*\*\*\S[^*]*\*\*\*)/g, (m) => wrapIfRoom(l, 'hl-em-strong', m));
    l = l.replace(/(\*\*\S[^*]*\*\*)/g, (m) => wrapIfRoom(l, 'hl-strong', m));
    l = l.replace(/(?<!\*)\*(\S[^*]*)\*(?!\*)/g, (_, inner) => '*' + wrapIfRoom(l, 'hl-em', inner) + '*');
    l = l.replace(/(___\S[^_]*___)/g, (m) => wrapIfRoom(l, 'hl-em-strong', m));
    l = l.replace(/(__\S[^_]*__)/g, (m) => wrapIfRoom(l, 'hl-strong', m));
    l = l.replace(/(?<!_)_(\S[^_]*)_(?!_)/g, (_, inner) => '_' + wrapIfRoom(l, 'hl-em', inner) + '_');

    l = l.replace(/(~~\S[^~]*~~)/g, (m) => wrapIfRoom(l, 'hl-strike', m));

    l = l.replace(/^(#{1,6})\s+/, (_, hashes) => {
      return '<span class="hl-hash">' + hashes + '</span> ';
    });
    l = l.replace(/^(<span class="hl-hash">[#]+<\/span> )(.+)/, (_, hash, rest) => {
      let level = (hash.match(/#/g) || []).length;
      return hash + wrapIfRoom(l, 'hl-heading hl-h' + level, rest);
    });

    result.push(l);
    i++;
  }
  return result.join('\n');
};

export let syncHighlight = (editor, editorHighlight) => {
  if (!editor || !editorHighlight) return;
  editorHighlight.innerHTML = highlightMd(editor.value);
  editorHighlight.scrollTop = editor.scrollTop;
};

export let syncHighlightPadding = (editor, editorHighlight) => {
  if (!editor || !editorHighlight) return;
  let scrollbarWidth = editor.offsetWidth - editor.clientWidth;
  if (scrollbarWidth > 0) {
    let basePaddingRight = 16;
    editorHighlight.style.paddingRight = (basePaddingRight + scrollbarWidth) + 'px';
  } else {
    editorHighlight.style.paddingRight = '';
  }
};

export let setupHighlighter = (editor, editorHighlight) => {
  if (!editor || !editorHighlight) return;
  syncHighlightPadding(editor, editorHighlight);
  window.addEventListener('resize', () => syncHighlightPadding(editor, editorHighlight));
  new ResizeObserver(() => syncHighlightPadding(editor, editorHighlight)).observe(editor);
};
