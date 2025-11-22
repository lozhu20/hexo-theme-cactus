document.addEventListener('DOMContentLoaded', () => {
  const sentences = document.getElementsByName('sentence-container');
  if (!sentences || sentences.length === 0) return;

  sentences.forEach(s => s.style.display = 'none');

  const randomVal = Math.floor(Math.random() * (sentences.length));
  sentences[randomVal].style.display= 'block';
});
