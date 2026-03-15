// ===========================
// EXAM CREATOR MODULE
// ===========================
(function () {
  'use strict';

  // State
  let parsedQuestions = [];
  let selectedFile = null;

  // DOM refs
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const btnBrowse = document.getElementById('btnBrowse');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const btnRemoveFile = document.getElementById('btnRemoveFile');
  const metadataCard = document.getElementById('metadataCard');
  const summaryCard = document.getElementById('summaryCard');
  const summaryStats = document.getElementById('summaryStats');
  const previewEmpty = document.getElementById('previewEmpty');
  const previewList = document.getElementById('previewList');
  const examMetaForm = document.getElementById('examMetaForm');
  const btnSaveExam = document.getElementById('btnSaveExam');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingMessage = document.getElementById('loadingMessage');
  const examListWrapper = document.getElementById('examListWrapper');

  if (!uploadZone) return; // Not on this page

  // ===========================
  // AUTH CHECK
  // ===========================
  async function verifyAccess() {
    try {
      const res = await fetch('api/check-auth.php');
      const data = await res.json();
      const role = data.user?.role;
      if (!data.loggedIn || (role !== 'admin' && role !== 'teacher')) {
        showToast('Bạn cần đăng nhập với tài khoản Giáo viên để truy cập trang này.', 'error');
        setTimeout(() => window.location.href = 'dang-nhap.html', 1500);
        return false;
      }
      return true;
    } catch {
      return true; // Allow access if API unavailable (local dev)
    }
  }

  // ===========================
  // DRAG & DROP
  // ===========================
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  btnBrowse.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
  });

  btnRemoveFile.addEventListener('click', () => {
    resetUpload();
  });

  // ===========================
  // FILE HANDLING
  // ===========================
  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'tex') {
      showToast('Chỉ chấp nhận file .tex', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File quá lớn. Tối đa 5MB.', 'error');
      return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'flex';
    uploadZone.style.display = 'none';

    parseFile(file);
  }

  function resetUpload() {
    selectedFile = null;
    parsedQuestions = [];
    fileInput.value = '';
    fileInfo.style.display = 'none';
    uploadZone.style.display = '';
    metadataCard.style.display = 'none';
    summaryCard.style.display = 'none';
    previewEmpty.style.display = '';
    previewList.style.display = 'none';
    previewList.innerHTML = '';
    btnSaveExam.disabled = true;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ===========================
  // PARSE FILE
  // ===========================
  async function parseFile(file) {
    showLoading('Đang phân tích file .tex...');

    const formData = new FormData();
    formData.append('action', 'parse');
    formData.append('file', file);

    try {
      const res = await fetch('api/upload-exam.php', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      hideLoading();

      if (data.success) {
        parsedQuestions = data.data.questions;
        showToast(data.message, 'success');
        renderSummary(data.data);
        renderPreview(data.data.questions);
        metadataCard.style.display = '';
        btnSaveExam.disabled = false;
      } else {
        showToast(data.message, 'error');
        resetUpload();
      }
    } catch (err) {
      hideLoading();
      showToast('Lỗi kết nối máy chủ. Vui lòng thử lại.', 'error');
      resetUpload();
    }
  }

  // ===========================
  // RENDER SUMMARY
  // ===========================
  function renderSummary(data) {
    const typeLabels = {
      multiple_choice: { label: 'Trắc nghiệm', icon: '🔘', color: '#4F46E5' },
      true_false: { label: 'Đúng/Sai', icon: '✅', color: '#059669' },
      short_answer: { label: 'Trả lời ngắn', icon: '✏️', color: '#D97706' },
      essay: { label: 'Tự luận', icon: '📝', color: '#DC2626' },
    };

    let html = `<div class="summary-total">
      <span class="summary-total-number">${data.total}</span>
      <span class="summary-total-label">câu hỏi</span>
    </div><div class="summary-types">`;

    for (const [type, count] of Object.entries(data.type_counts)) {
      if (count > 0) {
        const info = typeLabels[type];
        html += `<div class="summary-type-item">
          <span class="summary-type-icon">${info.icon}</span>
          <span class="summary-type-count" style="color: ${info.color}">${count}</span>
          <span class="summary-type-label">${info.label}</span>
        </div>`;
      }
    }

    html += '</div>';
    summaryStats.innerHTML = html;
    summaryCard.style.display = '';
  }

  // ===========================
  // RENDER PREVIEW
  // ===========================
  function renderPreview(questions) {
    previewEmpty.style.display = 'none';
    previewList.style.display = '';
    previewList.innerHTML = '';

    const typeConfig = {
      multiple_choice: { badge: 'Trắc nghiệm', badgeClass: 'badge-mc', letter: ['A', 'B', 'C', 'D'] },
      true_false: { badge: 'Đúng/Sai', badgeClass: 'badge-tf', letter: ['a', 'b', 'c', 'd'] },
      short_answer: { badge: 'Trả lời ngắn', badgeClass: 'badge-sa' },
      essay: { badge: 'Tự luận', badgeClass: 'badge-es' },
    };

    questions.forEach((q, idx) => {
      const config = typeConfig[q.question_type];
      const card = document.createElement('div');
      card.className = 'q-preview-card';

      let optionsHtml = '';
      if (q.options && q.options.length > 0) {
        const letters = config.letter || ['1', '2', '3', '4'];
        optionsHtml = '<div class="q-options">';
        q.options.forEach((opt, oi) => {
          const correctClass = opt.is_correct ? 'q-option-correct' : '';
          optionsHtml += `<div class="q-option ${correctClass}">
            <span class="q-option-letter">${letters[oi] || oi + 1}</span>
            <span class="q-option-content">${escapeHtml(opt.content)}</span>
            ${opt.is_correct ? '<span class="q-correct-badge">✓ Đúng</span>' : ''}
          </div>`;
        });
        optionsHtml += '</div>';
      }

      if (q.question_type === 'short_answer' && q.short_answer) {
        optionsHtml = `<div class="q-short-answer">
          <span class="q-short-answer-label">Đáp án:</span>
          <span class="q-short-answer-value">${escapeHtml(q.short_answer)}</span>
        </div>`;
      }

      let solutionHtml = '';
      if (q.solution) {
        solutionHtml = `<div class="q-solution">
          <button class="q-solution-toggle" onclick="this.parentElement.classList.toggle('open')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Lời giải
            <svg class="q-solution-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="q-solution-content">${escapeHtml(q.solution)}</div>
        </div>`;
      }

      card.innerHTML = `
        <div class="q-header">
          <span class="q-number">Câu ${q.order_index}</span>
          <span class="q-type-badge ${config.badgeClass}">${config.badge}</span>
        </div>
        <div class="q-content">${escapeHtml(q.content)}</div>
        ${optionsHtml}
        ${solutionHtml}
      `;

      previewList.appendChild(card);
    });

    // Render math with KaTeX
    renderMath();
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderMath() {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(previewList, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
      });
    } else {
      // KaTeX not loaded yet, retry
      setTimeout(renderMath, 500);
    }
  }

  // ===========================
  // SAVE EXAM
  // ===========================
  examMetaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (parsedQuestions.length === 0) {
      showToast('Không có câu hỏi để lưu.', 'error');
      return;
    }

    const title = document.getElementById('examTitle').value.trim();
    if (!title) {
      showToast('Vui lòng nhập tên đề thi.', 'error');
      return;
    }

    showLoading('Đang lưu đề thi...');

    const payload = {
      title,
      subject: document.getElementById('examSubject').value,
      grade: document.getElementById('examGrade').value,
      exam_type: document.getElementById('examType').value,
      duration: parseInt(document.getElementById('examDuration').value) || 90,
      questions: parsedQuestions,
    };

    try {
      const res = await fetch('api/upload-exam.php?action=save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      hideLoading();

      if (data.success) {
        showToast(data.message, 'success');
        resetUpload();
        document.getElementById('examTitle').value = '';
        loadExamsList();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      hideLoading();
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  });

  // ===========================
  // EXAMS LIST
  // ===========================
  async function loadExamsList() {
    try {
      const res = await fetch('api/get-exams.php');
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        renderExamsList(data.data);
      } else {
        examListWrapper.innerHTML = `
          <div class="exam-list-empty">
            <p>Chưa có đề thi nào. Hãy upload file .tex để tạo đề thi đầu tiên!</p>
          </div>`;
      }
    } catch {
      examListWrapper.innerHTML = `
        <div class="exam-list-empty">
          <p>Không thể tải danh sách đề thi.</p>
        </div>`;
    }
  }

  function renderExamsList(exams) {
    const statusLabels = {
      draft: { label: 'Nháp', class: 'status-draft' },
      published: { label: 'Đã xuất bản', class: 'status-published' },
      archived: { label: 'Lưu trữ', class: 'status-archived' },
    };

    let html = `<table class="exam-list-table">
      <thead>
        <tr>
          <th>Tên đề thi</th>
          <th>Môn</th>
          <th>Lớp</th>
          <th>Kỳ thi</th>
          <th>Số câu</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
          <th></th>
        </tr>
      </thead>
      <tbody>`;

    exams.forEach(exam => {
      const statusInfo = statusLabels[exam.status] || statusLabels.draft;
      const createdDate = new Date(exam.created_at).toLocaleDateString('vi-VN');

      html += `<tr>
        <td class="exam-title-cell">${escapeHtml(exam.title)}</td>
        <td>${escapeHtml(exam.subject_label)}</td>
        <td>${exam.grade}</td>
        <td>${escapeHtml(exam.exam_type_label)}</td>
        <td>${exam.total_questions}</td>
        <td><span class="exam-status-badge ${statusInfo.class}">${statusInfo.label}</span></td>
        <td>${createdDate}</td>
        <td>
          <button class="btn-delete-exam" data-id="${exam.id}" data-title="${escapeHtml(exam.title)}" title="Xoá đề thi">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </td>
      </tr>`;
    });

    html += '</tbody></table>';
    examListWrapper.innerHTML = html;

    // Attach delete handlers
    document.querySelectorAll('.btn-delete-exam').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const title = btn.dataset.title;
        if (confirm(`Bạn có chắc muốn xoá đề thi "${title}"?`)) {
          deleteExam(id);
        }
      });
    });
  }

  async function deleteExam(examId) {
    showLoading('Đang xoá đề thi...');

    try {
      const res = await fetch('api/delete-exam.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: parseInt(examId) }),
      });
      const data = await res.json();
      hideLoading();

      if (data.success) {
        showToast(data.message, 'success');
        loadExamsList();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      hideLoading();
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  }

  // ===========================
  // LOADING OVERLAY
  // ===========================
  function showLoading(msg) {
    loadingMessage.textContent = msg || 'Đang xử lý...';
    loadingOverlay.style.display = 'flex';
  }

  function hideLoading() {
    loadingOverlay.style.display = 'none';
  }

  // ===========================
  // INIT
  // ===========================
  async function init() {
    const hasAccess = await verifyAccess();
    if (hasAccess) {
      loadExamsList();
    }
  }

  init();
})();
