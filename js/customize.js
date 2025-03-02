// 覆盖原生 title 属性行为
Object.defineProperty(HTMLAnchorElement.prototype, 'title', {
    set: function() {}, // 阻止设置 title
    get: function() {
        return '';
    } // 始终返回空值
});

// 在 DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 批量移除现有元素的 title 属性并备份原始值
    const removeTitleFromLinks = () => {
        const allLinks = document.querySelectorAll('a[title]');
        allLinks.forEach(link => {
            link.setAttribute('data-original-title', link.title); // 备份原始值（可选）
            link.removeAttribute('title');
        });
    };

    // 动态监控防止新增元素（可选）
    const observeNewLinks = () => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.tagName === 'A') {
                        node.setAttribute('data-original-title', node.title);
                        node.removeAttribute('title');
                    }
                });
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    removeTitleFromLinks();
    observeNewLinks();
});

// 刷新当前页面
function refreshPage() {
    location.reload();
}

// 初始化 dataLayer 数组
window.dataLayer = window.dataLayer || [];

// 定义通用的跟踪函数
function trackEvent(...args) {
    dataLayer.push(args);
}

// 记录 JavaScript 加载时间
trackEvent('js', new Date());
// 配置 Google Analytics 的跟踪 ID
trackEvent('config', 'UA-137340638-1');

// 处理上下文菜单事件
document.addEventListener('contextmenu', function(e) {
    alert('禁止查看源代码，您的行为已记录。');
    e.preventDefault();
});