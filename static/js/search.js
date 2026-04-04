let searchIndex = [];

fetch('/index.json')
    .then(r => r.json())
    .then(data => { searchIndex = data; })
    .catch(err => console.error('Search index load failed:', err));

// Normalize: lowercase, collapse underscores/hyphens to spaces, trim
function normalize(str) {
    return str.toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Score how well a normalized title matches normalized query tokens
// Higher = better match
function score(normalizedTitle, queryTokens) {
    const title = normalizedTitle;

    // Require ALL tokens to be present somewhere in the title (AND semantics)
    const allPresent = queryTokens.every(tok => title.includes(tok));
    if (!allPresent) return 0;

    let s = 0;

    // Exact full match
    if (title === queryTokens.join(' ')) s += 100;

    // Title starts with the full query
    if (title.startsWith(queryTokens.join(' '))) s += 60;

    // Each token that starts at a word boundary (not mid-word)
    for (const tok of queryTokens) {
        const wordBoundary = new RegExp(`(^|\\s)${escapeRegex(tok)}`);
        if (wordBoundary.test(title)) s += 20;
        else s += 5; // mid-word match — weaker
    }

    // Bonus: shorter titles rank above longer ones for the same query
    s += Math.max(0, 40 - title.length);

    return s;
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text, queryTokens) {
    let result = text;
    for (const tok of queryTokens) {
        // Match the original token in the original-case text
        const re = new RegExp(`(${escapeRegex(tok)})`, 'gi');
        result = result.replace(re, '<mark>$1</mark>');
    }
    return result;
}

document.addEventListener('DOMContentLoaded', function () {
    const input   = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    input.addEventListener('input', function (e) {
        const raw   = e.target.value.trim();
        const query = normalize(raw);
        const tokens = query.split(' ').filter(t => t.length > 0);

        if (tokens.length === 0 || (tokens.length === 1 && tokens[0].length < 2)) {
            results.innerHTML = '';
            results.style.display = 'none';
            return;
        }

        // Score every item
        const scored = searchIndex
            .map(item => ({
                item,
                s: score(normalize(item.title), tokens),
                // Page-level hits get a category bonus
                bonus: item.kind === 'page' ? 30 : 0,
            }))
            .filter(x => x.s > 0)
            .map(x => ({ ...x, total: x.s + x.bonus }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);

        if (scored.length === 0) {
            results.innerHTML = '<div class="search-no-results">No results found</div>';
            results.style.display = 'block';
            return;
        }

        results.innerHTML = scored.map(({ item }) => {
            const isPage = item.kind === 'page';
            const displayTitle = highlightMatch(item.title, tokens);
            const sub = isPage
                ? '<span class="search-result-page search-result-page--page">page</span>'
                : `<span class="search-result-page">in ${item.page}</span>`;
            return `<a href="${item.url}" class="search-result-item${isPage ? ' search-result-item--page' : ''}">
                <span class="search-result-title">${displayTitle}</span>
                ${sub}
            </a>`;
        }).join('');
        results.style.display = 'block';
    });

    document.addEventListener('click', function (e) {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.style.display = 'none';
        }
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            results.style.display = 'none';
            input.blur();
        }
    });
});
