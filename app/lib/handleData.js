import { db } from '../database/firebase.config.js'
import {
  doc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore'

import { mapFirebaseError } from './firebaseErrors.js'

// Fetch a single document by its ID from a collection.
// e.g. getDocById('ContactData', 'messanger') -> { id, telephone, ... }
export const getDocById = async (table, id) => {
  try {
    if (!table || !id) {
      throw new Error('Table name and document id are required')
    }

    const snapshot = await getDoc(doc(db, table, id))

    if (!snapshot.exists()) {
      return {
        ok: false,
        error: { message: 'Document not found', code: 'not-found' },
      }
    }

    

    return {
      ok: true,
      data: { id: snapshot.id, ...snapshot.data() },
    }
  } catch (error) {
    console.error('Firebase getDocById error:', error)

    return {
      ok: false,
      error: {
        message: error.message || 'Failed to fetch document',
        code: error.code || 'unknown',
      },
    }
  }
}

export const getInfo = async (table) => {
  try {
    if (!table) {
      throw new Error('Table name is required')
    }

    const querySnapshot = await getDocs(collection(db, table))

    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log('Firebase getInfo data:', data)

    return {
      ok: true,
      data,
    }
  } catch (error) {
    console.error('Firebase getInfo error:', error)

    return {
      ok: false,
      error: {
        message: error.message || 'Failed to fetch data',
        code: error.code || 'unknown',
      },
    }
  }
}