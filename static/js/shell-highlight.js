// Chroma only colors comments, strings and variables in bash and PowerShell blocks.
// This adds what it does not know: the command at the start of a line and its flags.
// It only touches plain text, so comments and strings that Chroma already colored stay as they are.
document.addEventListener('DOMContentLoaded', () => {
  const blocks = document.querySelectorAll(
    '.markdown code.language-bash, .markdown code.language-sh, .markdown code.language-shell, ' +
    '.markdown code.language-zsh, .markdown code.language-powershell, .markdown code.language-ps1'
  );

  // A flag: -x, -xyz, --long-name, --name=value (PowerShell: -Name). Must start a word.
  const FLAG = /(^|\s)(--?[A-Za-z][\w-]*)(?=$|[\s=])/g;
  // Line start: optional prompt, then the command word.
  const LINE = /^(\s*)((?:\$|PS>|>)\s+)?([A-Za-z_./~][\w./~:+-]*)/;

  function span(cls, text) {
    const el = document.createElement('span');
    el.className = cls;
    el.textContent = text;
    return el;
  }

  // Highlight one text node; `atLineStart` is true when it begins a new line.
  function process(node, atLineStart) {
    const text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let rest = text;

    if (atLineStart) {
      const m = LINE.exec(rest);
      if (m && !/^(if|then|else|fi|for|do|done|while|case|esac|function|in)$/.test(m[3])) {
        frag.append(m[1]);
        if (m[2]) frag.append(span('sh-prompt', m[2]));
        frag.append(span('sh-cmd', m[3]));
        rest = rest.slice(m[0].length);
      }
    }

    let last = 0;
    let match;
    FLAG.lastIndex = 0;
    while ((match = FLAG.exec(rest)) !== null) {
      const start = match.index + match[1].length;
      frag.append(rest.slice(last, start));
      frag.append(span('sh-flag', match[2]));
      last = start + match[2].length;
    }
    frag.append(rest.slice(last));
    node.replaceWith(frag);
  }

  blocks.forEach((code) => {
    // Walk the text nodes that sit directly in the code element or in Chroma's line wrappers.
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    // A text node starts a line if the text before it in the block ends with a newline (or nothing).
    let before = '';
    nodes.forEach((node) => {
      const startsLine = before === '' || before.endsWith('\n');
      const parent = node.parentElement;
      // Plain text sits in the code element or in Chroma's line wrappers (.line, .cl).
      // Tokens Chroma colored (comments, strings, variables) are in other spans: leave those alone.
      const plain = parent === code || parent.classList.contains('line') || parent.classList.contains('cl');
      before += node.nodeValue;
      if (plain && node.nodeValue.trim() !== '') process(node, startsLine);
    });
  });
});
