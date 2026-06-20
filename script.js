// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const mobilePanel = document.getElementById('mobilePanel');

if (menuBtn && mobilePanel) {
  menuBtn.addEventListener('click', () => mobilePanel.classList.toggle('open'));
  mobilePanel.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobilePanel.classList.remove('open'));
  });
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });

revealEls.forEach(el => io.observe(el));

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Music player
const music = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const musicBtnText = document.getElementById('musicBtnText');
const musicStatus = document.getElementById('musicStatus');
const musicStatusText = document.getElementById('musicStatusText');
const volumeRange = document.getElementById('volumeRange');
const volumeValue = document.getElementById('volumeValue');

let isPlaying = false;
const defaultVolume = 0.15;

function setMusicUI(playing) {
  isPlaying = playing;
  if (playing) {
    musicBtnText.textContent = 'Stop Musik';
    musicStatus.classList.remove('off');
    musicStatusText.textContent = 'Aktif';
  } else {
    musicBtnText.textContent = 'Play Musik';
    musicStatus.classList.add('off');
    musicStatusText.textContent = 'Nonaktif';
  }
}

function tryAutoplay() {
  if (!music) return;

  music.volume = defaultVolume;
  volumeRange.value = Math.round(defaultVolume * 100);
  volumeValue.textContent = `${volumeRange.value}%`;

  // Coba autoplay. Browser modern bisa memblokir jika dianggap tidak memenuhi kebijakan.
  const playPromise = music.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise
      .then(() => setMusicUI(true))
      .catch(() => {
        // Kalau diblokir, tetap siapkan UI dan tunggu klik user.
        setMusicUI(false);
      });
  } else {
    setMusicUI(true);
  }
}

if (music && musicToggle) {
  tryAutoplay();

  musicToggle.addEventListener('click', async () => {
    try {
      if (music.paused) {
        await music.play();
        setMusicUI(true);
      } else {
        music.pause();
        setMusicUI(false);
      }
    } catch (e) {
      setMusicUI(false);
      alert('Musik belum bisa diputar. Pastikan file audio sudah diisi di: assets/wardatul-jannah.mp3');
    }
  });

  volumeRange.addEventListener('input', () => {
    const v = Number(volumeRange.value) / 100;
    music.volume = v;
    volumeValue.textContent = `${volumeRange.value}%`;
  });

  music.addEventListener('ended', () => setMusicUI(false));
  music.addEventListener('pause', () => {
    if (!music.ended) setMusicUI(false);
  });

  // Tambahan: ketika user pertama kali berinteraksi, coba hidupkan musik lagi
  const resumeAudio = () => {
    if (music.paused) {
      music.play().then(() => setMusicUI(true)).catch(() => {});
    }
    window.removeEventListener('pointerdown', resumeAudio);
    window.removeEventListener('touchstart', resumeAudio);
  };
  window.addEventListener('pointerdown', resumeAudio, { once: true });
  window.addEventListener('touchstart', resumeAudio, { once: true });
}
