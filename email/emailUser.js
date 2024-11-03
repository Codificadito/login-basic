const brevo = require('@getbrevo/brevo');
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    "xkeysib-key-GkLKvThtYZMrcM2C"
);

exports.enviarCorreoRecuperacion = async (email, tokenReset, userName) => {
  return true
    try {
        // Crear una instancia del objeto SendSmtpEmail
        const sendSmtpEmail = new brevo.SendSmtpEmail();

        // Configurar los detalles del correo
        sendSmtpEmail.subject = "Recuperación de Contraseña";
        sendSmtpEmail.to = [{ email: email, name: userName }]; // Añadido nombre del usuario
        sendSmtpEmail.htmlContent = `
        <html>
          <body>
            <h1>Hola ${userName},</h1>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Por favor, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
            <a href='https://www.localhost.com.ar/reset-password?token=${tokenReset}'>Restablecer mi contraseña</a>
            <p>Si no solicitaste este cambio, ignora este correo.</p>
            <p>Saludos, <br> El equipo de Inmobiler</p>
          </body>
        </html>
      `;
        sendSmtpEmail.sender = {
            name: "Inmobiler",
            email: "no-reply@localhost.com.ar",
        };

        // Enviar el correo
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Correo enviado con éxito:', result);

    } catch (error) {
        console.error('Error al enviar el correo de recuperación:', error);
    }
};
