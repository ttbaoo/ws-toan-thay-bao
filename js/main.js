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
      authButtons.innerHTML = `
        <span class="user-greeting">Xin chào, <strong>${data.user.fullname}</strong></span>
        <button class="btn-logout" id="btnLogout">Đăng Xuất</button>
      `;

      document.getElementById('btnLogout').addEventListener('click', handleLogout);
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
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁';
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
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const submitBtn = registerForm.querySelector('.btn-submit');
      const originalText = submitBtn.textContent;

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
          body: JSON.stringify({ fullname, phone, password, confirmPassword })
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
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      } else {
        header.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)';
      }
    });
  }
  
  // ===========================
  // ENTRANCE ANIMATIONS
  // ===========================
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Animate feature cards
  document.querySelectorAll('.feature-card, .exam-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `all 0.5s ease ${index * 0.1}s`;
    observer.observe(card);
  });
});
