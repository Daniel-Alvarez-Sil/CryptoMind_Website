/*----------------------------------------------------------
 *
 * Proyecto Integrador: CryptoMind
 * Fecha: 28 de marzo, 2025
 * Autor: A01800182 Daniel Alvarez Sil
 *
 *----------------------------------------------------------*/

import express from 'express';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch'; 

const app = express();
const port = process.env.PORT ?? 8080;
const ipAddress = process.env.C9_HOSTNAME ?? 'localhost';

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json()); 
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

async function dbConnect() {
  return await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: 'CryptoMindDB'
    });
}

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
      (username, correo, contrasena, nombre, nacimiento, pais, genero, tokens, puntaje, vidas) 
      VALUES (?, ?, ?, "nombre", ?, ?, ?, 0, 0, 3)
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
      'SELECT * FROM usuario WHERE correo = ? AND contrasena = ?',
      [emailDatos, passwordDatos]
    );

    if (rows.length > 0) {
      // Call /sesion/start internally
      await fetch(`http://${ipAddress}:${port}/sesion/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailDatos: emailDatos})
      });
      res.status(200).json({ message: 'Login successful' });
      console.log(`El usuario, ${emailDatos}, inicio sesión. `);
    } else {
      console.log(`El usuario, ${emailDatos}, esta intentando ingresar. `);
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
      'SELECT id_usuario FROM usuario WHERE username = ?',
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
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Missing username' });

  let connection;
  try {
    connection = await dbConnect();


    const [users] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE username = ?',
      [nombre]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id_usuario;

    const [sessions] = await connection.execute(
      'SELECT id_sesion FROM sesion WHERE id_usuario = ? AND termino_en IS NULL ORDER BY inicio_en ASC LIMIT 1',
      [userId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'No open session found' });
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

    res.status(200).json({ message: 'Session ended successfully' });
    console.log(`El usuario, ${nombre}, finalizó sesión a las ${formattedDate} (UTC-6).`);

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

// Página de inicio
app.get('/', (req, res) => {
  res.render('home', { showNavbar: true });
});

// Página de usuarios
app.get('/users', async (req, res) => {
  const connection = await dbConnect();
  const [rows] = await connection.execute('SELECT * FROM usuario');
  res.render('users', { showNavbar: true , usuarios: rows});
});

// Página de cursos
app.get('/education', async (req, res) => {
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
app.get('/dashboard', async (req, res) => {
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

// Página de recurso no encontrado (estatus 404)
app.use((req, res) => {
  const url = req.originalUrl;
  res.status(404).render('not_found', { url });
});

app.listen(port, () => {
  console.log(`Servidor esperando en: http://${ipAddress}:${port}`);
});
