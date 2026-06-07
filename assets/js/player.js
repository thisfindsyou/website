// ── Config ─────────────────────────────────────────────────────────
const MONTHS = ['january','february','march','april','may','june',
                'july','august','september','october','november','december'];
document.getElementById('calNavLink').href = '/' + MONTHS[new Date().getMonth()];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const YEAR = new Date().getFullYear();

// ── Detect month from URL ──────────────────────────────────────────
const slug = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '');
let currentMonthIndex = Math.max(0, MONTHS.indexOf(slug));

// ── State ──────────────────────────────────────────────────────────
let calendarData = {};
let selectedDay  = null;
let currentFiles = [];
let currentTrack = 0;
let isPlaying    = false;
let loadedFile   = null;
let isFullscreen = false;

const audioEl = document.getElementById('audio-player');
const videoEl = document.getElementById('video-player');

// ── Display helpers ────────────────────────────────────────────────
function displayName(f) {
    return f.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function isImageFile(f) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(f);
}

function isVideoFile(f) {
    return /\.(mp4|webm|mov)$/i.test(f);
}

function ordinal(n) {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fileLabel(day, f) {
    const data = calendarData[monthKey()];
    if (!data) return displayName(f);
    const entry = data.find(d => d.day === day);
    return (entry && entry.labels && entry.labels[f]) || displayName(f);
}

function blogForDay(day) {
    const data = calendarData[monthKey()];
    if (!data) return null;
    const entry = data.find(d => d.day === day);
    return (entry && entry.blog) ? entry.blog : null;
}

function blogDisplayName(url) {
    return url.split('/').pop().replace(/^\d{4}-\d{2}-\d{2}-/, '') + '.txt';
}

// ── Data helpers ───────────────────────────────────────────────────
function monthKey() {
    return `${YEAR}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
}

function daysInMonth(m) { return new Date(YEAR, m + 1, 0).getDate(); }
function firstDayOf(m)  { return new Date(YEAR, m, 1).getDay(); }

function filesForDay(day) {
    const data = calendarData[monthKey()];
    if (!data) return [];
    const entry = data.find(d => d.day === day);
    return entry ? (entry.files || []) : [];
}

function daysWithFiles() {
    const data = calendarData[monthKey()];
    if (!data) return [];
    return data.map(d => d.day).sort((a, b) => a - b);
}

// ── Calendar render ────────────────────────────────────────────────
function renderCalendar() {
    const grid   = document.getElementById('calendar');
    grid.innerHTML = '';

    const days   = daysInMonth(currentMonthIndex);
    const offset = (firstDayOf(currentMonthIndex) + 6) % 7;
    const rowCount = Math.ceil((offset + days) / 7);
    document.documentElement.style.setProperty('--cal-rows', rowCount);

    for (let i = 0; i < offset; i++) {
        const el = document.createElement('div');
        el.className = 'cal-cell empty';
        grid.appendChild(el);
    }

     for (let d = 1; d <= days; d++) {
         const files = filesForDay(d);
         const blog  = blogForDay(d);
         const cell  = document.createElement('div');
         cell.className = 'cal-cell' + (files.length || blog ? ' has-files' : '');
         if (d === selectedDay) cell.classList.add('selected');

         const num = document.createElement('div');
         num.className = 'day-num';
         num.textContent = d;
         cell.appendChild(num);

         if (files.length > 0 || blog) {
             const list = document.createElement('div');
             list.className = 'file-list';

             const allItems = [...files];
             if (blog) allItems.push(blog);
             const totalCount = allItems.length;

             const count = document.createElement('div');
             count.className = 'file-more';
             count.textContent = totalCount === 1 ? '1 file' : `${totalCount} files`;
             count.addEventListener('click', e => { e.stopPropagation(); openDropdown(count, files, blog, d); });
             list.appendChild(count);

             cell.appendChild(list);
             cell.addEventListener('click', () => selectDay(d, 0));
         }

         grid.appendChild(cell);
     }
}

 // ── Dropdown ───────────────────────────────────────────────────────
 function openDropdown(triggerEl, files, blog, day) {
     const dd = document.getElementById('file-dropdown');
     dd.innerHTML = '';

     files.forEach((f, i) => {
         const item = document.createElement('div');
         item.className = 'dd-item' + (day === selectedDay && i === currentTrack ? ' playing' : '');
         item.textContent = displayName(f);
         item.title = displayName(f);
         item.addEventListener('mousedown', e => {
             e.preventDefault();
             e.stopPropagation();
             selectDay(day, i);
             closeDropdown();
         });
         dd.appendChild(item);
     });

     if (blog) {
         const blogItem = document.createElement('div');
         blogItem.className = 'dd-item';
         blogItem.textContent = blogDisplayName(blog);
         blogItem.title = blogDisplayName(blog);
         blogItem.addEventListener('mousedown', e => {
             e.preventDefault();
             e.stopPropagation();
             window.location.href = blog + '?from=' + MONTHS[currentMonthIndex];
         });
         dd.appendChild(blogItem);
     }

     dd.style.display = 'block';

     const rect  = triggerEl.getBoundingClientRect();
     const ddH   = dd.offsetHeight;
     const below = window.innerHeight - rect.bottom;

     dd.style.top  = (below >= ddH + 8 ? rect.bottom + 4 : rect.top - ddH - 4) + 'px';

     if (rect.left > window.innerWidth / 2) {
         dd.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
         dd.style.left = 'auto';
     } else {
         dd.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 310)) + 'px';
         dd.style.right = 'auto';
     }
 }

function closeDropdown() {
    document.getElementById('file-dropdown').style.display = 'none';
}

// ── Image ──────────────────────────────────────────────────────────
function updateImage() {
    const img      = document.getElementById('month-image');
    const noImgEl  = document.getElementById('no-image-text');
    const src      = `assets/images/${MONTHS[currentMonthIndex]}.webp`;

    img.onload  = () => { img.style.display = 'block'; noImgEl.style.display = 'none'; };
    img.onerror = () => { img.style.display = 'none';  noImgEl.style.display = ''; };
    img.src = src;
}

// ── Audio ──────────────────────────────────────────────────────────
audioEl.addEventListener('play',  () => { isPlaying = true;  updatePlayBtn(); if (isFullscreen) updateFullscreenPlayBtn(); });
audioEl.addEventListener('pause', () => { isPlaying = false; updatePlayBtn(); if (isFullscreen) updateFullscreenPlayBtn(); });
audioEl.addEventListener('ended', smartNext);

// ── Video ──────────────────────────────────────────────────────────
videoEl.addEventListener('play',  () => { isPlaying = true;  updatePlayBtn(); });
videoEl.addEventListener('pause', () => { isPlaying = false; updatePlayBtn(); });
videoEl.addEventListener('ended', smartNext);

function playFile(file, autoplay = true) {
    const img     = document.getElementById('month-image');
    const noImg   = document.getElementById('no-image-text');

    videoEl.style.display = 'none';
    videoEl.pause();

    if (isImageFile(file)) {
        const webp   = file.replace(/\.\w+$/, '.webp');
        img.onload   = () => { img.style.display = 'block'; noImg.style.display = 'none'; };
        img.onerror  = () => { img.style.display = 'none';  noImg.style.display = ''; };
        img.src      = `assets/images/${webp}`;
        document.getElementById('play-pause-btn').style.display = 'none';
        loadedFile = file;
        return;
    }

    if (isVideoFile(file)) {
        img.style.display = 'none';
        noImg.style.display = 'none';
        videoEl.src = `assets/videos/${file}`;
        videoEl.style.display = 'block';
        document.getElementById('play-pause-btn').style.display = '';
        loadedFile = file;
        if (autoplay) {
            videoEl.play().catch(err => console.warn('video play blocked:', err));
        }
        return;
    }

    document.getElementById('play-pause-btn').style.display = '';
    updateImage();

    if (file !== loadedFile) {
        audioEl.src = `assets/audio/${file}`;
        loadedFile = file;
    }
    if (autoplay) {
        audioEl.muted = false;
        audioEl.play().catch(err => console.warn('play blocked:', err));
    }
}

function togglePlay() {
    if (!currentFiles.length) return;
    const file = currentFiles[currentTrack];

    if (isVideoFile(file)) {
        if (videoEl.paused) {
            videoEl.muted = false;
            videoEl.play();
        } else {
            videoEl.pause();
        }
        return;
    }

    if (isPlaying) {
        audioEl.pause();
    } else {
        playFile(currentFiles[currentTrack]);
    }
}

function updatePlayBtn() {
    const isVideo = currentFiles.length && isVideoFile(currentFiles[currentTrack]);
    const showPause = isVideo ? !videoEl.paused : isPlaying;
    document.getElementById('play-pause-btn').innerHTML = showPause
        ? '<svg class="play-icon" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg class="play-icon" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';
}

// ── Fullscreen ─────────────────────────────────────────────────────
function openFullscreen(src, type) {
    const overlay = document.getElementById('fullscreen-overlay');
    const fsImg   = document.getElementById('fullscreen-image');
    const fsVideo = document.getElementById('fullscreen-video');
    const fsPlay  = document.getElementById('fullscreen-play-btn');

    fsImg.style.display = 'none';
    fsVideo.style.display = 'none';
    fsVideo.pause();
    fsVideo.src = '';

    if (type === 'image') {
        fsImg.src = src;
        fsImg.style.display = '';
        fsPlay.classList.add('visible');
        fsPlay.innerHTML = audioEl.paused
            ? '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
            : '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    } else if (type === 'video') {
        const currentVideo = document.getElementById('video-player');
        const wasPlaying = !currentVideo.paused;
        currentVideo.pause();
        fsVideo.src = currentVideo.currentSrc || currentVideo.src;
        fsVideo.style.display = '';
        fsVideo.addEventListener('loadedmetadata', function sync() {
            fsVideo.currentTime = currentVideo.currentTime;
            if (wasPlaying) {
                fsVideo.play().catch(() => {});
            }
            fsVideo.removeEventListener('loadedmetadata', sync);
        }, { once: true });
        fsPlay.classList.add('visible');
        fsPlay.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    }

    overlay.classList.add('open');
    isFullscreen = true;
    document.body.style.overflow = 'hidden';
}

function closeFullscreen() {
    const overlay = document.getElementById('fullscreen-overlay');
    const fsImg   = document.getElementById('fullscreen-image');
    const fsVideo = document.getElementById('fullscreen-video');
    const currentVideo = document.getElementById('video-player');

    const wasPlaying = !fsVideo.paused;
    fsVideo.pause();

    if (currentVideo.src && currentVideo.style.display !== 'none') {
        currentVideo.currentTime = fsVideo.currentTime;
        if (wasPlaying) {
            currentVideo.play().catch(() => {});
        }
    }

    overlay.classList.remove('open');
    isFullscreen = false;
    document.body.style.overflow = '';

    setTimeout(() => {
        fsVideo.src = '';
        fsImg.src = '';
    }, 300);
}

// ── Selection ──────────────────────────────────────────────────────
function selectDay(day, trackIndex, autoplay = true, keepFullscreen = false) {
    if (isFullscreen && !keepFullscreen) closeFullscreen();

    selectedDay  = day;
    currentFiles = filesForDay(day);
    currentTrack = typeof trackIndex === 'number'
        ? Math.min(trackIndex, currentFiles.length - 1)
        : 0;
    renderCalendar();
    updateFileInfo();
    if (currentFiles.length) {
        if (isImageFile(currentFiles[currentTrack])) {
            playFile(currentFiles[currentTrack]);
        } else {
            playFile(currentFiles[currentTrack], autoplay);
        }
    }
}

function updateFileInfo() {
     const dateEl   = document.getElementById('fileDate');
     const nameEl   = document.getElementById('fileName');
     const blogWrap = document.getElementById('fileBlogWrap');
     const blogEl   = document.getElementById('fileBlog');
     const blog     = selectedDay !== null ? blogForDay(selectedDay) : null;

     if (selectedDay === null) {
         dateEl.textContent = '';
         nameEl.textContent = '';
         blogWrap.style.display = 'none';
         return;
     }

     dateEl.textContent = `${MONTH_NAMES[currentMonthIndex]} ${ordinal(selectedDay)}, ${YEAR}`;

     if (currentFiles.length) {
         const label = fileLabel(selectedDay, currentFiles[currentTrack]);
         nameEl.textContent = label;
         nameEl.title = label;
     } else {
         nameEl.textContent = '';
         nameEl.title = '';
     }

     if (blog) {
         if (!currentFiles.length) {
             nameEl.innerHTML = '<a href="' + blog + '?from=' + MONTHS[currentMonthIndex] + '" target="_blank" rel="noopener noreferrer">' + blogDisplayName(blog) + '</a>';
             blogWrap.style.display = 'none';
         } else {
             blogEl.textContent = blogDisplayName(blog);
             blogEl.href = blog + '?from=' + MONTHS[currentMonthIndex];
             blogWrap.style.display = '';
         }
     } else {
         blogWrap.style.display = 'none';
     }
 }

// ── File navigation (within a day) ────────────────────────────────
function nextFile() {
    if (!currentFiles.length) return;
    currentTrack = (currentTrack + 1) % currentFiles.length;
    updateFileInfo();
    renderCalendar();
    playFile(currentFiles[currentTrack]);
}

function prevFile() {
    if (!currentFiles.length) return;
    currentTrack = (currentTrack - 1 + currentFiles.length) % currentFiles.length;
    updateFileInfo();
    renderCalendar();
    playFile(currentFiles[currentTrack]);
}

function openFullscreenForCurrentFile() {
    const file = currentFiles[currentTrack];
    if (isImageFile(file)) {
        const imgEl = document.getElementById('month-image');
        if (imgEl.src) openFullscreen(imgEl.src, 'image');
    } else if (isVideoFile(file)) {
        const videoEl = document.getElementById('video-player');
        const src = videoEl.currentSrc || videoEl.src;
        if (src) openFullscreen(src, 'video');
    } else {
        const imgEl = document.getElementById('month-image');
        if (imgEl.src) openFullscreen(imgEl.src, 'image');
    }
}

// ── Smart navigation ───────────────────────────────────────────────
function smartNext() {
    if (isFullscreen) closeFullscreen();
    if (currentFiles.length && currentTrack < currentFiles.length - 1) {
        nextFile();
    } else {
        nextDay();
    }
}

function smartPrev() {
    if (isFullscreen) closeFullscreen();
    if (currentFiles.length && currentTrack > 0) {
        prevFile();
    } else {
        prevDay();
    }
}

// ── Day navigation ─────────────────────────────────────────────────
function nextDay(keepFullscreen = false) {
    const days = daysWithFiles();
    if (!days.length) { goToMonth((currentMonthIndex + 1) % 12, false); return; }

    if (selectedDay === null) { selectDay(days[0], undefined, true, keepFullscreen); return; }

    const idx = days.indexOf(selectedDay);
    if (idx === days.length - 1) {
        goToMonth((currentMonthIndex + 1) % 12, false);
    } else {
        selectDay(days[Math.max(0, idx + 1)], undefined, true, keepFullscreen);
    }
}

function prevDay(keepFullscreen = false) {
    const days = daysWithFiles();
    if (!days.length) { goToMonth((currentMonthIndex - 1 + 12) % 12, true); return; }

    if (selectedDay === null) {
        const d = days[days.length - 1];
        selectDay(d, filesForDay(d).length - 1, true, keepFullscreen);
        return;
    }

    const idx = days.indexOf(selectedDay);
    if (idx <= 0) {
        goToMonth((currentMonthIndex - 1 + 12) % 12, true);
    } else {
        const d = days[idx - 1];
        selectDay(d, filesForDay(d).length - 1, true, keepFullscreen);
    }
}

// ── Month navigation ───────────────────────────────────────────────
function goToMonth(newIndex, selectLast) {
    const target  = MONTHS[newIndex];
    const current = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '');

    if (current !== target) {
        if (selectLast) sessionStorage.setItem('calNav', 'last');
        window.location.href = '/' + target;
    } else {
        currentMonthIndex = newIndex;
        const days = daysWithFiles();
        if (days.length) selectDay(selectLast ? days[days.length - 1] : days[0]);
        else { selectedDay = null; currentFiles = []; renderCalendar(); updateFileInfo(); }
    }
}

// ── Init ───────────────────────────────────────────────────────────
function initPage() {
    updateMonthTitle();
    updateImage();

    const days     = daysWithFiles();
    const selectLast = sessionStorage.getItem('calNav') === 'last';
    sessionStorage.removeItem('calNav');

    if (days.length) {
        const d = selectLast ? days[days.length - 1] : days[0];
        const track = selectLast ? filesForDay(d).length - 1 : 0;
        selectDay(d, track, false);
    } else {
        selectedDay = null;
        currentFiles = [];
        renderCalendar();
        updateFileInfo();
    }
}

function updateMonthTitle() {
    document.getElementById('monthTitle').textContent =
        `${MONTH_NAMES[currentMonthIndex]} ${YEAR}`;
}

async function loadCalendarData() {
    try {
        const res  = await fetch('/assets/data/calendar.json?v=' + Date.now());
        calendarData = await res.json();
    } catch(e) {
        console.error('Could not load calendar data', e);
    }
    initPage();
}

// ── Event Listeners ────────────────────────────────────────────────
document.getElementById('prevMonthBtn').addEventListener('click', () => goToMonth((currentMonthIndex - 1 + 12) % 12, false));
document.getElementById('nextMonthBtn').addEventListener('click', () => goToMonth((currentMonthIndex + 1) % 12, false));
document.getElementById('previous-button').addEventListener('click', smartPrev);
document.getElementById('next-button').addEventListener('click', smartNext);
document.getElementById('fullscreen-close').addEventListener('click', closeFullscreen);

document.getElementById('play-pause-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    togglePlay();
});

document.getElementById('image-container').addEventListener('click', function(e) {
    if (!currentFiles.length) return;
    const file = currentFiles[currentTrack];

    if (isImageFile(file)) {
        const imgEl = document.getElementById('month-image');
        if (imgEl.src) openFullscreen(imgEl.src, 'image');
    } else if (isVideoFile(file)) {
        if (videoEl.paused) {
            videoEl.muted = false;
            videoEl.play();
        } else {
            openFullscreen(videoEl.currentSrc || videoEl.src, 'video');
        }
    } else {
        const imgEl = document.getElementById('month-image');
        if (imgEl.src) openFullscreen(imgEl.src, 'image');
    }
});

function updateFullscreenPlayBtn() {
    const fsPlay = document.getElementById('fullscreen-play-btn');
    const fsVideo = document.getElementById('fullscreen-video');
    const showPause = fsVideo.style.display !== 'none' && fsVideo.src
        ? !fsVideo.paused
        : !audioEl.paused;
    fsPlay.innerHTML = showPause
        ? '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
}

document.getElementById('fullscreen-play-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    const fsVideo = document.getElementById('fullscreen-video');
    if (fsVideo.style.display !== 'none' && fsVideo.src) {
        if (fsVideo.paused) { fsVideo.play(); } else { fsVideo.pause(); }
    } else {
        if (audioEl.paused) { audioEl.play(); } else { audioEl.pause(); }
    }
});
document.getElementById('fullscreen-video').addEventListener('play',  updateFullscreenPlayBtn);
document.getElementById('fullscreen-video').addEventListener('pause', updateFullscreenPlayBtn);

document.getElementById('fullscreen-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeFullscreen();
});

window.addEventListener('keydown', e => {
    if (e.code === 'Escape' && isFullscreen) {
        e.preventDefault();
        closeFullscreen();
        return;
    }
    if (isFullscreen) {
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            if (currentFiles.length && currentTrack < currentFiles.length - 1) {
                nextFile();
                openFullscreenForCurrentFile();
            } else {
                const days = daysWithFiles();
                const idx = days.indexOf(selectedDay);
                if (idx >= 0 && idx < days.length - 1) {
                    nextDay(true);
                    openFullscreenForCurrentFile();
                } else {
                    closeFullscreen();
                    setTimeout(nextDay, 400);
                }
            }
        }
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            if (currentFiles.length && currentTrack > 0) {
                prevFile();
                openFullscreenForCurrentFile();
            } else {
                const days = daysWithFiles();
                const idx = days.indexOf(selectedDay);
                if (idx > 0) {
                    prevDay(true);
                    openFullscreenForCurrentFile();
                } else {
                    closeFullscreen();
                    setTimeout(prevDay, 400);
                }
            }
        }
        return;
    }
    if (e.code === 'Space')      { e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowRight') { e.preventDefault(); smartNext(); }
    if (e.code === 'ArrowLeft')  { e.preventDefault(); smartPrev(); }
});

document.addEventListener('click', e => {
    if (!e.target.closest('#file-dropdown') && !e.target.closest('.file-more')) {
        closeDropdown();
    }
});

// nav dropdown
(function() {
    const toggle   = document.getElementById('navToggle');
    const dropdown = document.getElementById('navDropdown');
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const open = dropdown.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#siteNav')) {
            dropdown.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
})();

// ── Boot ───────────────────────────────────────────────────────────
loadCalendarData();
