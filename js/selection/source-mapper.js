import { stripCR } from '../common/utils.js';

/**
 * Recursively enriches a list of marked tokens with start and end position offsets
 * relative to the source markdown string.
 *
 * @param {Array} tokens - List of tokens from marked.lexer
 * @param {number} baseOffset - Start offset for the current token list
 */
export const enrichTokensWithPositions = (tokens, baseOffset = 0) => {
  if (!tokens) return;
  let offset = baseOffset;

  for (const token of tokens) {
    token.start = offset;
    token.end = offset + (token.raw ? token.raw.length : 0);

    if (token.tokens && token.tokens.length > 0) {
      let co = 0;
      if (token.type === 'paragraph' || token.type === 'heading' || token.type === 'blockquote') {
        const firstRaw = token.tokens[0].raw;
        if (firstRaw) {
          const idx = token.raw.indexOf(firstRaw);
          if (idx >= 0) co = idx;
        }
      } else if (token.type === 'list_item') {
        const sumChildRaws = token.tokens.reduce((s, t) => s + (t.raw ? t.raw.length : 0), 0);
        const trailingNl = token.raw.endsWith('\n') ? 1 : 0;
        co = Math.max(0, token.raw.length - sumChildRaws - trailingNl);
      }
      enrichTokensWithPositions(token.tokens, token.start + co);
    } else if (token.items) {
      let itemOffset = token.start;
      for (const item of token.items) {
        item.start = itemOffset;
        item.end = itemOffset + (item.raw ? item.raw.length : 0);
        if (item.tokens) {
          enrichTokensWithPositions(item.tokens, itemOffset);
        }
        itemOffset = item.end;
      }
    } else if (token.type === 'table') {
      const rawLines = token.raw.split('\n');
      let lineOffset = 0;
      let dataRowIdx = 0;
      for (let li = 0; li < rawLines.length; li++) {
        const line = rawLines[li];
        const lineLen = line.length + (li < rawLines.length - 1 ? 1 : 0);
        const isHeader = li === 0;
        const isSeparator = li === 1;

        if (!isSeparator && line.length > 0) {
          const cells = isHeader ? token.header : (token.rows[dataRowIdx] || null);
          if (cells) {
            let pos = 0;
            for (let ci = 0; ci < cells.length; ci++) {
              const pipePos = line.indexOf('|', pos);
              if (pipePos < 0) break;
              const ccs = pipePos + 1;
              let nPipe = line.indexOf('|', ccs);
              if (nPipe < 0) nPipe = line.length;
              let ts = ccs; while (ts < nPipe && line[ts] === ' ') ts++;
              let te = nPipe; while (te > ts && line[te - 1] === ' ') te--;
              pos = nPipe;
              const absCellStart = token.start + lineOffset + ts;
              const cell = cells[ci];
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
 * to match the line-normalized markdown clean offsets.
 *
 * @param {string} md - Original raw markdown
 * @param {number} offset - Offset in original markdown
 * @returns {number} Offset in normalized markdown
 */
export const translateOffset = (md, offset) => {
  if (!md) return offset;
  return stripCR(md.slice(0, offset)).length;
};

