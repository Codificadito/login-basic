const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { error } = require('console');
const { query } = require('express');
const moment = require('moment');


// Expresión regular para validar correos electrónicos
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let db;

// Conectar a la base de datos
exports.conectarDB = () => {
  if (!db) {
    db = new sqlite3.Database(path.resolve(__dirname, 'system.db'), (err) => {
      if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
      } else {
        console.log('Conectado a la base de datos SQLite.');
        setupDatabase();
      }
    });
  }
};

// Configurar la base de datos
function setupDatabase() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  imgprofile TEXT,
  grupo TEXT,
  role TEXT NOT NULL,
  permisos TEXT,
  sessionKey TEXT,
  sessionExpiry DATETIME,
  passwordResetToken TEXT,       
  passwordResetExpiry DATETIME   
);

    )
  `;

  db.run(query, (err) => {
    if (err) {
      console.error('Error al crear la tabla:', err.message);
    } else {
      console.log('Tabla de usuarios creada.');
      // Mover la verificación del admin a una función separada
      checkAndInsertAdmin();
    }
  });
}

// Verificar e insertar el usuario admin
function checkAndInsertAdmin() {
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'adminpassword'; // Cambia esto por una contraseña segura
  const checkAdminQuery = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';

  db.get(checkAdminQuery, [adminEmail], (err, row) => {
    if (err) {
      console.error('Error al verificar el usuario admin:', err.message);
      return;
    }

    if (row.count > 0) {
      console.log('El usuario admin ya está creado.');
    } else {
      // Generar la contraseña hashada para el usuario admin
      bcrypt.hash(adminPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error al hashear la contraseña del admin:', err.message);
          return;
        }

        const insertAdminQuery = `
          INSERT INTO users (nombre, apellido, email, password, imgprofile, grupo, role, permisos)
          VALUES ('Admin', 'User', ?, ?, 'admin.jpg', 'Administradores', 'admin', 'todos')
        `;
        db.run(insertAdminQuery, [adminEmail, hashedPassword], (err) => {
          if (err) {
            console.error('Error al insertar el usuario admin:', err.message);
          } else {
            console.log('Usuario admin insertado por defecto.');
          }
        });
      });
    }
  });
}

// Generar una clave de sesión
function generarClaveSesion() {
  return crypto.randomBytes(64).toString('hex'); // Genera una clave de 128 caracteres
}



// Función para iniciar sesión y generar una clave
exports.iniciarSesion = (email, password) => {
  return new Promise((resolve, reject) => {
    // Obtener usuario por email
    const query = 'SELECT * FROM users WHERE email = ?';

    db.all(query, [email], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      if (rows.length > 0) {
        const row = rows[0]; // Tomar el primer resultado

        // Validar la contraseña
        bcrypt.compare(password, row.password, (err, isMatch) => {
          if (err) {
            //console.error('Error al comparar contraseñas:', err.message);
            reject(err);
            return;
          }

          if (isMatch) {
            // Si la contraseña es válida, genera una clave de sesión
            const claveSesion = generarClaveSesion();
            //console.log('Clave de sesión generada:', claveSesion);

            // Convertir la fecha de expiración a marca de tiempo en milisegundos
            const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000;
            //console.log('Fecha de expiración de la sesión (en milisegundos):', sessionExpiry);

            const updateQuery = 'UPDATE users SET sessionKey = ?, sessionExpiry = ? WHERE email = ?';
            //console.log(`Ejecutando consulta de actualización: ${updateQuery} con clave de sesión: ${claveSesion}`);

            db.run(updateQuery, [claveSesion, sessionExpiry, email], (err) => {
              if (err) {
                console.error('Error al actualizar la clave de sesión:', err.message);
                reject(err);
                return;
              }
              //console.log('Clave de sesión actualizada exitosamente');
              resolve(claveSesion);
            });
          } else {
            //console.log('Contraseña incorrecta');
            reject(new Error('Usuario o contraseña incorrecto'));
          }
        });
      } else {
        //console.log('Usuario no encontrado');
        reject(new Error('Usuario o contraseña incorrecto'));
      }
    });
  });
};


// Verificar la clave de sesión
exports.verificarSesion = (email, sessionKey) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT sessionKey, sessionExpiry FROM users WHERE email = ?';
    db.get(query, [email], (err, row) => {
      if (err) {
        //console.error('Error al ejecutar la consulta:', err); // Imprimir el error
        reject(err);
        return;
      }

      // Imprimir los datos obtenidos de la base de datos
      //console.log('Datos obtenidos de la base de datos:', row);

      if (row) {
        // Convertir sessionExpiry a Date
        const expiryDate = new Date(row.sessionExpiry);
        //console.log('Comparando sessionKey:', row.sessionKey, 'con', sessionKey);
        //console.log('Fecha de expiración:', expiryDate, 'Fecha actual:', new Date());

        // Verificar que sessionKey coincide y que la fecha de expiración es futura
        if (row.sessionKey === sessionKey && expiryDate > new Date()) {
          resolve(true); // Clave de sesión válida
        } else {
          resolve(false); // Clave de sesión no válida o expiración pasada
        }
      } else {
        //console.log('No se encontró ningún registro para el email:', email);
        resolve(false); // No se encontró el email
      }
    });
  });
};




// Actualizar la clave de sesión y su expiración
exports.actualizarSesion = (email, sessionKey, expiryDate) => {
  console.log("sqlite : ", email, sessionKey, expiryDate);
  return new Promise((resolve, reject) => {
    const query = 'UPDATE users SET sessionKey = ?, sessionExpiry = ? WHERE email = ?';
    db.run(query, [sessionKey, expiryDate, email], (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(true);
    });
  });
};

// Cerrar sesión
exports.cerrarSesion = (email) => {
  return new Promise((resolve, reject) => {
    const cerrarQuery = 'UPDATE users SET sessionKey = NULL WHERE email = ?';
    db.run(cerrarQuery, [email], function (err) {
      if (err) {
        return reject(err);
      }

      // Verificar si se realizó alguna actualización
      if (this.changes > 0) {
        resolve(true); // La sesión se cerró correctamente
      } else {
        resolve(false); // No se realizó ninguna actualización
      }
    });
  });
};

// Cerrar la conexión con la base de datos
exports.cerrarDB = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar la base de datos:', err.message);
      } else {
        console.log('Cerrada la conexión con la base de datos SQLite.');
      }
    });
  }
};

// Validar que el correo tenga un formato correcto
const esEmailValido = (email) => {
  return emailRegex.test(email);
};


// Verificar si un usuario ya existe basado en el correo
const existeUsuario = (email) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT COUNT(*) AS count FROM users WHERE email = ?`;
    db.get(query, [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count > 0); // Si el conteo es mayor a 0, el usuario ya existe
      }
    });
  });
};

exports.existeUsuario = async (email) => {
  try {
    const query = `SELECT * FROM users WHERE email = ?`;
    const user = await new Promise((resolve, reject) => {
      db.get(query, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row); // Devuelve la fila encontrada o `undefined` si no hay coincidencias
        }
      });
    });

    if (user) {
      return {
        exists: true,
        user: user
      };
    } else {
      return {
        exists: false,
        user: null
      };
    }
  } catch (error) {
    console.error('Error al verificar el usuario:', error);
    throw new Error('Error al verificar el usuario. Intente de nuevo más tarde.');
  }
};


// Insertar un nuevo usuario después de realizar las validaciones
exports.insertarUsuario = async (nombre, apellido, email, hashedPassword, imgprofile, grupo, role, permisos) => {
  try {
    const usuarioExiste = await existeUsuario(email);
    if (usuarioExiste) {
      console.error('Error: El usuario ya existe.');
      return Promise.reject(new Error('El usuario ya existe.'));
    }

    const query = `
      INSERT INTO users (yapellido, email, password, imgprofile, grupo, role, permisos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      db.run(query, [nombre, apellido, email, hashedPassword, imgprofile, grupo, role, permisos], function (err) {
        if (err) {
          console.error('Error al insertar el usuario:', err.message);
          reject(err);
        } else {
          console.log(`Usuario insertado con ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  } catch (err) {
    console.error('Error al verificar si el usuario existe:', err.message);
    return Promise.reject(err);
  }
};

// Actualizar un usuario, verificando el correo electrónico
exports.actualizarUsuario = async (id, nombre, apellido, email, imgprofile, grupo, role, permisos) => {
  if (!esEmailValido(email)) {
    console.error('Error: El formato del correo electrónico es inválido.');
    return Promise.reject(new Error('El formato del correo electrónico es inválido.'));
  }

  try {
    const usuarioExiste = await existeUsuario(email);
    if (usuarioExiste) {
      console.error('Error: El usuario con este correo electrónico ya existe.');
      return Promise.reject(new Error('El usuario con este correo electrónico ya existe.'));
    }

    const query = `
      UPDATE users
      SET nombre = ?, apellido = ?, email = ?, imgprofile = ?, grupo = ?, role = ?, permisos = ?
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      db.run(query, [nombre, apellido, email, imgprofile, grupo, role, permisos, id], function (err) {
        if (err) {
          console.error('Error al actualizar el usuario:', err.message);
          reject(err);
        } else {
          console.log(`Usuario actualizado con ID: ${id}`);
          resolve(this.changes); // Cambios realizados en la base de datos
        }
      });
    });
  } catch (err) {
    console.error('Error al verificar si el usuario existe:', err.message);
    return Promise.reject(err);
  }
};

exports.forgotPassword = (email, tokenReset, tokenExpiry) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE users
      SET passwordResetToken = ?, passwordResetExpiry = ?
      WHERE email = ?
    `;

    db.run(query, [tokenReset, tokenExpiry, email], function(err) {
      if (err) {
        console.error('Error al guardar el token de recuperación:', err);
        return reject(err); // Rechazar la promesa en caso de error
      }

      console.log('Token de recuperación guardado correctamente');
      // Resolver la promesa con un mensaje positivo
      resolve('Token de recuperación guardado correctamente');
    });
  });
};



// Función para restablecer la contraseña
exports.resetPasswordd = (tokenReset, hashedPassword) => {
  return new Promise((resolve, reject) => {
    // Verificar si el token es válido y no ha expirado
    const query = `
      SELECT id, passwordResetExpiry 
      FROM users 
      WHERE passwordResetToken = ?;
    `;
    
    db.get(query, [tokenReset], (err, user) => {
      if (err) {
        console.error('Error al buscar el token:', err);
        return reject({
          success: false,
          message: 'Ocurrió un error al buscar el token de restablecimiento.',
        });
      }

      if (!user) {
        return resolve({
          success: false,
          message: 'Token no válido o usuario no encontrado.',
        });
      }

      // Verificar si el token ha expirado
      const currentDateTime = moment().toDate();
      if (currentDateTime > new Date(user.passwordResetExpiry)) {
        return resolve({
          success: false,
          message: 'El token de restablecimiento de contraseña ha expirado.',
        });
      }

      // Actualizar la contraseña del usuario en la base de datos
      const updateQuery = `
        UPDATE users 
        SET password = ?, passwordResetToken = NULL, passwordResetExpiry = NULL 
        WHERE id = ?;
      `;
      
      db.run(updateQuery, [hashedPassword, user.id], function(err) {
        if (err) {
          console.error('Error al actualizar la contraseña:', err);
          return reject({
            success: false,
            message: 'Ocurrió un error al actualizar la contraseña.',
          });
        }

        return resolve({
          success: true,
          message: 'Contraseña actualizada con éxito.',
        });
      });
    });
  });
};

// Función para obtener el usuario por el token de restablecimiento
const getUserByToken = async (tokenReset) => {
  const query = `
    SELECT id, passwordResetExpiry 
    FROM users 
    WHERE passwordResetToken = ?;
  `;

  try {
    // Ejecuta la consulta y espera la respuesta
    const user = await new Promise((resolve, reject) => {
      db.get(query, [tokenReset], (err, row) => {
        if (err) {
          reject(new Error('Ocurrió un error al buscar el token de restablecimiento.'));
        } else {
          resolve(row);
        }
      });
    });

    // Verifica si se obtuvo un usuario
    if (!user) {
      console.log("getUserByToken: ", user);
      return {
        success: false,
        message: 'Token no válido o usuario no encontrado.',
      };
    }

    console.log("getUserByToken: Usuario encontrado:", user);
    return {
      success: true,
      user: user,
    };

  } catch (error) {
    console.error('Error en getUserByToken:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};



// Función para verificar si el token ha expirado
const isTokenExpired = (expiryDate) => {
  const currentDateTime = moment().toDate();
  console.log(currentDateTime > new Date(expiryDate))
  return currentDateTime > new Date(expiryDate);
};

// Función para actualizar la contraseña
const updatePassword = (userId, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const updateQuery = `
      UPDATE users 
      SET password = ?, passwordResetToken = NULL, passwordResetExpiry = NULL 
      WHERE id = ?;
    `;
    
    db.run(updateQuery, [hashedPassword, userId], function(err) {
      if (err) {
        console.error('Error al actualizar la contraseña:', err);
        return reject({
          success: false,
          message: 'Ocurrió un error al actualizar la contraseña.',
        });
      }

      resolve({
        success: true,
        message: 'Contraseña actualizada con éxito.',
      });
    });
  });
};

// Función principal para restablecer la contraseña
exports.resetPassword = async (tokenReset, hashedPassword) => {

  try {

    // Obtener el usuario por el token de restablecimiento
    const userResult = await getUserByToken(tokenReset);
    console.log(userResult)
    if (!userResult.success) {
      return userResult; // Token no válido o usuario no encontrado
    }

    // Verificar si el token ha expirado
    if (isTokenExpired(userResult.passwordResetExpiry)) {
      return {
        success: false,
        message: 'El token de restablecimiento de contraseña ha expirado.',
      };
    }

    const userId = userResult.user.id
    console.log("userid usado : ",userId)
    // Actualizar la contraseña en la base de datos
    const updateResult = await updatePassword(userId, hashedPassword);
    console.log(updateResult)
    return updateResult;
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    return {
      success: false,
      message: 'Ocurrió un error al restablecer la contraseña. Por favor, intente de nuevo.',
    };
  }
};
