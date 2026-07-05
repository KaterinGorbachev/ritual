export const mapFirebaseError = (error) => {
  switch (error.code) {
    case 'permission-denied':
      return 'No tienes permisos para realizar esta acción 🙅‍♂️'

    case 'unavailable':
      return 'El servicio no está disponible. Inténtalo más tarde ⏳'

    case 'not-found':
      return 'No se encontró la información solicitada 🔍'

    case 'already-exists':
      return 'Este registro ya existe ⚠️'

    case 'invalid-argument':
      return 'Los datos enviados no son válidos ❌'

    default:
      return 'Ocurrió un error inesperado. Inténtalo de nuevo 😕'
  }
}
