document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  link.addEventListener('click', () => {
    link.setAttribute('rel', 'noopener noreferrer');
  });
});
