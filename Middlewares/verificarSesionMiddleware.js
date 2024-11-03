const userRepository = require('../repository/usersRepository');

const verificarSesionMiddleware = async (req, res, next) => {
  const { email, sessionKey } = req.body;
  if (!email || !sessionKey) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const sesionValida = await userRepository.verificarSesion(email, sessionKey);
  if (!sesionValida) {
    return res.status(401).json({ message: 'Sesión no válida' });
  }

  next();
};

module.exports = verificarSesionMiddleware;
