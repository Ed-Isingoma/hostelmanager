export default function showToast(message) {
  const toastContainer = document.querySelector('body');
  const toast = document.createElement('div');
  
  toast.style.backgroundColor = '#374151';
  toast.style.color = '#ffffff';
  toast.style.padding = '12px 24px';
  toast.style.position = 'fixed';
  toast.style.top = '50%';
  toast.style.left = '50%';
  toast.style.transform = 'translate(-50%, -50%)';
  toast.style.borderRadius = '12px';
  toast.style.zIndex = '1000';
  toast.style.fontSize = '16px';
  toast.style.maxWidth = '80%';
  toast.style.textAlign = 'center';
  toast.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toastContainer.removeChild(toast);
  }, 2150);
}
