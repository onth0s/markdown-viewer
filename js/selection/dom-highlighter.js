/**
 * Clears all active selection highlights from the container.
 *
 * @param {HTMLElement} container - The preview wrapper element
 */
export let clearHighlights = (container) => {
  if (!container) return;

  // 1. Remove elements with class 'preview-selection' that were added as wrapper spans
  let highlights = container.querySelectorAll('span.preview-selection:not([data-source-pos])');

  for (let span of highlights) {
    let parent = span.parentNode;
    if (parent) {
      // Replace the span with its child nodes (the text node)
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    }
  }

  // Normalize the entire container DOM to merge all adjacent text nodes cleanly
  container.normalize();

  // 2. Remove the 'preview-selection' class from block/inline containers that were fully highlighted
  let selectedContainers = container.querySelectorAll('.preview-selection');
  for (let el of selectedContainers) {
    el.classList.remove('preview-selection');
  }
};

/**
 * Applies visual highlight spans to the elements in the container matching the selection offsets.
 *
 * @param {HTMLElement} container - The preview wrapper element
 * @param {string} markdown - The current markdown content
 * @param {number} selStart - Selection start offset
 * @param {number} selEnd - Selection end offset
 */
export let applyHighlight = (container, markdown, selStart, selEnd) => {
  if (!container || selStart === selEnd || selStart == null || selEnd == null) return;

  // Find all elements containing source pos mappings
  let elements = Array.from(container.querySelectorAll('[data-source-pos]'));

  for (let el of elements) {
    let sourcePos = el.getAttribute('data-source-pos');
    if (!sourcePos) continue;

    let [start, end] = sourcePos.split('-').map(Number);
    if (isNaN(start) || isNaN(end)) continue;

    // Check if this element overlaps with the selection range
    if (start < selEnd && end > selStart) {
      let fullyCovered = start >= selStart && end <= selEnd;

      if (fullyCovered) {
        // Apply the class for container-level background fill.
        el.classList.add('preview-selection');

        // For leaf elements (no data-source-pos children) also wrap every text
        // node individually. This is necessary because Prism syntax-token CSS
        // rules have specificity (0,2,0) — e.g. .token.keyword — which beats
        // our .preview-selection * rule at (0,1,0). Without text-node wrapping
        // the selection colour is silently overridden for syntax-highlighted
        // code blocks, making characters appear "missing" on Ctrl-A.
        let hasSourceChildren = el.querySelector('[data-source-pos]');
        if (!hasSourceChildren) {
          let domText = el.textContent || '';
          if (domText) {
            highlightTextRange(el, 0, domText.length);
          }
        }
      } else {
        // Partially covered. Check if it has any children with data-source-pos.
        // If it does, we let the children handle their own partial selections.
        let hasSourceChildren = el.querySelector('[data-source-pos]');
        if (hasSourceChildren) continue;

        // Leaf element containing text node(s). Wrap the intersecting text range.
        let domText = el.textContent || '';
        if (!domText) continue;

        // Align the DOM text index to raw markdown index
        let rawText = markdown.substring(start, end);
        let prefixLen = rawText.indexOf(domText);
        if (prefixLen < 0) prefixLen = 0; // fallback

        // Calculate overlapping range in DOM text space
        let localStart = Math.max(0, selStart - start - prefixLen);
        let localEnd = Math.min(domText.length, selEnd - start - prefixLen);

        if (localStart < localEnd) {
          highlightTextRange(el, localStart, localEnd);
        }
      }
    }
  }
};

/**
 * Wraps a specific character range within an element's text nodes in a span.preview-selection
 *
 * @param {HTMLElement} element - The leaf element containing text
 * @param {number} startOffset - Character start index within the element's textContent
 * @param {number} endOffset - Character end index within the element's textContent
 */
function highlightTextRange(element, startOffset, endOffset) {
  let textNodes = getTextNodes(element);
  let currentOffset = 0;

  for (let node of textNodes) {
    let nodeLen = node.textContent.length;
    let nodeStart = currentOffset;
    let nodeEnd = currentOffset + nodeLen;

    if (nodeStart < endOffset && nodeEnd > startOffset) {
      let localStart = Math.max(0, startOffset - nodeStart);
      let localEnd = Math.min(nodeLen, endOffset - nodeStart);

      // Split the text node and wrap the target range
      let range = document.createRange();
      range.setStart(node, localStart);
      range.setEnd(node, localEnd);

      let span = document.createElement('span');
      span.className = 'preview-selection';
      
      try {
        range.surroundContents(span);
      } catch (e) {
        // Fallback: if surroundContents fails due to non-text intersections
        let wrapped = node.textContent.substring(localStart, localEnd);
        let before = node.textContent.substring(0, localStart);
        let after = node.textContent.substring(localEnd);
        
        let parent = node.parentNode;
        if (parent) {
          let beforeNode = document.createTextNode(before);
          let spanNode = document.createElement('span');
          spanNode.className = 'preview-selection';
          spanNode.textContent = wrapped;
          let afterNode = document.createTextNode(after);
          
          parent.insertBefore(beforeNode, node);
          parent.insertBefore(spanNode, node);
          parent.insertBefore(afterNode, node);
          parent.removeChild(node);
        }
      }
    }

    currentOffset = nodeEnd;
  }
}

/**
 * Recursively collects all text nodes within an element.
 */
function getTextNodes(node) {
  let textNodes = [];
  if (node.nodeType === Node.TEXT_NODE) {
    textNodes.push(node);
  } else {
    for (let child of node.childNodes) {
      textNodes.push(...getTextNodes(child));
    }
  }
  return textNodes;
}
