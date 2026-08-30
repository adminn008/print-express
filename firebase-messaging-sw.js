importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA0FHIsmPmOCGKz9laF838ABvwbLQjkuGo",
    authDomain: "pedidos-17465.firebaseapp.com",
    projectId: "pedidos-17465",
    storageBucket: "pedidos-17465.firebasestorage.app",
    messagingSenderId: "1024812539553",
    appId: "1:1024812539553:web:e9cd48a2ed83dad6965ae0",
    measurementId: "G-J42HZNG46Z"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'PrintExpress';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'Nova atualização disponível!',
        icon: '/favicon.ico',
        data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
