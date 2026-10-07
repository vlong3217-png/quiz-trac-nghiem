/**
 * auth.js - Helpers quan ly token dang nhap va thong tin nguoi dung
 */

const API_BASE = '/api';

const Auth = {
  getToken() {
    return localStorage.getItem('quiz_token');
  },

  getUser() {
    try {
      const user = localStorage.getItem('quiz_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  setAuth(token, user) {
    localStorage.setItem('quiz_token', token);
    localStorage.setItem('quiz_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    window.location.href = 'login.html';
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'ADMIN';
  },

  // Cap nhat thanh dieu huong tren giao dien
  renderNavbar() {
    const navMenu = document.getElementById('navbar-menu');
    if (!navMenu) return;

    const user = this.getUser();
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    if (user) {
      let adminHtml = '';
      if (user.role === 'ADMIN') {
        adminHtml = `
          <li><a href="admin.html" class="nav-link ${currentPath === 'admin.html' ? 'active' : ''}">Tổng quan</a></li>
          <li><a href="admin-users.html" class="nav-link ${currentPath === 'admin-users.html' ? 'active' : ''}">Sinh viên</a></li>
          <li><a href="admin-exams.html" class="nav-link ${currentPath === 'admin-exams.html' ? 'active' : ''}">Đề thi</a></li>
          <li><a href="admin-results.html" class="nav-link ${currentPath === 'admin-results.html' ? 'active' : ''}">Kết quả thi</a></li>
        `;
      } else {
        adminHtml = `
          <li><a href="exams.html" class="nav-link ${currentPath === 'exams.html' ? 'active' : ''}">Đề thi</a></li>
          <li><a href="history.html" class="nav-link ${currentPath === 'history.html' ? 'active' : ''}">Lịch sử</a></li>
        `;
      }

      navMenu.innerHTML = `
        ${adminHtml}
        <li class="user-profile-menu">
          <span class="user-badge">
            ${escapeHtml(user.username)}
            <span class="role-tag ${user.role === 'ADMIN' ? 'admin' : ''}">${user.role}</span>
          </span>
          <button id="btn-logout" class="btn btn-secondary btn-sm" onclick="Auth.logout()">Đăng xuất</button>
        </li>
      `;
    } else {
      navMenu.innerHTML = `
        <li><a href="login.html" class="btn btn-secondary btn-sm">Đăng nhập</a></li>
        <li><a href="register.html" class="btn btn-primary btn-sm">Đăng ký</a></li>
      `;
    }

    // Cap nhat duong dan logo thuong hieu
    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo) {
      if (user) {
        brandLogo.href = user.role === 'ADMIN' ? 'admin.html' : 'exams.html';
      } else {
        brandLogo.href = 'login.html';
      }
    }
  },

  // Bat buoc dang nhap neu vao trang can quyen
  requireAuth() {
    if (!this.isLoggedIn()) {
      showToast('Vui lòng đăng nhập để tiếp tục!', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 600);
      return false;
    }
    return true;
  },

  // Bat buoc la ADMIN
  requireAdminRole() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    if (!this.isAdmin()) {
      showToast('Bạn không có quyền truy cập trang quản trị!', 'error');
      setTimeout(() => {
        window.location.href = 'exams.html';
      }, 800);
      return false;
    }
    return true;
  }
};

// Ham hien thi thong bao Toast gon gang
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Ham goi API tong quat
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = Auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, status: 500, data: { success: false, message: 'Lỗi kết nối máy chủ backend!' } };
  }
}

// Chuyen doi ky tu dac biet de phong XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.renderNavbar();
});
