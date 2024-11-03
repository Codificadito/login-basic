const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../db/sqlite');
const correo = require('../email/emailUser')
const moment = require('moment');


db.conectarDB();
const SESSION_LIFETIME_HOURS = 24;

// Función para generar un token seguro
function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Función para hashear la contraseña
function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Crear un nuevo usuario
exports.createUsers = async (Nombre, apellido, email, password, imgprofile, grupo, role, permisos) => {
  try {
    // Hashear la contraseña antes de insertarla en la base de datos
    const hashedPassword = await hashPassword(password);

    // Llamamos a la función para insertar el usuario en la base de datos
    return await db.insertarUsuario(Nombre, apellido, email, hashedPassword, imgprofile, grupo, role, permisos);
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};




// Iniciar sesión y generar una clave
exports.iniciarSesion = async (email, password) => {
  try {

    // Asegúrate de que db.iniciarSesion esté correctamente importado
    const claveSesion = await db.iniciarSesion(email, password);

    return claveSesion; // Retorna la clave de sesión si todo está bien
  } catch (error) {
    // Lanza el error para que el llamador pueda manejarlo
    throw new Error(`Error al iniciar sesión: ${error.message}`);
  }
};



// Actualizar la clave de sesión y su expiración
exports.actualizarSesion = async (email, sessionKey) => {
  console.log("repository : ", email, sessionKey);
  try {
    console.log(`Actualizando la sesión para el email: ${email}`);
    console.log(`Clave de sesión: ${sessionKey}`);
    console.log(`Fecha de expiración: ${expiryDate}`);
    // Agregar tiempo de expiración a la sesión
    const expiryDate = moment().add(SESSION_LIFETIME_HOURS, 'hours').toDate();
    //console.log('Fecha de expiración de la sesión:', expiryDate);
    console.log("service : ", email, sessionKey, expiryDate)
    const data = await userRepository.actualizarSesion(email, sessionKey, expiryDate);
    //console.log('Clave de sesión y expiración actualizadas en la base de datos');
    console.log(data)
    const actualizado = await db.actualizarSesion(email, sessionKey, expiryDate);

    if (actualizado) {
      console.log('Sesión actualizada exitosamente');
    } else {
      console.log('No se pudo actualizar la sesión');
    }

    return actualizado; // Retornar el resultado de la actualización
  } catch (error) {
    console.error('Error al actualizar la sesión:', error.message);
    throw new Error(`Error al actualizar la sesión: ${error.message}`);
  }
};



// Verificar la clave de sesión
exports.verificarSesion = async (email, sessionKey) => {
  try {
    // Suponiendo que db.verificarSesion devuelve un booleano
    const resultado = await db.verificarSesion(email, sessionKey);

    // Verificar si el resultado es verdadero
    if (resultado) {

      return true; // La sesión es válida
    } else {
      return false; // La sesión no es válida
    }
  } catch (error) {
    throw new Error(`Error al verificar sesión: ${error.message}`);
  }
};



// Cerrar sesión


exports.cerrarSesion = async (email, sessionKey) => {
  try {
    const sesioClose = await db.cerrarSesion(email, sessionKey);
    return sesioClose;
  } catch (error) {
    throw new Error(`Error al cerrar sesión: ${error.message}`);
  }
};


exports.existeUsuario = async (email) => {
  try {
    const existe = await db.existeUsuario(email);
    return existe
  } catch (error) {
    return error
  }
}

function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}
// Función para solicitar el restablecimiento de contraseña
exports.forgotPassword = async (email) => {
  try {
    // Genera un nuevo token y establece su fecha de expiración
    const tokenReset = generarToken();
    const tokenExpiry = moment().add(1, 'hour').toDate(); // El token expira en 1 hora

    // Guarda el token y la fecha de expiración en la base de datos
    const resultado = await db.forgotPassword(email, tokenReset, tokenExpiry);

    // Verifica si el token y la expiración se guardaron correctamente
    if (resultado) {
      console.log('Token de recuperación guardado en la base de datos con éxito.');
      const userName = await db.existeUsuario(email)
      // Envía el correo de recuperación con el token
      const correoResultado = await correo.enviarCorreoRecuperacion(email, tokenReset, userName);

      if (correoResultado) {
        return {
          success: true,
          message: 'Token de recuperación de contraseña guardado con éxito y correo enviado.',
        };
      } else {
        return {
          success: false,
          message: 'El token fue guardado, pero no se pudo enviar el correo de recuperación.',
        };
      }
    } else {
      return {
        success: false,
        message: 'No se pudo guardar el token de recuperación. Verifique si el usuario existe.',
      };
    }
  } catch (error) {
    console.error('Error en el proceso de recuperación de contraseña:', error);
    return {
      success: false,
      message: 'No se pudo completar el proceso de recuperación de contraseña. Por favor, intente de nuevo.',
    };
  }
};

// Función para restablecer la contraseña
exports.resetPassword = async (tokenReset, newPassword) => {

  try {
    // Hashear la nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Llamar a la función en el repositorio para actualizar la contraseña en la base de datos
    const result = await db.resetPassword(tokenReset, hashedPassword);

    // Devolver el resultado
    return result;
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    return {
      success: false,
      message: 'Ocurrió un error al restablecer la contraseña. Por favor, intente de nuevo.',
    };
  }
};