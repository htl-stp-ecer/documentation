// Search functionality - searches all headings in markdown files
let searchIndex = [];

// Load search index
fetch('/index.json')
    .then(response => response.json())
    .then(data => {
        searchIndex = data;
    })
    .catch(error => console.error('Error loading search index:', error));

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim().toLowerCase();
        
        // Clear results if query is empty or too short
        if (query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }
        
        // Search in heading titles
        const results = searchIndex.filter(item => 
            item.title.toLowerCase().includes(query)
        ).slice(0, 10); // Limit to 10 results
        
        // Display results
        if (results.length > 0) {
            searchResults.innerHTML = results.map(result => `
                <a href="${result.url}" class="search-result-item">
                    <span class="search-result-title">${highlightMatch(result.title, query)}</span>
                    <span class="search-result-page">in ${result.page}</span>
                </a>
            `).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
            searchResults.style.display = 'block';
        }
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
    
    // Close search results when pressing Escape
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchResults.style.display = 'none';
            searchInput.blur();
        }
    });
});

// Highlight matching text
function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Escape special regex characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
