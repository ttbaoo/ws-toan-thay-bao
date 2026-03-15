// ===========================
// TOAST NOTIFICATION SYSTEM
// ===========================
function showToast(message, type = 'info') {
  // Remove existing toast
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===========================
// AUTH STATE MANAGEMENT
// ===========================
async function checkAuth() {
  try {
    const res = await fetch('api/check-auth.php');
    const data = await res.json();

    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    if (data.loggedIn && data.user) {
      const roleLabels = { admin: 'Admin', teacher: 'Giáo viên', user: 'Học sinh' };
      const roleLabel = roleLabels[data.user.role] || 'Học sinh';
      const tierLabel = data.user.userTier === 'premium' ? 'Premium' : 'Thường';

      authButtons.innerHTML = `
        <span class="user-greeting">Xin chào, <strong>${data.user.fullname}</strong> (${roleLabel} - ${tierLabel})</span>
        <button class="btn-logout" id="btnLogout">Đăng Xuất</button>
      `;

      document.getElementById('btnLogout').addEventListener('click', handleLogout);

      // Add "Tạo Đề Thi" nav link for admin/teacher
      if (data.user.role === 'admin' || data.user.role === 'teacher') {
        const nav = document.getElementById('nav');
        if (nav && !nav.querySelector('a[href="tao-de-thi.html"]')) {
          const link = document.createElement('a');
          link.href = 'tao-de-thi.html';
          link.textContent = 'Tạo Đề Thi';
          if (window.location.pathname.includes('tao-de-thi')) {
            link.classList.add('active');
          }
          nav.appendChild(link);
        }
      }
    }
  } catch (e) {
    // Nếu không kết nối được API (chạy local không có PHP), giữ nguyên giao diện
  }
}

async function handleLogout() {
  try {
    const res = await fetch('api/logout.php');
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      setTimeout(() => window.location.href = 'index.html', 1000);
    }
  } catch (e) {
    showToast('Có lỗi xảy ra, vui lòng thử lại.', 'error');
  }
}

// ===========================
// HERO SLIDER
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  // Check auth state
  checkAuth();

  const sliderTrack = document.getElementById('sliderTrack');
  const sliderDots = document.getElementById('sliderDots');
  const sliderPrev = document.getElementById('sliderPrev');
  const sliderNext = document.getElementById('sliderNext');
  
  if (sliderTrack && sliderDots) {
    let currentSlide = 0;
    const totalSlides = 3;
    let autoPlayInterval;
    
    function goToSlide(index) {
      currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
      sliderTrack.style.transform = `translateX(-${currentSlide * (100 / totalSlides)}%)`;
      
      // Update dots
      const dots = sliderDots.querySelectorAll('.slider-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
      });
    }
    
    function nextSlide() {
      goToSlide(currentSlide + 1);
    }
    
    function prevSlide() {
      goToSlide(currentSlide - 1);
    }
    
    // Auto-play
    function startAutoPlay() {
      autoPlayInterval = setInterval(nextSlide, 4000);
    }
    
    function stopAutoPlay() {
      clearInterval(autoPlayInterval);
    }
    
    // Event listeners
    if (sliderNext) sliderNext.addEventListener('click', () => {
      stopAutoPlay();
      nextSlide();
      startAutoPlay();
    });
    
    if (sliderPrev) sliderPrev.addEventListener('click', () => {
      stopAutoPlay();
      prevSlide();
      startAutoPlay();
    });
    
    // Dot navigation
    sliderDots.querySelectorAll('.slider-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        stopAutoPlay();
        goToSlide(parseInt(dot.dataset.slide));
        startAutoPlay();
      });
    });
    
    startAutoPlay();
  }
  
  // ===========================
  // MOBILE MENU TOGGLE
  // ===========================
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      
      // Animate hamburger
      const spans = menuToggle.querySelectorAll('span');
      menuToggle.classList.toggle('active');
      
      if (nav.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
    
    // Close menu on link click
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      });
    });
  }
  
  // ===========================
  // TOGGLE PASSWORD VISIBILITY
  // ===========================
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
        } else {
          input.type = 'password';
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
      }
    });
  });
  
  // ===========================
  // FILTER TABS (Practice Page)
  // ===========================
  const filterTabs = document.querySelectorAll('.filter-tab');
  const examCards = document.querySelectorAll('.exam-card');
  
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const filter = tab.dataset.filter;
      
      examCards.forEach(card => {
        if (filter === 'all') {
          card.style.display = '';
        } else {
          card.style.display = card.dataset.type === filter ? '' : 'none';
        }
      });
    });
  });
  
  // ===========================
  // SEARCH FUNCTIONALITY
  // ===========================
  const searchInput = document.getElementById('searchExam');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      
      examCards.forEach(card => {
        const title = card.querySelector('.exam-card-title').textContent.toLowerCase();
        card.style.display = title.includes(query) ? '' : 'none';
      });
    });
  }
  
  // ===========================
  // FORM: ĐĂNG NHẬP
  // ===========================
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('.btn-submit');
      const originalText = submitBtn.textContent;

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xử lý...';
      
      try {
        const res = await fetch('api/login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
          showToast(data.message, 'success');
          setTimeout(() => window.location.href = 'luyen-de.html', 1200);
        } else {
          showToast(data.message, 'error');
        }
      } catch (err) {
        showToast('Không thể kết nối máy chủ. Vui lòng thử lại.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
  // ===========================
  // FORM: ĐĂNG KÝ
  // ===========================
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fullname = document.getElementById('fullname').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const dateOfBirth = document.getElementById('dateOfBirth').value;
      const className = document.getElementById('className').value;
      const avatarUrl = document.getElementById('avatarUrl').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const submitBtn = registerForm.querySelector('.btn-submit');
      const originalText = submitBtn.textContent;

      if (!/^0[0-9]{9}$/.test(phone)) {
        showToast('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0).', 'error');
        return;
      }

      if (!dateOfBirth) {
        showToast('Vui lòng nhập ngày sinh.', 'error');
        return;
      }

      if (!/^(10|11|12)A([1-9]|1[0-5])$/.test(className)) {
        showToast('Vui lòng chọn lớp hợp lệ.', 'error');
        return;
      }

      if (!avatarUrl) {
        showToast('Vui lòng nhập đường dẫn ảnh đại diện.', 'error');
        return;
      }

      // Client-side validation
      if (password !== confirmPassword) {
        showToast('Mật khẩu nhập lại không khớp.', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự.', 'error');
        return;
      }

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xử lý...';
      
      try {
        const res = await fetch('api/register.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullname,
            dateOfBirth,
            phone,
            avatarUrl,
            className,
            password,
            confirmPassword
          })
        });
        
        const data = await res.json();
        
        if (data.success) {
          showToast(data.message, 'success');
          setTimeout(() => window.location.href = 'luyen-de.html', 1200);
        } else {
          showToast(data.message, 'error');
        }
      } catch (err) {
        showToast('Không thể kết nối máy chủ. Vui lòng thử lại.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // ===========================
  // FORM: SUBSCRIBE EMAIL
  // ===========================
  const subscribeForm = document.getElementById('subscribeForm');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = subscribeForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      try {
        const res = await fetch('api/subscribe.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (data.success) {
          showToast(data.message, 'success');
          subscribeForm.reset();
        } else {
          showToast(data.message, 'error');
        }
      } catch (err) {
        showToast('Không thể kết nối máy chủ. Vui lòng thử lại.', 'error');
      }
    });
  }
  
  // ===========================
  // HEADER SCROLL EFFECT
  // ===========================
  const header = document.getElementById('header');
  
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // ===========================
  // ANIMATED STATS COUNTER
  // ===========================
  const statNumbers = document.querySelectorAll('.stat-number');

  if (statNumbers.length > 0) {
    const animateCounter = (el) => {
      const target = parseInt(el.dataset.target);
      const duration = 2000;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);

        el.textContent = current.toLocaleString() + (el.closest('.stat-card').querySelector('.stat-label').textContent.includes('%') ? '%' : '+');

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    };

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const numbers = entry.target.querySelectorAll('.stat-number');
          numbers.forEach((num, i) => {
            setTimeout(() => animateCounter(num), i * 150);
          });
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
      statsObserver.observe(statsSection);
    }
  }
  
  // ===========================
  // SCROLL REVEAL ANIMATIONS
  // ===========================
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal').forEach((el, index) => {
    el.style.transitionDelay = `${(index % 3) * 0.1}s`;
    revealObserver.observe(el);
  });
});
