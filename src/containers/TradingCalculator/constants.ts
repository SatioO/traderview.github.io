export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCgaB_xeab-FEImuUNkTX6oYpdXa48Ztjc',
  authDomain: 'traderview-d3103.firebaseapp.com',
  projectId: 'traderview-d3103',
  storageBucket: 'traderview-d3103.firebasestorage.app',
  messagingSenderId: '902654818714',
  appId: '1:902654818714:web:4d462e4247dacb2aa4a223',
  measurementId: 'G-SPLVKEDZHE',
};

export const BROKERAGE_RATES = {
  STT: 0.001, // 0.1% on buy side only for delivery
  TRANSACTION_CHARGES: 0.0000297, // 0.00297% NSE on buy side
  SEBI_CHARGES: 10 / 1e7, // ₹10 / crore on buy side
  GST: 0.18, // 18% on txn + sebi only
  STAMP_DUTY: 0.00015, // 0.015% on buy only
};