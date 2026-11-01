// Adds a "Copy" button to every code block in the page content.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.markdown pre').forEach((pre) => {
    // Mermaid diagrams are <pre class="mermaid">; there is nothing to copy there.
    if (pre.classList.contains('mermaid')) return;

    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');

    btn.addEventListener('click', async () => {
      const text = (pre.querySelector('code') || pre).innerText;
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        // Clipboard API needs a secure context; fall back to a hidden textarea.
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 1500);
    });

    wrap.appendChild(btn);
  });
});
