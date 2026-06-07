var API = 'https://guestbook-api.clovehitch.workers.dev';
var allEntries = [];

function fmtDate(ts) {
  var d = new Date(ts);
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

function timeAgo(ts) {
  var diff = Date.now() - ts;
  var mins = Math.floor(diff / 60000);
  var rel;
  if (mins < 1) rel = 'just now';
  else if (mins < 60) rel = mins + 'm ago';
  else { var hrs = Math.floor(mins / 60); if (hrs < 24) rel = hrs + 'h ago'; else { var days = Math.floor(hrs / 24); rel = days + 'd ago'; } }
  return rel + ' • ' + fmtDate(ts);
}

function escapeHtml(s) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(s));
  return d.innerHTML;
}

function render(entries) {
  var el = document.getElementById('messages');
  if (!entries || !entries.length) {
    var searchEl = document.getElementById('searchInput');
    var isSearch = searchEl && searchEl.value.trim();
    el.innerHTML = '<div class="entry entry--empty"><div class="entry-head"><span class="entry-name">&nbsp;</span><span class="entry-time">&nbsp;</span></div><div class="entry-msg">' + (isSearch ? 'no matching entries' : 'no entries yet — be the first') + '</div></div>';
    return;
  }
  el.innerHTML = entries.map(function(e) {
    return '<div class="entry">'
      + '<div class="entry-head">'
      + '<span class="entry-name">' + escapeHtml(e.name) + '</span>'
      + '<span class="entry-time">' + timeAgo(e.timestamp) + '</span>'
      + '</div>'
      + '<div class="entry-msg">' + escapeHtml(e.message) + '</div>'
      + '</div>';
  }).join('');
}

function doSearch() {
  var q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) { render(allEntries); return; }
  var filtered = allEntries.filter(function(e) {
    return e.name.toLowerCase().indexOf(q) !== -1 || e.message.toLowerCase().indexOf(q) !== -1;
  });
  render(filtered);
}

function toggleSearch() {
  var bar = document.getElementById('searchBar');
  var btn = document.getElementById('searchBtn');
  var input = document.getElementById('searchInput');
  var isOpen = bar.classList.toggle('open');
  btn.classList.toggle('active', isOpen);
  if (isOpen) {
    input.focus();
  } else {
    input.value = '';
    render(allEntries);
  }
}

function load() {
  var msgs = document.getElementById('messages');
  msgs.innerHTML = '<div class="entry entry--empty"><div class="entry-head"><span class="entry-name">&nbsp;</span><span class="entry-time">&nbsp;</span></div><div class="entry-msg">loading…</div></div>';

  fetch(API + '/entries')
    .then(function(r) {
      if (!r.ok) throw new Error('status ' + r.status);
      return r.json();
    })
    .then(function(entries) { allEntries = entries; render(entries); })
    .catch(function() {
      msgs.innerHTML = '<div class="entry entry--empty"><div class="entry-head"><span class="entry-name">&nbsp;</span><span class="entry-time">&nbsp;</span></div><div class="entry-msg">no entries yet</div></div>';
    });
}

function submit() {
  var nameEl = document.getElementById('inputName');
  var msgEl = document.getElementById('inputMsg');
  var btn = document.getElementById('sendBtn');
  var name = nameEl.value.trim();
  var msg = msgEl.value.trim();
  if (!name || !msg) return;

  btn.disabled = true;
  btn.textContent = 'sending…';

  fetch(API + '/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, message: msg }),
  })
  .then(function(r) {
    if (!r.ok) throw new Error('send failed');
    return r.json();
  })
  .then(function(entries) {
    allEntries = entries;
    var bar = document.getElementById('searchBar');
    if (bar.classList.contains('open')) toggleSearch();
    nameEl.value = '';
    msgEl.value = '';
    nameEl.focus();
    render(entries);
  })
  .catch(function() {
    btn.textContent = 'error';
    setTimeout(function() { btn.textContent = 'send'; btn.disabled = false; }, 2000);
  })
  .then(function() {
    setTimeout(function() {
      btn.disabled = false;
      btn.textContent = 'send';
    }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  load();

  document.getElementById('searchInput').addEventListener('keyup', function(e) {
    if (e.key === 'Escape') { toggleSearch(); return; }
    doSearch();
  });
  document.getElementById('searchBtn').addEventListener('click', toggleSearch);
  document.getElementById('sendBtn').addEventListener('click', submit);
  document.getElementById('inputMsg').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') submit();
  });
  document.getElementById('inputName').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('inputMsg').focus();
  });

  document.getElementById('calNavLink').href = '/'
    + ['january','february','march','april','may','june',
       'july','august','september','october','november','december'][new Date().getMonth()];

  (function() {
    var toggle = document.getElementById('navToggle');
    var dropdown = document.getElementById('navDropdown');
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#siteNav')) {
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  })();
});
