/*----------------------------------------------------------
 *
 * Proyecto Integrador: CryptoMind
 * Fecha: 28 de marzo, 2025
 * Autor: A01800182 Daniel Alvarez Sil
 *
 *----------------------------------------------------------*/

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch'; 
import session from 'express-session';
import bcrypt from 'bcrypt';
import backupRouter from './routes/backup.mjs';
import compression from 'compression';


const app = express();
const port = process.env.PORT ?? 8080;
const ipAddress = process.env.C9_HOSTNAME ?? 'localhost';

app.use(session({
  secret: 'PL4T4N1T0__p@7041',
  resave: false,
  saveUninitialized: true,
}));


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: 'CryptoMindDB'
};

async function dbConnect() {
  return await mysql.createConnection(dbConfig);
}


// GAME
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/game', express.static(path.join(__dirname, 'Web')));
app.use(compression()); 
app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'Web', 'index.html'));
});

// Servicio de conexión a la base de datos
app.get('/db', async (req, res) => {
  let connection;
  try {
    connection = await dbConnect();

    const [rows] = await connection.execute('SELECT * FROM usuario');
    res.render('db', { rows });

  } catch (err) {
    res.status(500).send('Error al acceder la base datos');
  } finally {
    if (connection) await connection.end();
  }
});

// Servicio para registrar un nuevo usuario
app.post('/unity/register', async (req, res) => {
  const {
    nombre,
    email,
    password,
    birthday, 
    country, 
    gender
  } = req.body;
  console.log(birthday); 

  // Validate required fields
  if (
    !nombre || !email || !password || 
    !birthday || !country
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let connection;
  try {
    connection = await dbConnect();

    const query = `
      INSERT INTO usuario 
      (username, correo, contrasena, nombre, nacimiento, pais, genero, tokens, puntaje, daño_bala, costo_mejora) 
      VALUES (?, ?, ?, "nombre", ?, ?, ?, 0, 0, 20, 25)
    `;

    await connection.execute(query, [
      nombre,
      email,
      password,
      birthday,
      country,
      gender || null,
    ]);

    res.status(201).json({ message: 'User created successfully' });
    console.log(`Usuario creado: ${nombre}`);

  } catch (err) {
    console.log(`Intento de creación de usuario: ${nombre}`);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'nombre or email already exists' });
    } else if (err.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
      res.status(400).json({ error: 'Data out of allowed range (tokens or vidas)' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  } finally {
    if (connection) await connection.end();
  }
});

// Servicio para iniciar sesión
app.post('/unity/login', async (req, res) => {
  const { emailDatos, passwordDatos } = req.body;
  if (!emailDatos || !passwordDatos) return res.status(400).json({ error: 'Missing credentials' });

  let connection;
  try {
    connection = await dbConnect();

    const [rows] = await connection.execute(
      `SELECT 
         id_usuario, 
         nombre, 
         tokens, 
         puntaje, 
         daño_bala, 
         costo_mejora 
       FROM usuario 
       WHERE correo = ? AND contrasena = ?`,
      [emailDatos, passwordDatos]
    );

    if (rows.length > 0) {
      const user = rows[0];

      // Call /sesion/start internally
      await fetch(`http://${ipAddress}:${port}/sesion/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: emailDatos })
      });

      console.log(`El usuario, ${emailDatos}, inició sesión.`);

      // Send the RespuestaLogin object
      res.status(200).json({
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        tokens: user.tokens,
        puntaje: user.puntaje,
        daño_bala: user.daño_bala,
        costo_mejora: user.costo_mejora
      });
    } else {
      console.log(`El usuario, ${emailDatos}, está intentando ingresar.`);
      res.status(401).json({ error: 'Invalid emailDatos or passwordDatos' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.end();
  }
});


// Servicio para registrar inicio de sesión de juego
app.post('/sesion/start', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  let connection;
  try {
    connection = await dbConnect();

    const [users] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE correo = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id_usuario;

    // Get current time in UTC-6
    const now = new Date();
    const utcMinus6 = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const formattedDate = utcMinus6.toISOString().slice(0, 19).replace('T', ' '); // MySQL format

    await connection.execute(
      'INSERT INTO sesion (id_usuario, inicio_en) VALUES (?, ?)',
      [userId, formattedDate]
    );

    res.status(201).json({ message: 'Session started successfully' });
    console.log(`El usuario, ${username}, inició sesión a las ${formattedDate} (UTC-6).`);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.end();
  }
});

// Servicio para registrar fin de sesión de juego
app.post('/sesion/end', async (req, res) => {
  const { id_usuario, tokens, puntaje, daño_bala, costo_mejora } = req.body;
  console.log("Se cerro sesion, daño_bala y costo_mejora: ", tokens, puntaje, daño_bala, costo_mejora); 

  if (
    id_usuario === undefined ||
    tokens === undefined ||
    puntaje === undefined ||
    daño_bala === undefined ||
    costo_mejora === undefined
  ) {
    return res.status(400).json({ error: 'Missing one or more required fields' });
  }

  let connection;
  try {
    connection = await dbConnect();


    const [users] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE id_usuario = ?',
      [id_usuario]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id_usuario;

    const [sessions] = await connection.execute(
      'SELECT id_sesion FROM sesion WHERE id_usuario = ? AND termino_en IS NULL ORDER BY inicio_en DESC LIMIT 1',
      [userId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'No open session found' });
    }
    
    const [result] = await connection.execute(
      `UPDATE usuario 
       SET tokens = ?, puntaje = ?, daño_bala = ?, costo_mejora = ?
       WHERE id_usuario = ?`,
      [tokens, puntaje, daño_bala, costo_mejora, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sessionId = sessions[0].id_sesion;

    // Get the current time in UTC-6
    const date = new Date();
    const utcMinus6 = new Date(date.getTime() - 6 * 60 * 60 * 1000);
    const formattedDate = utcMinus6.toISOString().slice(0, 19).replace('T', ' '); // MySQL DATETIME format

    await connection.execute(
      'UPDATE sesion SET termino_en = ? WHERE id_sesion = ?',
      [formattedDate, sessionId]
    );
    
    console.log(`El usuario, ${id_usuario}, finalizó sesión a las ${formattedDate} (UTC-6).`);
    res.status(200).json({ message: 'Session ended successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.end();
  }
});

// Servicio para registrar que un jugador comienza un curso
app.post('/curso/start', async (req, res) => {
  const { id_curso, nombre } = req.body;

  if (!id_curso || !nombre) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  let connection;
  try {
    connection = await dbConnect();

    // Find the user ID from the name (assuming `nombre` is unique)
    const [userRows] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE username = ?',
      [nombre]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const id_usuario = userRows[0].id_usuario;

     // Get current time in UTC-6
    const now = new Date();
    const utcMinus6 = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const formattedDate = utcMinus6.toISOString().slice(0, 19).replace('T', ' '); // MySQL format
    
    await connection.execute(
      'INSERT INTO usuario_curso (id_usuario, id_curso, fecha_inscripcion) VALUES (?, ?, ?)',
      [id_usuario, id_curso, formattedDate]
    );

    res.status(201).json({ message: 'Course started successfully' });

  } catch (error) {
    console.error('Error starting course:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.end();
  }
});

// Servicio para registrar que un jugador finaliza un curso
app.post('/curso/end', async (req, res) => {
  const { id_curso, nombre } = req.body;

  if (!id_curso || !nombre) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  let connection;
  try {
    connection = await dbConnect();

    // Get user ID from name
    const [userRows] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE username = ?',
      [nombre]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const id_usuario = userRows[0].id_usuario;

    // Get current time in UTC-6
    const now = new Date();
    const utcMinus6 = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const formattedDate = utcMinus6.toISOString().slice(0, 19).replace('T', ' '); // MySQL format

    // Update the end date and optionally set progress to 100%
    const [result] = await connection.execute(
      `UPDATE usuario_curso 
       SET fecha_terminacion = ?, progreso = 100
       WHERE id_usuario = ? AND id_curso = ?`,
      [formattedDate, id_usuario, id_curso]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Enrollment not found for this user and course' });
    }

    res.status(200).json({ message: 'Course marked as completed successfully' });

  } catch (error) {
    console.error('Error ending course:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.end();
  }
});

// Servicio para registrar que un jugador empieza un nivel
app.post('/nivel/start', async (req, res) => {
  const { id_nivel, username } = req.body;

  if (!id_nivel || !username) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  let connection;
  try {
    connection = await dbConnect();

    // Get user ID from username
    const [userRows] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE username = ?',
      [username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const id_usuario = userRows[0].id_usuario;

    // Get UTC-6 time
    const now = new Date();
    const utcMinus6 = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const formattedDate = utcMinus6.toISOString().slice(0, 19).replace('T', ' ');

    // Insert level start into usuario_nivel
    await connection.execute(
      'INSERT INTO usuario_nivel (id_usuario, id_nivel, fecha_inicio, avance) VALUES (?, ?, ?, 0)',
      [id_usuario, id_nivel, formattedDate]
    );

    res.status(201).json({ message: 'Level started successfully' });

  } catch (error) {
    console.error('Error starting level:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.end();
  }
});

// Servicio para registrar que un jugador termina un nivel
app.post('/nivel/end', async (req, res) => {
  const { id_nivel, username } = req.body;

  if (!id_nivel || !username) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  let connection;
  try {
    connection = await dbConnect();

    // Get user ID
    const [userRows] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE username = ?',
      [username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const id_usuario = userRows[0].id_usuario;

    // Get UTC-6 time
    const now = new Date();
    const utcMinus6 = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const formattedDate = utcMinus6.toISOString().slice(0, 19).replace('T', ' ');

    // Update level end in usuario_nivel
    const [result] = await connection.execute(
      `UPDATE usuario_nivel 
       SET fecha_fin = ?, avance = 100 
       WHERE id_usuario = ? AND id_nivel = ?`,
      [formattedDate, id_usuario, id_nivel]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Level progress not found for this user' });
    }

    res.status(200).json({ message: 'Level marked as completed successfully' });

  } catch (error) {
    console.error('Error ending level:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.end();
  }
});

// Servicio para obtener todas las preguntas de un nivel
import axios from 'axios';

const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyBkVYhAhv2fsKkmbc1XujG3e7oBytOr6Jo'; // 🔐 Replace with your real key

async function traducirGoogle(texto, targetLang = 'es') {
  const url = `https://translation.googleapis.com/language/translate/v2`;
  try {
    const response = await axios.post(url, null, {
      params: {
        key: GOOGLE_TRANSLATE_API_KEY,
        q: texto,
        target: targetLang,
        format: 'text'
      }
    });

    return response.data.data.translations[0].translatedText;
  } catch (err) {
    console.error('Translation API error:', err.message);
    return texto; // fallback to original text
  }
}

app.get('/unity/pregunta/:language', async (req, res) => {
  const id_pregunta = parseInt(req.query.id, 10);
  const language = req.params.language || 'en';

  if (isNaN(id_pregunta)) {
    return res.status(400).json({ error: 'Parámetro "id" inválido o faltante' });
  }

  let connection;

  try {
    connection = await dbConnect();

    const [preguntaRows] = await connection.execute(
      'SELECT id_pregunta, id_nivel, texto_pregunta, dificultad FROM pregunta WHERE id_pregunta = ?',
      [id_pregunta]
    );

    if (preguntaRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    const [opcionesRows] = await connection.execute(
      'SELECT id_opcion, id_pregunta, texto_opcion, es_correcta FROM opcion WHERE id_pregunta = ?',
      [id_pregunta]
    );

    await connection.end();

    let pregunta = preguntaRows[0];
    let opciones = opcionesRows.map(op => ({
      id_opcion: op.id_opcion,
      id_pregunta: op.id_pregunta,
      texto_opcion: op.texto_opcion,
      es_correcta: !!op.es_correcta
    }));

    // Translate if language is 'es'
    if (language === 'es') {
      console.log("Traduciendo...")
      pregunta.texto_pregunta = await traducirGoogle(pregunta.texto_pregunta, 'es');
      for (let i = 0; i < opciones.length; i++) {
        opciones[i].texto_opcion = await traducirGoogle(opciones[i].texto_opcion, 'es');
      }
    }

    res.json({ pregunta, opciones });

  } catch (error) {
    console.error('Error en /unity/pregunta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

  
// Servicio para responder la pregunta de un nivel: 
app.post('/unity/pregunta/contestar', async (req, res) => {
  const { id_usuario, id_pregunta, id_opcion, es_correcta, id_nivel } = req.body;

  if (!id_usuario || !id_pregunta || !id_opcion) {
    return res.status(402).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Verificar si la opción es correcta
    const [opcionRows] = await connection.execute(
      'SELECT es_correcta FROM opcion WHERE id_opcion = ? AND id_pregunta = ?',
      [id_opcion, id_pregunta]
    );

    if (opcionRows.length === 0) {
      await connection.rollback();
      await connection.end();
      return res.status(403).json({ error: 'Opción inválida para la pregunta' });
    }

    const es_correcta = opcionRows[0].es_correcta === 1;

    // Verificar si ya existe la misma combinación
    const [existingRows] = await connection.execute(
      `SELECT id_usuario_pregunta FROM usuario_pregunta
       WHERE id_usuario = ? AND id_pregunta = ? AND es_correcta = ?`,
      [id_usuario, id_pregunta, es_correcta]
    );

    if (existingRows.length > 0) {
      await connection.rollback();
      await connection.end();
      return res.status(200).json({
        message: 'La respuesta ya fue registrada anteriormente',
        es_correcta,
        id_usuario_pregunta: existingRows[0].id_usuario_pregunta
      });
    }

    // Insertar en usuario_pregunta
    const [result] = await connection.execute(
      `INSERT INTO usuario_pregunta (id_usuario, id_pregunta, es_correcta)
       VALUES (?, ?, ?)`,
      [id_usuario, id_pregunta, es_correcta]
    );

    const id_usuario_pregunta = result.insertId;

    // Insertar en usuario_pregunta_opcion
    await connection.execute(
      `INSERT INTO usuario_pregunta_opcion (id_usuario_pregunta, id_opcion)
       VALUES (?, ?)`,
      [id_usuario_pregunta, id_opcion]
    );

    // Verificar si es la primera pregunta respondida para el nivel
    const [preguntasNivel] = await connection.execute(
      `SELECT COUNT(*) AS total FROM usuario_pregunta up
       JOIN pregunta p ON up.id_pregunta = p.id_pregunta
       WHERE up.id_usuario = ? AND p.id_nivel = ?`,
      [id_usuario, id_nivel]
    );

    if (preguntasNivel[0].total === 1) {
      await connection.execute(
        `INSERT INTO usuario_nivel (id_usuario, id_nivel, fecha_inicio, avance)
         VALUES (?, ?, CONVERT_TZ(NOW(), '+00:00', '-06:00'), 0)`,
        [id_usuario, id_nivel]
      );
    }

    // Verificar si todas las preguntas del nivel han sido respondidas correctamente
    const [totalPreguntas] = await connection.execute(
      `SELECT COUNT(*) AS total FROM pregunta WHERE id_nivel = ?`,
      [id_nivel]
    );

    const [correctasUsuario] = await connection.execute(
      `SELECT COUNT(DISTINCT up.id_pregunta) AS correctas FROM usuario_pregunta up
       JOIN pregunta p ON up.id_pregunta = p.id_pregunta
       WHERE up.id_usuario = ? AND p.id_nivel = ? AND up.es_correcta = 1`,
      [id_usuario, id_nivel]
    );

    if (correctasUsuario[0].correctas === totalPreguntas[0].total) {
      await connection.execute(
        `UPDATE usuario_nivel
         SET fecha_fin = CONVERT_TZ(NOW(), '+00:00', '-06:00'), avance = 100
         WHERE id_usuario = ? AND id_nivel = ?`,
        [id_usuario, id_nivel]
      );
    }

    await connection.commit();
    await connection.end();

    console.log("Pregunta realizada", id_usuario, id_pregunta, id_opcion);

    return res.status(200).json({
      message: 'Respuesta guardada correctamente',
      es_correcta,
      id_usuario_pregunta
    });
  } catch (error) {
    console.error('Error en /unity/pregunta/contestar:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Servicio para guardar progreso
// Servicio para actualizar campos del usuario
app.post('/unity/guardar-progreso', async (req, res) => {
  const { id_usuario, tokens, puntaje, daño_bala, costo_mejora } = req.body;
  
  console.log("Se cambio el progreso, daño_bala y costo_mejora: ", daño_bala, costo_mejora); 

  if (
    id_usuario === undefined ||
    tokens === undefined ||
    puntaje === undefined ||
    daño_bala === undefined ||
    costo_mejora === undefined
  ) {
    return res.status(400).json({ error: 'Missing one or more required fields' });
  }

  let connection;
  try {
    connection = await dbConnect();

    const [result] = await connection.execute(
      `UPDATE usuario 
       SET tokens = ?, puntaje = ?, daño_bala = ?, costo_mejora = ?
       WHERE id_usuario = ?`,
      [tokens, puntaje, daño_bala, costo_mejora, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User data updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.end();
  }
});


// app.get('/', async (req, res) => {

//   let connection;
//   try {
//     connection = await dbConnect();


//     res.status(200).json({ message: 'Prueba de conexión exitosa' });
//     console.log(`Se realizo una prueba de conexion. `);


//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Database error' });
//   } finally {
//     if (connection) await connection.end();
//   }
// });

// Servicio de login para página web
app.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const connection = await dbConnect();
    const [rows] = await connection.execute(
      'SELECT * FROM usuario WHERE correo = ?',
      [correo]
    );

    const user = rows[0];
    if (!user) {
      console.log("No hay usuarios. "); 
      res.redirect('/admin');
      return; 
    }
    
    
    bcrypt.hash(user.contrasena, 10, function(err, hash) {
      if (err) throw err;
      user.contrasena = hash;
    });
        
    // const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);
    // if (!passwordMatch) {
    if (contrasena.trim() != user.contrasena.trim()) {
      console.log(contrasena, user.contrasena); 
      res.redirect('/admin');
      return; 
    }

    req.session.user = {
      id: user.id_usuario,
      correo: user.correo,
      is_Admin: user.es_admin === 1,
    };

    res.redirect('/dashboard'); // or wherever your homepage is
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Servicio de logout para página web
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin');
  });
});

// Funciones para validar credenciales en páginas que lo requieran
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/admin');
}
function ensureAdmin(req, res, next) {
  if (req.session.user?.is_Admin) {
    return next();
  }
  res.redirect('/admin');
  // res.status(403).send('Access denied');
}

// Página de login
app.get('/admin', (req, res) => {
  res.render('admin'); 
}); 

// Página de inicio
app.get('/', ensureAdmin, (req, res) => {
  res.render('dashboard', { showNavbar: true });
});

// Página de usuarios
app.get('/users', ensureAdmin, async (req, res) => {
  const connection = await dbConnect();
  const [rows] = await connection.execute('SELECT * FROM usuario');
  res.render('users', { showNavbar: true , usuarios: rows});
});

// Página de usuarios individuales
app.get('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const connection = await dbConnect();
    
    // Información de usuario
    const [rows] = await connection.execute(
      'SELECT * FROM usuario WHERE id_usuario = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const user = rows[0];
    
    // Información de sesiones
    const [sessionRows] = await connection.execute(
      `SELECT inicio_en, termino_en FROM sesion WHERE id_usuario = ? AND termino_en IS NOT NULL`,
      [userId]
    );
    
    const sessionData = sessionRows.map(row => {
      const start = new Date(row.inicio_en);
      const end = new Date(row.termino_en);
      const durationMinutes = (end - start) / 60000; // milliseconds to minutes
    
      return {
        x: start,
        y: 1, // static y
        duration: durationMinutes
      };
    });
    
    // Información de cursos
    const [courseRows] = await connection.execute(
      `SELECT c.id_curso, c.nombre, c.descripcion, c.estado, c.dificultad, uc.fecha_inscripcion
       FROM curso c
       JOIN usuario_curso uc ON c.id_curso = uc.id_curso
       WHERE uc.id_usuario = ?`,
      [userId]
    );
    
    // Información de niveles
    const [levelData] = await connection.execute(
      `SELECT 
         c.id_curso,
         n.id_nivel,
         n.titulo,
         un.fecha_inicio,
         un.fecha_fin,
         un.avance,
         SUM(CASE WHEN up.es_correcta = 1 THEN 1 ELSE 0 END) AS correctas,
         SUM(CASE WHEN up.es_correcta = 0 THEN 1 ELSE 0 END) AS incorrectas
       FROM usuario_nivel un
       JOIN nivel n ON n.id_nivel = un.id_nivel
       JOIN curso c ON c.id_curso = n.id_curso
       LEFT JOIN pregunta p ON p.id_nivel = n.id_nivel
       LEFT JOIN usuario_pregunta up ON up.id_pregunta = p.id_pregunta AND up.id_usuario = un.id_usuario
       WHERE un.id_usuario = ?
       GROUP BY n.id_nivel`,
      [userId]
    );
    
    // Información de preguntas
    const [questionRows] = await connection.execute(
      `SELECT 
         n.id_nivel,
         p.id_pregunta,
         p.texto_pregunta,
         up.es_correcta
       FROM usuario_nivel un
       JOIN nivel n ON n.id_nivel = un.id_nivel
       JOIN pregunta p ON p.id_nivel = n.id_nivel
       LEFT JOIN usuario_pregunta up 
         ON up.id_pregunta = p.id_pregunta AND up.id_usuario = un.id_usuario
       WHERE un.id_usuario = ?`,
      [userId]
    );
    
    // Organize per level
    const questionsByLevel = {};
    questionRows.forEach(q => {
      if (!questionsByLevel[q.id_nivel]) questionsByLevel[q.id_nivel] = [];
      questionsByLevel[q.id_nivel].push(q);
    });
        
    res.render('user', { showNavbar:true, user, sessionData, courses: courseRows, levelsByCourse: levelData, questionsByLevel });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

// Página de cursos
app.get('/education', ensureAdmin, async (req, res) => {
  const connection = await dbConnect();

  try {
    // Step 1: Get all cursos
    const [cursosRows] = await connection.execute(`SELECT * FROM curso`);

    // Step 2: Get total users (once)
    const [[{ total: usuariosTotales }]] = await connection.execute('SELECT COUNT(*) AS total FROM usuario');

    // Step 3: Get enrolled users per course (once)
    const [inscritosPorCursoRows] = await connection.execute(`
      SELECT id_curso, COUNT(DISTINCT id_usuario) AS inscritos
      FROM usuario_curso
      GROUP BY id_curso
    `);

    const inscritosMap = new Map(inscritosPorCursoRows.map(row => [row.id_curso, row.inscritos]));

    // Step 4: Build full cursos data
    for (const curso of cursosRows) {
      // Categorías
      const [categorias] = await connection.execute(
        `SELECT c.nombre FROM categoria c
         JOIN curso_categoria cc ON cc.id_categoria = c.id_categoria
         WHERE cc.id_curso = ?`,
        [curso.id_curso]
      );
      curso.categorias = categorias.map(cat => cat.nombre);

      // Niveles
      const [niveles] = await connection.execute(
        `SELECT * FROM nivel WHERE id_curso = ? ORDER BY orden ASC`,
        [curso.id_curso]
      );

      for (const nivel of niveles) {
        const [[{total: jugadoresNivel}]] = await connection.execute(
          `SELECT COUNT(*) AS total FROM usuario_nivel WHERE id_nivel = ?`, 
          [nivel.id_nivel]
        );
        
        const [preguntas] = await connection.execute(
          `SELECT * FROM pregunta WHERE id_nivel = ?`,
          [nivel.id_nivel]
        );

        for (const pregunta of preguntas) {
          const [opciones] = await connection.execute(
            `SELECT * FROM opcion WHERE id_pregunta = ?`,
            [pregunta.id_pregunta]
          );
          pregunta.opciones = opciones;
        }
        nivel.jugadoresNivel = jugadoresNivel; 
        nivel.preguntas = preguntas;
      }

      curso.niveles = niveles;

      // Número de usuarios inscritos en este curso
      curso.usuariosInscritos = inscritosMap.get(curso.id_curso) || 0;
    }


    // Render view
    res.render('education', {
      cursos: cursosRows,
      usuariosTotales,
      showNavbar: true
    });

  } catch (error) {
    console.error('Error fetching course data:', error);
    res.status(500).send('Error loading course data');
  } finally {
    await connection.end();
  }
});

// Página de dashboard
app.get('/dashboard', ensureAdmin, async (req, res) => {
  const connection = await dbConnect();
  try {
    const [rows] = await connection.execute(`
      SELECT
        (SELECT COUNT(*) FROM sesion WHERE termino_en IS NULL) AS jugadores_activos,
        (SELECT AVG(TIMESTAMPDIFF(MINUTE, inicio_en, termino_en)) FROM sesion WHERE termino_en IS NOT NULL) AS promedio_minutos_jugados,
        (SELECT COUNT(*) FROM usuario_pregunta WHERE DATE(fecha_respuesta) = CURDATE() AND es_correcta = TRUE) AS preguntas_correctas,
        (SELECT COUNT(*) FROM usuario_pregunta WHERE DATE(fecha_respuesta) = CURDATE()) AS preguntas_num; 
    `);

    const { jugadores_activos, promedio_minutos_jugados, preguntas_correctas, preguntas_num } = rows[0];
    

    // Format avg minutes into HH:MM
    const minutos = Math.floor(promedio_minutos_jugados || 0);
    const horas = Math.floor(minutos / 60);
    const minutos_restantes = minutos % 60;
    const promedio_formateado = `${horas}h ${minutos_restantes}min`;
    
    const [engagement] = await connection.execute(`
      SELECT u.pais, SUM(TIMESTAMPDIFF(MINUTE, s.inicio_en, s.termino_en)) AS minutos_jugados
      FROM sesion s
      JOIN usuario u ON s.id_usuario = u.id_usuario
      WHERE s.termino_en IS NOT NULL
      GROUP BY u.pais
      ORDER BY minutos_jugados DESC
      LIMIT 10;
    `);
    
    const paises = engagement.map(row => row.pais);
    const minutosPorPais = engagement.map(row => row.minutos_jugados);
    
    const [sesiones] = await connection.execute(`
      SELECT inicio_en FROM sesion WHERE inicio_en IS NOT NULL;
      `);

    // Bucketize into day of week (0–6) and hour of day (0–23)
    const heatmapData = Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (_, hour) => ({
        x: hour,
        y: day,
        v: 0
      }))
    );
    
    // Fill the matrix
    for (const { inicio_en } of sesiones) {
      const date = new Date(inicio_en);
      const day = date.getDay();      // 0 = Sunday
      const hour = date.getHours();   // 0–23
      heatmapData[day][hour].v += 1;
    }
    
    const heatmapFlat = heatmapData.flat();    
    
    const [ranking] = await connection.execute(`
      SELECT username, tokens
      FROM usuario
      ORDER BY tokens DESC
      LIMIT 10;
    `);
    
    const [puntajeRanking] = await connection.execute(`
      SELECT username, puntaje
      FROM usuario
      ORDER BY puntaje DESC
      LIMIT 10;
    `);
    
    res.render('dashboard', {
      showNavbar: true, 
      activos: jugadores_activos,
      promedio: promedio_formateado,
      correctas: preguntas_correctas,
      nump: preguntas_num, 
      paises,
      minutosPorPais, 
      heatmap: heatmapFlat, 
      ranking, 
      puntajeRanking
    });
  } catch (error) {
    res.status(500).send('Error fetching active players');
  }
});

// Página de respaldo de base de datos
app.use('/backup', backupRouter);
app.get('/download', ensureAdmin, (req, res) => {
  res.render('backup', { showNavbar: true });
});

// Página de recurso no encontrado (estatus 404)
app.use((req, res) => {
  const url = req.originalUrl;
  res.status(404).render('not_found', { url });
});

app.listen(port, () => {
  console.log(`Servidor esperando en: http://${ipAddress}:${port}`);
});
