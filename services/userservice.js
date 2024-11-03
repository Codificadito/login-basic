//3
const userRepository = require('../repository/usersRepository');
const moment = require('moment');


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//ok
exports.registerUser = async (nombre, apellido, email, password, imgprofile, grupo, role, permisos) => {
  try {
    return await userRepository.createUsers(nombre, apellido, email, password, imgprofile, grupo, role, permisos);
  } catch (error) {
    throw new Error(error.message);
  }
};


//ok
exports.loginUser = async (email, password) => {
  // Validaciones
  if (!email || !password) {
    throw new Error('Email y contraseña son requeridos');
  }

  // Validar formato de email
  if (!emailRegex.test(email)) {
    throw new Error('El formato del correo electrónico es inválido');
  }

  // Validar formato de contraseña (puedes ajustar según las necesidades)
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  try {
    const sessionKey = await userRepository.iniciarSesion(email, password);

    if (!sessionKey) {
      throw new Error('Credenciales incorrectas');
    }

    return sessionKey;
  } catch (error) {
    throw error; // Lanza el error para que el llamador lo maneje
  }
};


exports.updateUser = async (id, nombre, apellido, email, imgprofile, grupo, role, permisos) => {
  // No es necesario verificar la sesión aquí, ya que ya se hace en el middleware
  return await userRepository.actualizarUsuario(id, nombre, apellido, email, imgprofile, grupo, role, permisos);
};


//ok
// Función en el servicio
exports.verificarSesion = async (email, sessionKey) => {
  try {
    const data = await userRepository.verificarSesion(email, sessionKey);
    return data
  } catch (error) {
    throw new Error(`Error al verificar sesión: ${error.message}`);
  }
};

//ok
exports.logoutUser = async (email, sessionKey) => {
  try {
    // Validar que el campo email está presente
    if (!email) {
      throw new Error('El campo email es requerido');
    }

    // Proceder con el cierre de sesión
    await userRepository.cerrarSesion(email, sessionKey);

    // Retornar el resultado exitoso
    return { success: true, message: 'Sesión cerrada correctamente' };
  } catch (error) {

    // Propagar el error al controlador para que pueda manejarlo
    throw new Error(`Error en el cierre de sesión: ${error.message}`);
  }
};

// Validar que el correo tenga un formato correcto usando Promesas
exports.esEmailValido = (email) => {
  return new Promise((resolve, reject) => {
    const isValid = emailRegex.test(email);
    if (isValid) {
      resolve(isValid);
    } else {
      reject(new Error("Correo electrónico no válido"));
    }
  });
};

exports.existeUsuario = async (email) => {
  try {
    let existe = userRepository.existeUsuario(email);
    if (existe) {
      return existe
    }
  } catch (error) {
    return error
  }
}


exports.forgotPassword = async (email) => {
  try {
    // Llama a la función que guarda el token y la expiración en la base de datos
    let resultado = await userRepository.forgotPassword(email);
    
    // Devuelve el resultado directamente
    return resultado;
  } catch (error) {
    // Maneja cualquier error y devuelve un objeto con el error
    console.error('Error en el proceso de recuperación de contraseña:', error);
    return { success: false, error: error.message };
  }
};

exports.reserPassword = async (tokenReset, newPassword) => {
  try {
    // Llamar a la función en el repositorio y pasar los parámetros
    const respuesta = await userRepository.resetPassword(tokenReset, newPassword);

    // Devolver la respuesta del repositorio
    return respuesta;
  } catch (error) {
    // Manejar el error y devolver una respuesta de error
    console.error('Error al restablecer la contraseña:', error);
    return {
      success: false,
      message: 'Ocurrió un error al restablecer la contraseña. Por favor, intente de nuevo.',
    };
  }
};