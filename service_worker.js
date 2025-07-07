'use strict';

let searchWord = '';

// When first installed set the searchWord as '-ai'
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ searchWord: '-ai' });
});

// Load the stored search word when the service worker starts
chrome.storage.sync.get('searchWord', (data) => {
  searchWord = data.searchWord || '-ai';
});

// Keep the local variable in sync when the storage value changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.searchWord) {
    searchWord = changes.searchWord.newValue || '';
  }
});

function isGoogleSearch(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('google.') && parsed.pathname === '/search';
  } catch (e) {
    return false;
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (!details.url.includes('://www.google.') || !details.url.includes('/search')) return;

  chrome.storage.sync.get('searchWord', (data) => {
    const searchWord = (data.searchWord || '-ai').trim();
    if (!searchWord) return;

    const url = new URL(details.url);
    const query = url.searchParams.get('q') || '';
    if (!query.toLowerCase().includes(searchWord.toLowerCase())) {
      url.searchParams.set('q', `${query} ${searchWord}`.trim());
      chrome.tabs.update(details.tabId, { url: url.toString() });
    }
  });
}, {
  url: [{ hostSuffix: 'google.com', pathPrefix: '/search' }]
});
