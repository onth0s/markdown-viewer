/**
 * Recursively enriches a list of marked tokens with start and end position offsets
 * relative to the source markdown string.
 *
 * @param {Array} tokens - List of tokens from marked.lexer
 * @param {number} baseOffset - Start offset for the current token list
 */
export let enrichTokensWithPositions = (tokens, baseOffset = 0) => {
  if (!tokens) return;
  let offset = baseOffset;

  for (let token of tokens) {
    token.start = offset;
    token.end = offset + (token.raw ? token.raw.length : 0);

    if (token.tokens && token.tokens.length > 0) {
      let co = 0;
      if (token.type === 'paragraph' || token.type === 'heading' || token.type === 'blockquote') {
        let sumRaws = token.tokens.reduce((s, t) => s + (t.raw ? t.raw.length : 0), 0);
        let off = token.raw.length - sumRaws;
        let firstRaw = token.tokens[0].raw;
        if (firstRaw) {
          let idx = token.raw.indexOf(firstRaw);
          if (idx >= 0) co = idx;
        }
      } else if (token.type === 'list_item') {
        let sumChildRaws = token.tokens.reduce((s, t) => s + (t.raw ? t.raw.length : 0), 0);
        let trailingNl = token.raw.endsWith('\n') ? 1 : 0;
        co = Math.max(0, token.raw.length - sumChildRaws - trailingNl);
      }
      enrichTokensWithPositions(token.tokens, token.start + co);
    } else if (token.items) {
      let itemOffset = token.start;
      for (let item of token.items) {
        item.start = itemOffset;
        item.end = itemOffset + (item.raw ? item.raw.length : 0);
        if (item.tokens) {
          enrichTokensWithPositions(item.tokens, itemOffset);
        }
        itemOffset = item.end;
      }
    } else if (token.type === 'table') {
      let rawLines = token.raw.split('\n');
      let lineOffset = 0;
      let dataRowIdx = 0;
      for (let li = 0; li < rawLines.length; li++) {
        let line = rawLines[li];
        let lineLen = line.length + (li < rawLines.length - 1 ? 1 : 0);
        let isHeader = li === 0;
        let isSeparator = li === 1;

        if (!isSeparator && line.length > 0) {
          let cells = isHeader ? token.header : (token.rows[dataRowIdx] || null);
          if (cells) {
            let pos = 0;
            for (let ci = 0; ci < cells.length; ci++) {
              let pipePos = line.indexOf('|', pos);
              if (pipePos < 0) break;
              let ccs = pipePos + 1;
              let nPipe = line.indexOf('|', ccs);
              if (nPipe < 0) nPipe = line.length;
              let ts = ccs; while (ts < nPipe && line[ts] === ' ') ts++;
              let te = nPipe; while (te > ts && line[te - 1] === ' ') te--;
              pos = nPipe;
              let absCellStart = token.start + lineOffset + ts;
              let cell = cells[ci];
              if (cell && cell.tokens) {
                enrichTokensWithPositions(cell.tokens, absCellStart);
              }
            }
          }
        }
        if (!isHeader && !isSeparator && line.length > 0) dataRowIdx++;
        lineOffset += lineLen;
      }
    }

    offset = token.end;
  }
};

/**
 * Normalizes Windows carriage returns (\r\n) in the selection offsets
 * to match the line-normalized markdown clean offsets. Since everything
 * in the pipeline now uses normalized line endings, this is a pass-through.
 *
 * @param {string} md - Original raw markdown
 * @param {number} offset - Offset in original markdown
 * @returns {number} Offset in normalized markdown
 */
export let translateOffset = (md, offset) => {
  return offset;
};

