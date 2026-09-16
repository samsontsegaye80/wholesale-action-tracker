import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.spaces');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.spaces.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.messages');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.messages.create');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.memberships');
