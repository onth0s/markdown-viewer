import { escapeHtml } from '../common/utils.js';

const MAX_DEPTH = 32;

const countOpenSpans = (s) => {
  const m = s.match(/<span\b/g);
  return m ? m.length : 0;
};

const wrapIfRoom = (currentLine, wrapperClass, inner) => {
  const depth = countOpenSpans(currentLine);
  if (depth + 1 >= MAX_DEPTH) return inner;
  return '<span class="' + wrapperClass + '">' + inner + '</span>';
};

export const highlightMd = (txt) => {
  const h = escapeHtml(txt);
  const lines = h.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    let l = lines[i];
    const m = l.match(/^(`{3,})\s*(\w*)/);

    if (m) {
      const fenceMarker = m[1];
      const lang = m[2] ? '<span class="hl-fence-lang">' + m[2] + '</span>' : '';
      const open = '<span class="hl-fence hl-fence-open">' + m[1] + '</span>' + lang;

      const codeLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== fenceMarker) {
        codeLines.push(lines[i]);
        i++;
      }

      const close = i < lines.length
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

    // Stash and highlight inline code blocks so internal characters are not parsed as markdown
    const codePlaceholders = [];
    l = l.replace(/(`[^`\n]+`)/g, (m) => {
      const ph = `%%MDCODE${codePlaceholders.length}%%`;
      codePlaceholders.push(wrapIfRoom(l, 'hl-code', m));
      return ph;
    });

    l = l.replace(/^(&gt;)+/, (m) => wrapIfRoom(l, 'hl-quote', m));

    l = l.replace(/^(\s*)([-*+]|\d{1,3}\.)(\s)/, (_, sp, mk, ws) => {
      const marker = wrapIfRoom(l, 'hl-list-marker', mk);
      return sp + marker + ws;
    });

    l = l.replace(/^(-{3,}|\*{3,}|_{3,})$/, (m) => wrapIfRoom(l, 'hl-hr', m));

    l = l.replace(/^(\|[\s:-]+\|[\s:-]+\|)/, (m) => wrapIfRoom(l, 'hl-table-sep', m));

    // Stash images so link regex cannot match inside image bracket tokens
    const imgPlaceholders = [];
    l = l.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_, alt, url) => {
      const ph = `%%MDIMG${imgPlaceholders.length}%%`;
      const inner = '![<span class="hl-img-alt">' + alt + '</span>](<span class="hl-img-url">' + url + '</span>)';
      imgPlaceholders.push(wrapIfRoom(l, 'hl-image', inner));
      return ph;
    });

    l = l.replace(/(?<!!)\[([^\]]*)\]\(([^)]*)\)/g, (_, text, url) => {
      const inner = '[<span class="hl-link-text">' + text + '</span>](<span class="hl-link-url">' + url + '</span>)';
      return wrapIfRoom(l, 'hl-link', inner);
    });

    // Restore images before emphasis formatting
    for (let pi = 0; pi < imgPlaceholders.length; pi++) {
      l = l.replace(`%%MDIMG${pi}%%`, imgPlaceholders[pi]);
    }

    l = l.replace(/(?<!\*)\*\*\*(\S[^*]*)\*\*\*(?!\*)/g, (m) => wrapIfRoom(l, 'hl-em-strong', m));
    l = l.replace(/(?<!\*)\*\*(\S[^*]*)\*\*(?!\*)/g, (m) => wrapIfRoom(l, 'hl-strong', m));
    l = l.replace(/(?<![*\w])\*(\S[^*]*)\*(?![*\w])/g, (_, inner) => '*' + wrapIfRoom(l, 'hl-em', inner) + '*');
    l = l.replace(/(?<!_)___(\S[^_]*)___(?!_)/g, (m) => wrapIfRoom(l, 'hl-em-strong', m));
    l = l.replace(/(?<!_)__(\S[^_]*)__(?!_)/g, (m) => wrapIfRoom(l, 'hl-strong', m));
    l = l.replace(/(?<![_\w])_(\S[^_]*)_(?![_\w])/g, (_, inner) => '_' + wrapIfRoom(l, 'hl-em', inner) + '_');

    l = l.replace(/(~~\S[^~]*~~)/g, (m) => wrapIfRoom(l, 'hl-strike', m));

    l = l.replace(/^(#{1,6})\s+/, (_, hashes) => {
      return '<span class="hl-hash">' + hashes + '</span> ';
    });
    l = l.replace(/^(<span class="hl-hash">[#]+<\/span> )(.+)/, (_, hash, rest) => {
      const level = (hash.match(/#/g) || []).length;
      return hash + wrapIfRoom(l, 'hl-heading hl-h' + level, rest);
    });

    // Restore code blocks after all inline formatting
    for (let ci = 0; ci < codePlaceholders.length; ci++) {
      l = l.replace(`%%MDCODE${ci}%%`, codePlaceholders[ci]);
    }

    result.push(l);
    i++;
  }
  return result.join('\n');
};

export const syncHighlight = (editor, editorHighlight) => {
  if (!editor || !editorHighlight) return;
  editorHighlight.innerHTML = highlightMd(editor.value);
  editorHighlight.scrollTop = editor.scrollTop;
};

export const syncHighlightPadding = (editor, editorHighlight) => {
  if (!editor || !editorHighlight) return;
  const scrollbarWidth = editor.offsetWidth - editor.clientWidth;
  if (scrollbarWidth > 0) {
    const basePaddingRight = 16;
    editorHighlight.style.paddingRight = (basePaddingRight + scrollbarWidth) + 'px';
  } else {
    editorHighlight.style.paddingRight = '';
  }
};

export const setupHighlighter = (editor, editorHighlight) => {
  if (!editor || !editorHighlight) return;
  syncHighlightPadding(editor, editorHighlight);
  window.addEventListener('resize', () => syncHighlightPadding(editor, editorHighlight));
  new ResizeObserver(() => syncHighlightPadding(editor, editorHighlight)).observe(editor);
};
