function refreshPage() {
    location.reload();
}

window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'UA-137340638-1');

// document.addEventListener('contextmenu', function(e) {
//     alert('禁止查看源代码，您的行为已记录。');
//     e.preventDefault();
// });