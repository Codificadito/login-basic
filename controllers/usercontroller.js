//2
const userService = require('../services/userservice');


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//ok
exports.registerUser = async (req, res) => {
  const { nombre, apellido, email, password, imgprofile, grupo, role, permisos } = req.body;

  // Validaciones
  if (!nombre || !apellido || !email || !role) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  // Validar formato de email
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'El formato del correo electrónico es inválido' });
  }

  // Validar formato de contraseña (si se incluye en el registro)
  if (password && password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Crear el usuario en el repositorio
    const newUser = await userService.registerUser(nombre, apellido, email, password, imgprofile, grupo, role, permisos);

    // Respuesta exitosa
    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: newUser
    });
  } catch (error) {
    // Manejo de errores
    console.error('Error al registrar el usuario:', error.message);
    return res.status(500).json({ message: `Error al registrar el usuario: ${error.message}` });
  }
};


//ok
exports.loginUser = async (req, res) => {
  try {
    // Desestructuración de email y password del cuerpo de la solicitud
    const { email, password } = req.body;
    
    // Verificación básica
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Llamada al servicio de login para obtener la clave de sesión
    let sessionKey = await userService.loginUser(email, password);
    console.log('Clave de sesión obtenida:', sessionKey);

    // Respuesta exitosa con la clave de sesión
    res.status(200).json({ message: 'Login exitoso', data: sessionKey });
  } catch (error) {
    // Manejo de errores
    console.error('Error en loginUser:', error.message);
    res.status(400).json({ message: error.message });
  }
};



exports.updateUser = async (req, res) => {
  try {
    const { id, nombre, apellido, email, imgprofile, grupo, role, permisos } = req.body;
    const sessionKey = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    if (!sessionKey) {
      return res.status(401).json({ message: 'No se encontró la clave de sesión' });
    }

    let isSessionValid = await userService.verificarSesion(email, sessionKey);
    if (!isSessionValid) {
      return res.status(401).json({ message: 'Sesión no válida' });
    }

    await userService.updateUser(id, nombre, apellido, email, imgprofile, grupo, role, permisos);
    res.status(200).json({ message: 'Datos del usuario actualizados correctamente' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//ok
exports.logoutUser = async (req, res) => {
  try {

    // Validación del cuerpo de la solicitud
    if (!req.body || !req.body.email) {
      return res.status(400).json({ message: 'El cuerpo de la solicitud no está definido o no contiene el campo email' });
    }

    const { email } = req.body;

    // Validación del encabezado Authorization
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      return res.status(401).json({ message: 'Encabezado de autorización no encontrado' });
    }

    const sessionKey = authorizationHeader.split(' ')[1];
    if (!sessionKey) {
      return res.status(401).json({ message: 'No se encontró la clave de sesión en el encabezado de autorización' });
    }

    // Verificar si la sesión es válida
    const isSessionValid = await userService.verificarSesion(email, sessionKey);
    if (!isSessionValid) {
      return res.status(401).json({ message: 'Sesión no válida o expiró' });
    }

    // Proceder con el cierre de sesión
    await userService.logoutUser(email, sessionKey);
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    // Manejo de errores
    console.error('Error en el cierre de sesión:', error.message);
    res.status(400).json({ message: error.message });
  }
};

//ok
exports.checkSession = async (req, res) => {
  try {
    const sessionKey = req.headers.authorization.split(' ')[1]; // Obtener sessionKey del header
    const { email } = req.body;

    let isSessionValid = await userService.verificarSesion(email, sessionKey);
    if (isSessionValid) {
      res.status(200).json({ message: 'Sesión válida' });
    } else {
      res.status(401).json({ message: 'Sesión no válida o expiró' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar el formato del email
    let isEmailValid = await userService.esEmailValido(email);
    if (!isEmailValid) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo electrónico no es válido.',
      });
    }

    // Verificar si el usuario existe
    let isValid = await userService.existeUsuario(email);
    if (!isValid) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró un usuario con ese correo electrónico.',
      });
    }

    // Solicitar el restablecimiento de contraseña
    let resultado = await userService.forgotPassword(email);
    if (resultado.success) {
      return res.status(200).json({
        success: true,
        message: 'Se ha enviado un correo electrónico para restablecer la contraseña.',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Hubo un problema al intentar restablecer la contraseña. Por favor, intente de nuevo más tarde.',
      });
    }
  } catch (error) {
    console.error('Error en el proceso de recuperación de contraseña:', error);
    return res.status(500).json({
      success: false,
      message: 'No se pudo completar el proceso de recuperación de contraseña. Por favor, intente de nuevo.',
    });
  }
};

exports.reserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const tokenReset = req.query.token; // Obtener el token directamente del query
    if (tokenReset) {
      // Llamar al servicio con el token y la nueva contraseña
      const resultado = await userService.reserPassword(tokenReset, newPassword);

      // Enviar respuesta basada en el resultado del servicio
      if (resultado.success) {
        return res.status(200).json({
          success: true,
          message: resultado.message || 'Contraseña actualizada con éxito.',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: resultado.message || 'No se pudo actualizar la contraseña.',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Token de restablecimiento no proporcionado.',
      });
    }
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al restablecer la contraseña. Por favor, intente de nuevo.',
    });
  }
};