import { escapeHtml } from '../common/utils.js';

export { escapeHtml };


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

    l = l.replace(/^(&gt;)+/, '<span class="hl-quote">$&</span>');

    l = l.replace(/^(\s*)([-*+]|\d{1,3}\.)(\s)/, (_, sp, mk, ws) => {
      return sp + '<span class="hl-list-marker">' + mk + '</span>' + ws;
    });

    l = l.replace(/^(-{3,}|\*{3,}|_{3,})$/, '<span class="hl-hr">$&</span>');

    l = l.replace(/^(\|[\s:-]+\|[\s:-]+\|)/, '<span class="hl-table-sep">$1</span>');

    l = l.replace(/!\[([^\]]*)\]\(([^)]*)\)/g,
      '<span class="hl-image">![<span class="hl-img-alt">$1</span>](<span class="hl-img-url">$2</span>)</span>');

    l = l.replace(/\[([^\]]*)\]\(([^)]*)\)/g,
      '<span class="hl-link">[<span class="hl-link-text">$1</span>](<span class="hl-link-url">$2</span>)</span>');

    l = l.replace(/(`[^`\n]+`)/g, '<span class="hl-code">$1</span>');

    l = l.replace(/(\*\*\*\S[^*]*\*\*\*)/g, '<span class="hl-em-strong">$1</span>');
    l = l.replace(/(\*\*\S[^*]*\*\*)/g, '<span class="hl-strong">$1</span>');
    l = l.replace(/(?<!\*)\*(\S[^*]*)\*(?!\*)/g, '<span class="hl-em">*$1*</span>');
    l = l.replace(/(___\S[^_]*___)/g, '<span class="hl-em-strong">$1</span>');
    l = l.replace(/(__\S[^_]*__)/g, '<span class="hl-strong">$1</span>');
    l = l.replace(/(?<!_)_(\S[^_]*)_(?!_)/g, '<span class="hl-em">_$1_</span>');

    l = l.replace(/(~~\S[^~]*~~)/g, '<span class="hl-strike">$1</span>');

    l = l.replace(/^(#{1,6})\s+/, (_, hashes) => {
      return '<span class="hl-hash">' + hashes + '</span> ';
    });
    l = l.replace(/^(<span class="hl-hash">[#]+<\/span> )(.+)/, (_, hash, rest) => {
      let level = (hash.match(/#/g) || []).length;
      return hash + '<span class="hl-heading hl-h' + level + '">' + rest + '</span>';
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
