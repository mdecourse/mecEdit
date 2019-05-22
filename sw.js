const APP_PREFIX="mecEdit",VERSION="v0.6.9-22.05.2019",CACHE_NAME="mecEdit_"+VERSION,URLS=["./","./index.html","./manifest.json","./img/favicon/favicon-16x16.png","./img/favicon/favicon-32x32.png","./img/android/android-launchericon-96-96.png","./img/windows10/Square150x150Logo.scale-100.png","./img/favicon/apple-touch-icon.png","./img/favicon/safari-pinned-tab.svg","./img/favicon/favicon.ico","./img/favicon/browserconfig.xml","./vendor/bootstrap4.1.3.min.css","./app.min.css","./vendor/codemirror/codemirror5.39.2.css","./vendor/codemirror/lucario.css","./vendor/codemirror/mdn-like.css","./vendor/bootstrap-native-v4.min.js","./vendor/draggabilly.pkgd.min.js","./vendor/codemirror/codemirror5.39.2.min.js","./vendor/codemirror/codemirror.jsmode5.39.2.js","./vendor/codemirror/matchbrackets.js","./scripts/g2.js","./scripts/g2.editor.js","./scripts/mec2.min.js","./app.min.js"];self.addEventListener("fetch",function(e){e.respondWith(caches.match(e.request).then(function(response){return response||fetch(e.request)}).catch(function(error){console.error("sw fetch error:",error,"\nrequest: ",e.request.url)}))}),self.addEventListener("install",function(e){e.waitUntil(caches.open(CACHE_NAME).then(function(cache){return console.log("Installing cache: "+CACHE_NAME),cache.addAll(URLS).then(()=>self.skipWaiting())}).catch(function(error){console.error("sw install error:",error)}))}),self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(keyList){const cacheWhitelist=keyList.filter(function(key){return key.indexOf("mecEdit")});return cacheWhitelist.push(CACHE_NAME),Promise.all(keyList.map(function(key,i){if(-1===cacheWhitelist.indexOf(key))return console.log("Deleting cache: "+keyList[i]),caches.delete(keyList[i])}))}).catch(function(error){console.error("sw activation error:",error)}))});