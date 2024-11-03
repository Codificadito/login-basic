const express = require('express');
const usersRouter = require('./routers/user');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware para parsear JSON en el cuerpo de las solicitudes
app.use(express.json());

app.use(cors());
//app.use(cors({
//    origin: 'http://localhost:3000', // Ajusta según sea necesario
//    methods: 'GET,POST,PUT,DELETE',
//    allowedHeaders: 'Content-Type,Authorization'
//}));

app.use('/api', usersRouter);

app.get('/', (req, res) => {
    res.send('Servidor en línea');
});

app.listen(PORT, () => {
    console.log(`El servidor está escuchando en el puerto ${PORT}`);
});
