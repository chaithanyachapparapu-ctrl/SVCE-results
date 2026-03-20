// Fullscreen GIF overlay for wrong hall ticket
(function() {
    const resultContainer = document.getElementById('resultContainer');
    if (!resultContainer) return;

    const observer = new MutationObserver(function() {

        const errorImg = resultContainer.querySelector('img[src="assets/error.gif"]');
        if (!errorImg) return;
        resultContainer.innerHTML = '';

        // Create the fullscreen overlay
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-gif-overlay';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'overlay-close-btn';
        closeBtn.id = 'closeOverlayBtn';
        closeBtn.textContent = '✕ Close';

        const img = document.createElement('img');
        img.src = 'assets/error.gif';
        img.alt = 'Invalid Hall Ticket';

        overlay.appendChild(closeBtn);
        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // Close button handler
        closeBtn.addEventListener('click', function() {
            overlay.style.animation = 'none';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(function() {
                overlay.remove();
            }, 300);
        });

        // Also close on Escape key
        function handleEscape(e) {
            if (e.key === 'Escape') {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s ease';
                setTimeout(function() {
                    overlay.remove();
                }, 300);
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);
    });

    observer.observe(resultContainer, { childList: true, subtree: true });
})();
