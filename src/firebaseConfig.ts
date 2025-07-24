// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// TODO: Add your own Firebase configuration from your Firebase project settings
// Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCgaB_xeab-FEImuUNkTX6oYpdXa48Ztjc',
  authDomain: 'traderview-d3103.firebaseapp.com',
  projectId: 'traderview-d3103',
  storageBucket: 'traderview-d3103.firebasestorage.app',
  messagingSenderId: '902654818714',
  appId: '1:902654818714:web:4d462e4247dacb2aa4a223',
  measurementId: 'G-SPLVKEDZHE',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let analytics;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
    if (import.meta.env.DEV) {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      }
      gtag('config', 'G-SPLVKEDZHE', {
        send_page_view: false,
        debug_mode: true,
      });
    }
  }
});

export { app, analytics };
