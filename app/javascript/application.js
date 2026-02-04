import "@hotwired/turbo-rails"
import "controllers"
import jquery from "jquery"
import toastr from "toastr"

// Make jQuery and toastr available globally
window.jQuery = jquery
window.$ = jquery
window.toastr = toastr

// Toastr options
toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": false,
  "progressBar": true,
  "positionClass": "toast-top-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}

document.addEventListener('turbo:load', () => {
  const hamburgerButton = document.getElementById('hamburgerMenuButton');
  const sidebar = document.getElementById('sidebar');

  if (hamburgerButton && sidebar) {
    hamburgerButton.addEventListener('click', () => {
      const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true' || false;
      hamburgerButton.setAttribute('aria-expanded', !isExpanded);
      sidebar.classList.toggle('is-open');
      sidebar.setAttribute('aria-hidden', isExpanded);
      if (sidebar.classList.contains('is-open')) {
        document.body.classList.add('sidebar-active');
      } else {
        document.body.classList.remove('sidebar-active');
      }
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('is-open')) {
        if (!sidebar.contains(e.target) && !hamburgerButton.contains(e.target)) {
          sidebar.classList.remove('is-open');
          hamburgerButton.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('sidebar-active');
        }
      }
    });
  }

  // Handle flash messages with toastr
  const flashContainer = document.getElementById('flash-container');
  if (flashContainer) {
    const flashes = JSON.parse(flashContainer.getAttribute('data-flash'));
    if (flashes) {
      Object.entries(flashes).forEach(([type, message]) => {
        let toastrType = type;
        if (type === 'danger') toastrType = 'error';
        if (type === 'notice') toastrType = 'info';
        if (type === 'alert') toastrType = 'warning';

        if (toastr[toastrType]) {
          toastr[toastrType](message);
        } else {
          toastr.info(message);
        }

        // For success messages, force the background color to green using jQuery
        if (toastrType === 'success') {
          $('#toast-container .toast-success').last().css('background-color', '#28a745');
        }
      });
      // Clear the flash data after displaying to avoid re-showing on back navigation
      flashContainer.removeAttribute('data-flash');
    }
  }
});
