(function(){
 const loading=document.getElementById('loading'),message=loading.querySelector('p');
 let done=false,timer;
 function fail(reason){if(done)return;done=true;clearTimeout(timer);loading.hidden=true;document.getElementById('error').hidden=false;document.querySelector('#error h2').textContent='Не удалось открыть игру';document.getElementById('error-text').textContent=reason+' '+(location.protocol==='file:'?'Распакуйте весь ZIP в одну папку и откройте index.html.':'Обновите страницу. Если ошибка повторится, проверьте, что опубликованы все файлы архива.');}
 window.kuchaBoot={progress(n,total){message.textContent=n?'Персонажи: '+n+' из '+total:'Готовим бумажный мир…'},stop(){done=true;clearTimeout(timer)}};
 window.addEventListener('error',e=>fail(e.message||'Не удалось прочитать файл игры.'));
 window.addEventListener('unhandledrejection',e=>fail(e.reason?.message||String(e.reason)));
 timer=setTimeout(()=>fail('Загрузка не завершилась за 25 секунд.'),25000);
 message.textContent='Загружаем игру…';
 // Give the loading screen a paint before evaluating the self-contained bundle.
 requestAnimationFrame(()=>setTimeout(()=>{const script=document.createElement('script');script.src='game.bundle.js';script.onerror=()=>fail('Не найден game.bundle.js.');document.body.appendChild(script)},0));
})();
