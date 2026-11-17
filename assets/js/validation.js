/* validation.js — ЛР №9: клієнтська валідація форми зворотного зв'язку */

// ===== RegEx =====
const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const REGEX_PHONE = /^\+380\d{9}$/;

// ===== Правила: повертають текст помилки або '' =====
const RULES = {
  username: (v) => (v.trim().length >= 2 ? '' : "Ім'я має містити щонайменше 2 символи."),
  email: (v) => (REGEX_EMAIL.test(v.trim()) ? '' : 'Введіть коректну електронну адресу, наприклад user@gmail.com.'),
  phone: (v) => (REGEX_PHONE.test(v) ? '' : 'Формат номера: +380XXXXXXXXX (9 цифр після +380).'),
  message: (v) => (v.trim().length >= 10 ? '' : 'Повідомлення має містити щонайменше 10 символів.'),
};
const AGREEMENT_ERROR = 'Потрібна згода з обробкою персональних даних.';

// ===== Нормалізація телефону: 0501234567 -> +380501234567 =====
function normalizePhone(raw) {
  if (raw.trim() === '+') return '+';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '38' + digits;
  return digits ? '+' + digits.slice(0, 12) : '';
}

// ===== UI-стани поля =====
const STATE_CLASSES = ['border-surface-2', 'border-red-500', 'border-green-500'];

function setBorder(input, cls) {
  input.classList.remove(...STATE_CLASSES);
  input.classList.add(cls);
}
function showError(input, errorEl, message) {
  if (input.type !== 'checkbox') setBorder(input, 'border-red-500');
  input.setAttribute('aria-invalid', 'true');
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}
function showSuccess(input, errorEl) {
  if (input.type !== 'checkbox') setBorder(input, 'border-green-500');
  input.setAttribute('aria-invalid', 'false');
  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}
function clearState(input, errorEl) {
  if (input.type !== 'checkbox') setBorder(input, 'border-surface-2');
  input.setAttribute('aria-invalid', 'false');
  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}

// ===== Валідація одного поля =====
function validateField(input) {
  const errorEl = document.getElementById(input.id + 'Error');
  const message = input.type === 'checkbox'
    ? (input.checked ? '' : AGREEMENT_ERROR)
    : RULES[input.id](input.value);
  if (message) showError(input, errorEl, message);
  else showSuccess(input, errorEl);
  return !message;
}

// ===== Ініціалізація =====
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const modal = document.getElementById('successModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const submitBtn = document.getElementById('submitBtn');
  if (!form || !modal) return;

  const fields = Array.from(form.querySelectorAll('input, textarea'));
  const touched = new Set();

  fields.forEach((field) => {
    const eventName = field.type === 'checkbox' ? 'change' : 'input';
    field.addEventListener(eventName, () => {
      if (field.id === 'phone') field.value = normalizePhone(field.value);
      touched.add(field.id);
      validateField(field);
    });
    field.addEventListener('blur', () => {
      if (field.type === 'checkbox' && !touched.has(field.id)) return;
      if (field.value === '' && !touched.has(field.id)) return;
      touched.add(field.id);
      validateField(field);
    });
  });

  function openModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    closeBtn.focus();
  }
  function closeModal() {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    submitBtn.focus();
  }
  const isOpen = () => !modal.classList.contains('hidden');

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isOpen()) return;
    fields.forEach((f) => touched.add(f.id));
    const results = fields.map(validateField);
    if (results.includes(false)) {
      fields[results.indexOf(false)].focus();
      return;
    }
    form.reset();
    touched.clear();
    fields.forEach((f) => clearState(f, document.getElementById(f.id + 'Error')));
    openModal();
  });
});