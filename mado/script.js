// day/night: white 6:00-18:00 JST, black 18:00-6:00 JST
function isNightNow() {
  const jstHour = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCHours();
  return jstHour < 6 || jstHour >= 18;
}

let currentlyNight = null;
let backgroundPool = [];

(function applyDayNight() {
  const night = isNightNow();
  document.body.classList.toggle('night', night);
  if (night !== currentlyNight) {
    currentlyNight = night;
    updateBackground();
  }
  setTimeout(applyDayNight, 60 * 1000);
})();

// classify a photo as day/night by its average brightness
function classifyImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 16;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      try {
        const data = ctx.getImageData(0, 0, size, size).data;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const brightness = total / (data.length / 4);
        resolve({ src, night: brightness < 95 });
      } catch (err) {
        resolve({ src, night: false });
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function updateBackground() {
  if (!backgroundPool.length) return;
  const night = isNightNow();
  let pool = backgroundPool.filter((p) => p.night === night);
  if (!pool.length) pool = backgroundPool;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const bg = document.getElementById('bg');
  if (!bg || !pick) return;
  bg.style.backgroundImage = `url(${pick.src})`;
  bg.classList.add('loaded');
}

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

  const imageSrcs = posts.filter((p) => p.image).map((p) => p.image);
  const classified = await Promise.all(imageSrcs.map(classifyImage));
  backgroundPool = classified.filter(Boolean);
  updateBackground();
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
