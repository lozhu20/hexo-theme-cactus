const themes = [
  { name: 'dark', className: 'theme--dark' },
  // { name: 'light', className: 'theme--light' },
  // { name: 'classic', className: 'theme--classic' },
  { name: 'white', className: 'theme--white' }
];

document.addEventListener('DOMContentLoaded', () => {

  // 初始化检查主题模式设置是否过期，过期则清除
  initColorThemeStorage();


  const toggleButton = document.getElementById('btn-theme-switch');
  if (!toggleButton) return;

  // 检查 localStorage 中的用户偏好
  const userPref = localStorage.getItem('color-scheme');
  const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches;

  let isDark = false;

  if (userPref === 'dark') {
    isDark = true;
  } else if (userPref === 'white') {
    isDark = false;
  } else {
    // 未设置时，跟随系统
    isDark = systemPref;
  }

  const nextColorScheme = isDark ? 'dark' : 'white'; // 修复单引号错误
  const nextTheme = themes.find(t => t.name === nextColorScheme);

  setTheme(null, nextTheme);
  syncGiscusTheme(nextTheme); // 初始应该同步当前主题

  // 切换按钮图标和行为
  toggleButton.textContent = isDark ? '☀️' : '🌙';

  toggleButton.addEventListener('click', () => {
    // 点击时应该基于当前isDark状态获取主题，而不是直接读localStorage
    const currentColorScheme = isDark ? 'dark' : 'white'; // 切换前的主题
    const currentTheme = themes.find(t => t.name === currentColorScheme);
    const nextColorScheme = isDark ? 'white' : 'dark'; // 切换后的主题
    const nextTheme = themes.find(t => t.name === nextColorScheme);

    isDark = !isDark;
    toggleButton.textContent = isDark ? '☀️' : '🌙';

    setTheme(currentTheme, nextTheme);
    syncGiscusTheme(nextTheme);
  });


  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://giscus.app') return;
    const colorScheme = localStorage.getItem('color-scheme');
    const theme = themes.find(t => t.name === colorScheme);
    syncGiscusTheme(theme);
  });

  const html = document.documentElement;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isDark = html.classList.contains('theme--dark'); // 用主题类名判断更准确
        syncGiscusTheme(isDark ? themes[0] : themes[1]);
      }
    });
  });
  observer.observe(html, { attributes: true });


  // 设置主题色
  function setTheme(currentTheme, newTheme) {
    if (!newTheme) return; // 增加当前主题的校验
    
    if (currentTheme) {
      document.documentElement.classList.remove(currentTheme.className);
    }
    document.documentElement.classList.add(newTheme.className);
    saveColorTheme(newTheme.name);
  }

  
  // 设置评论区主题色
  function syncGiscusTheme(theme) {
    if (!theme) return;
    const giscusFrame = document.querySelector('iframe.giscus-frame');
    if (!giscusFrame) {
      if (window.giscusRetryCount === undefined) window.giscusRetryCount = 0;
      if (window.giscusRetryCount < 10) {
        window.giscusRetryCount++;
        setTimeout(() => syncGiscusTheme(theme), 100); // 这里传theme对象
      }
      return;
    }

    if (giscusFrame.contentWindow) {
      // 从 iframe 的 src 中提取正确的 origin（避免跨域错误）
      const frameOrigin = new URL(giscusFrame.src).origin;

      giscusFrame.contentWindow.postMessage({
        giscus: {
          setConfig: {
            defaultCommentOrder: "newest",
            theme: theme.name === 'white' ? 'light' : 'dark' // 使用主题对象的name属性
          }
        }
      }, frameOrigin);
    } else {
      // 延迟重试
      setTimeout(() => syncGiscusTheme(themeName), 100);
    }
  }


  // 初始化处理：检查是否有过期的color-theme并清除
  function initColorThemeStorage() {
    const storedTheme = localStorage.getItem('color-scheme');
    const expiryTime = localStorage.getItem('color-scheme-expiry');

    // 如果存在存储且已过期，清除它
    if (storedTheme && expiryTime && Date.now() > Number(expiryTime)) {
      localStorage.removeItem('color-scheme');
      localStorage.removeItem('color-scheme-expiry');
    }
  }

  // 保存color-theme时同时设置30分钟过期时间
  function saveColorTheme(theme) {
    const expiry = Date.now() + 30 * 60 * 1000; // 30分钟后过期
    localStorage.setItem('color-scheme', theme);
    localStorage.setItem('color-scheme-expiry', expiry.toString());
  }

  // 避免页面加载时的白屏问题
  document.body.style.visibility = 'visible';
});
