/**
 * @file emoji-helper.js
 * Utilities for finding and wrapping emoji characters in the DOM.
 */

const emojiRegex = /((?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*)/gu;

/**
 * Traverses text nodes within the root element and wraps any emojis in <span class="emoji-wrapper">.
 * @param {HTMLElement} rootEl
 */
export function wrapEmojis(rootEl) {
  if (!rootEl) return;
  
  // Use TreeWalker to find all text nodes
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach(node => {
    const parent = node.parentNode;
    if (!parent) return;

    // Skip wrapping inside existing wrappers, textareas, code elements (already handled by code wrappers),
    // and style/script tags
    if (parent.classList.contains('emoji-wrapper') ||
        parent.tagName === 'STYLE' ||
        parent.tagName === 'SCRIPT' ||
        parent.tagName === 'TEXTAREA' ||
        parent.closest('pre') ||
        parent.closest('code') ||
        parent.id === 'editor') {
      return;
    }

    const text = node.nodeValue;
    emojiRegex.lastIndex = 0;
    if (emojiRegex.test(text)) {
      emojiRegex.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = emojiRegex.exec(text)) !== null) {
        const matchIndex = match.index;
        const emoji = match[0];

        // Append preceding text
        if (matchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
        }

        // Wrap the emoji in a span
        const span = document.createElement('span');
        span.className = 'emoji-wrapper';
        span.textContent = emoji;
        fragment.appendChild(span);

        lastIndex = emojiRegex.lastIndex;
      }

      // Append remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      parent.replaceChild(fragment, node);
    }
  });
}
