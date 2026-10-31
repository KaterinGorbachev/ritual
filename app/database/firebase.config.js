// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // NOTE: the env var is spelled MESSAGER, not MESSAGING. The typo is in .env
  // and in every deployment, so it stays — renaming it here breaks the build
  // until every environment is updated.
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGER_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

/**
 * Email/password sign-in for the CRM at /admin. This is what gives Firestore a
 * real `request.auth.uid` — the security rules look that uid up in `/admins`,
 * so without a signed-in user every write to `services` is rejected.
 *
 * Resolved lazily rather than at import time. `getAuth()` throws
 * `auth/invalid-api-key` the moment it runs without a real key, and the browser
 * test project stubs `process.env` to `{}` (see vitest.config.mts — next/image
 * forces it), so eager initialization broke every test that imports a component
 * anywhere near the data layer. `getFirestore` has no such problem, which is
 * why only this one is deferred.
 *
 * In the app nothing changes: the first property access initializes it exactly
 * as before, with the same config.
 */
let authInstance = null

/**
 * The lazy stand-in. Annotated as `Auth` because that is what every property
 * access resolves to — the Proxy is transparent, verified against a plain
 * getAuth() object (same errors, and signOut/onAuthStateChanged both work).
 * Without the annotation TypeScript infers `{}` from the Proxy target and
 * every call site fails to type check.
 *
 * @type {import("firebase/auth").Auth}
 */
const auth = /** @type {any} */ (
  new Proxy(
    {},
    {
      get(_target, property) {
        authInstance ??= getAuth(app)
        const value = authInstance[property]
        return typeof value === "function" ? value.bind(authInstance) : value
      },
    },
  )
)

export { db, auth }
export default app