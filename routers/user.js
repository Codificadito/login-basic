//1
const express = require('express');
const user = express.Router();
const usersController = require('../controllers/usercontroller');
const verificarSesionMiddleware = require('../Middlewares/verificarSesionMiddleware.js');

// Registro de usuarios
user.post('/register', usersController.registerUser);

// Inicio de sesión
user.put('/login', usersController.loginUser);

// Cierre de sesión
user.post('/logout', usersController.logoutUser);

// check de sesión
user.get('/check', usersController.checkSession);

// Actualización de usuario con verificación de sesión
user.put('/update', verificarSesionMiddleware, usersController.updateUser);

//forgot-password
user.put('/forgot-password',usersController.forgotPassword);

//reset-password
user.put('/reset-password',usersController.reserPassword);

module.exports = user;
