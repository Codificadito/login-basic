# 🌟 Proyecto: API de Gestión de Usuarios 🌟

## 📋 Descripción

Esta API permite gestionar usuarios, sesiones y realizar operaciones de autenticación, actualización de perfil y recuperación de contraseñas. Usuarios pueden registrarse, iniciar sesión, actualizar su perfil, verificar sesión y restablecer contraseñas. 

## 🚀 Características
- **Registro de usuarios** 👤
- **Inicio de sesión** 🔑
- **Actualización de perfil** 📝
- **Verificación de sesión** ✅
- **Recuperación y restablecimiento de contraseñas** 🔒

## 📌 Endpoints

### 1. Registro de Usuario 👤

- **URL**: `POST http://127.0.0.1:3000/api/register`
- **Descripción**: Crea un nuevo usuario.
- **Headers**: `Content-Type: application/json`
- **Cuerpo**:
  ```json
  {
    "nombre": "user",
    "apellido": "lastname",
    "email": "jose@email.com",
    "password": "contraseña",
    "imgprofile": "profile.jpg",
    "grupo": "Testers",
    "role": "dueño",
    "permisos": "lectura"
  }
  ```

### 2. Iniciar Sesión 🔑

- **URL**: `PUT http://127.0.0.1:3000/api/login`
- **Descripción**: Autentica a un usuario.
- **Headers**: `Content-Type: application/json`
- **Cuerpo**:
  ```json
  {
    "email": "jose@email.com",
    "password": "contraseña"
  }
  ```

### 3. Actualizar Usuario 📝

- **URL**: `PUT http://127.0.0.1:3000/api/update`
- **Descripción**: Actualiza la información de perfil de un usuario.
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <sessionKey>`
- **Cuerpo**:
  ```json
  {
    "id": 1,
    "nombre": "John",
    "apellido": "Doe",
    "email": "john.doe@example.com",
    "imgprofile": "new_profile.jpg",
    "grupo": "Testers",
    "role": "dueño",
    "permisos": "escritura"
  }
  ```

### 4. Verificar Sesión ✅

- **URL**: `GET http://127.0.0.1:3000/api/check`
- **Descripción**: Verifica si el usuario tiene una sesión activa.
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <sessionKey>`

### 5. Cerrar Sesión 🚪

- **URL**: `POST http://127.0.0.1:3000/api/logout`
- **Descripción**: Cierra la sesión de un usuario.
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <sessionKey>`

### 6. Recuperación de Contraseña 📧

- **URL**: `PUT http://127.0.0.1:3000/api/forgot-password`
- **Descripción**: Envía un enlace de recuperación de contraseña al correo electrónico del usuario.
- **Headers**: `Content-Type: application/json`
- **Cuerpo**:
  ```json
  {
    "email": "jose@email.com"
  }
  ```

### 7. Restablecimiento de Contraseña 🔒

- **URL**: `PUT http://127.0.0.1:3000/api/reset-password?token=key`
- **Descripción**: Restablece la contraseña del usuario usando un token.
- **Headers**: `Content-Type: application/json`
- **Cuerpo**:
  ```json
  {
    "newPassword": "mi_contraseña"
  }
  ```

## 📥 Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Codificadito/login-basic.git
   cd tu-repositorio
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia la API:
   ```bash
   npm run dev
   ```

## 💡 Notas

- Esta proyecto utiliza autenticación basica para proteger los endpoints.

## 📝 Licencia

Este proyecto está bajo la licencia MIT. 

---
