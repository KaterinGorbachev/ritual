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


// send data to a Firebase 
export const saveData = async (data, table) => {
  try {
    const docRef = collection(db, table)

    await addDoc(docRef, {
      ...data,
      createdAt: new Date(),
    })

    return {
      ok: true,
      message: 'Information was added successfully',
    }
  } catch (error) {
    console.error('Error while saving information:', error.code)

    return {
      ok: false,
      code: error.code,
      message: mapFirebaseError(error),
    }
  }
}

// change fields of one existing document
export const updateData = async (table, id, data) => {
  try {
    if (!table || !id) {
      throw new Error('Table name and document id are required')
    }

    await updateDoc(doc(db, table, id), {
      ...data,
      updatedAt: new Date(),
    })

    return {
      ok: true,
      message: 'Information was updated successfully',
    }
  } catch (error) {
    console.error('Error while updating information:', error.code)

    return {
      ok: false,
      code: error.code,
      message: mapFirebaseError(error),
    }
  }
}


