// minimal loader: posts.json -> windows
(async function () {
  const container = document.getElementById('windows');
  let posts;
  try {
    const res = await fetch('posts.json', { cache: 'no-store' });
    posts = await res.json();
  } catch (err) {
    console.error('posts.json could not be loaded:', err);
    return;
  }

  // newest first
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  for (const post of posts) {
    container.appendChild(buildWindow(post));
  }
})();

function buildWindow(post) {
  const el = document.createElement('article');
  el.className = 'window';

  if (post.image) {
    const img = document.createElement('img');
    img.className = 'window-image';
    img.src = post.image;
    img.alt = '';
    img.loading = 'lazy';
    el.appendChild(img);
  }

  if (post.text) {
    const p = document.createElement('p');
    p.className = 'window-text';
    p.textContent = post.text;
    el.appendChild(p);
  }

  if (post.audio) {
    el.appendChild(buildPlayer(post.audio));
  }

  if (post.author || post.date) {
    const meta = document.createElement('div');
    meta.className = 'window-meta';
    const parts = [];
    if (post.author) parts.push(post.author);
    if (post.date) parts.push(post.date);
    meta.textContent = parts.join(' · ');
    el.appendChild(meta);
  }

  return el;
}

function buildPlayer(src) {
  const wrap = document.createElement('div');
  wrap.className = 'player';

  const audio = document.createElement('audio');
  audio.src = src;
  audio.preload = 'metadata';

  const btn = document.createElement('button');
  btn.className = 'play-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', '再生');

  const progress = document.createElement('div');
  progress.className = 'progress';
  const fill = document.createElement('div');
  fill.className = 'progress-fill';
  progress.appendChild(fill);

  const time = document.createElement('div');
  time.className = 'time';
  time.textContent = '–:––';

  btn.addEventListener('click', () => {
    if (audio.paused) {
      // pause everything else first
      document.querySelectorAll('audio').forEach(a => {
        if (a !== audio) a.pause();
      });
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => {
    btn.classList.add('playing');
    btn.setAttribute('aria-label', '停止');
  });
  audio.addEventListener('pause', () => {
    btn.classList.remove('playing');
    btn.setAttribute('aria-label', '再生');
  });
  audio.addEventListener('ended', () => {
    fill.style.width = '0%';
    btn.classList.remove('playing');
  });

  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) {
      time.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    fill.style.width = pct + '%';
    const remaining = Math.max(0, audio.duration - audio.currentTime);
    time.textContent = formatTime(remaining);
  });

  progress.addEventListener('click', (e) => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = progress.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
  });

  wrap.appendChild(btn);
  wrap.appendChild(progress);
  wrap.appendChild(time);
  wrap.appendChild(audio);
  return wrap;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
