/* Arranque de la página. Con Firebase configurado trae los datos de la nube; si no, usa data/torneo.js.
   Después carga js/app.js. Si la nube no responde, la página arranca igual con la copia local. */
(function(){
"use strict";
var cfg=window.FIREBASE_CONFIG,BASE='https://www.gstatic.com/firebasejs/10.12.2/';
var arrancado=false;
function arrancar(){if(arrancado)return;arrancado=true;var s=document.createElement('script');s.src='js/app.js';document.body.appendChild(s);}
function cargar(urls,ok,fail){if(!urls.length){ok();return;}var s=document.createElement('script');s.src=urls[0];s.onload=function(){cargar(urls.slice(1),ok,fail);};s.onerror=fail;document.head.appendChild(s);}
if(!cfg||!cfg.apiKey){arrancar();return;}
setTimeout(arrancar,8000);
cargar(window.firebase?[]:[BASE+'firebase-app-compat.js',BASE+'firebase-auth-compat.js',BASE+'firebase-firestore-compat.js'],function(){
  try{
    if(!window.firebase.apps.length)window.firebase.initializeApp(cfg);
    var db=window.firebase.firestore();
    window.NUBE={db:db,auth:window.firebase.auth()};
    db.collection('torneo').doc('datos').get().then(function(d){
      if(d.exists){try{window.TORNEO=JSON.parse(d.data().json);}catch(e){}}
      arrancar();
    }).catch(arrancar);
  }catch(e){arrancar();}
},arrancar);
})();
