// Minimal JS: mobile menu toggle, load students.json, student modal
document.addEventListener('DOMContentLoaded', function () {
  // Mobile menu toggles
  document.querySelectorAll('.menu-toggle').forEach(btn => {
    btn.addEventListener('click', function () {
      const navId = btn.getAttribute('aria-controls');
      const nav = document.getElementById(navId);
      if (!nav) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (nav.hasAttribute('hidden')) {
        nav.removeAttribute('hidden');
      } else {
        nav.setAttribute('hidden', '');
      }
    });
  });

  // Load students if #students-grid exists
  const grid = document.getElementById('students-grid');
  if (grid) {
    fetch('data/students.json').then(resp => resp.json()).then(data => {
      data.forEach((s, idx) => {
        const card = document.createElement('article');
        card.className = 'card';
        // thumbnail approach: try thumb file first
        const thumb = s.photo.replace('.jpg','_thumb.jpg').replace('.png','_thumb.png');
        const img = document.createElement('img');
        img.src = thumb;
        img.onerror = function(){ this.src = s.photo; };
        img.alt = s.alt || `Foto ${s.name} — profil`;
        img.loading = 'lazy';
        img.setAttribute('data-index', idx);
        img.style.cursor = 'pointer';

        const h3 = document.createElement('h3');
        h3.textContent = s.name;

        const p = document.createElement('p');
        p.textContent = s.note;

        card.appendChild(img);
        card.appendChild(h3);
        card.appendChild(p);
        grid.appendChild(card);

        img.addEventListener('click', function () {
          openModal(s);
        });
      });
    }).catch(err => {
      grid.innerHTML = '<p class="muted">Gagal memuat data siswa.</p>';
      console.error(err);
    });
  }

  // Modal handling
  const modal = document.getElementById('student-modal');
  const modalPhoto = document.getElementById('modal-photo');
  const modalName = document.getElementById('modal-name');
  const modalNickname = document.getElementById('modal-nickname');
  const modalNote = document.getElementById('modal-note');
  const modalQuote = document.getElementById('modal-quote');
  const modalDownload = document.getElementById('modal-download');
  const modalCloseButtons = document.querySelectorAll('#modal-close,#modal-close-2');

  function openModal(student) {
    if (!modal) return;
    modalPhoto.src = student.photo;
    modalPhoto.alt = student.alt || `Foto ${student.name} — profil kelas`;
    modalName.textContent = student.name;
    modalNickname.textContent = student.nickname ? `Julukan: ${student.nickname}` : '';
    modalNote.textContent = student.note || '';
    modalQuote.textContent = student.quote || '';
    modalDownload.href = student.photo;
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    // clear to avoid stale images
    modalPhoto.src = '';
  }

  modalCloseButtons.forEach(b => b.addEventListener('click', closeModal));
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });
});
