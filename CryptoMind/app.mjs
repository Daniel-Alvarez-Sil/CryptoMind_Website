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
import session from 'express-session';
import bcrypt from 'bcrypt';


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
      return res.status(401).send('Invalid credentials');
    }
    
    
    bcrypt.hash(user.contrasena, 10, function(err, hash) {
      if (err) throw err;
      user.contrasena = hash;
    });
        
    // const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);
    // if (!passwordMatch) {
    if (contrasena.trim() != user.contrasena.trim()) {
      console.log(contrasena, user.contrasena); 
      return res.status(401).send('Invalid credentials');
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
    res.redirect('/login');
  });
});

// Funciones para validar credenciales en páginas que lo requieran
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  if (req.session.user?.is_Admin) {
    return next();
  }
  res.redirect('/login');
  // res.status(403).send('Access denied');
}

// Página de login
app.get('/login', (req, res) => {
  res.render('login'); 
}); 

// Página de inicio
app.get('/', ensureAdmin, (req, res) => {
  res.render('home', { showNavbar: true });
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

// Página de recurso no encontrado (estatus 404)
app.use((req, res) => {
  const url = req.originalUrl;
  res.status(404).render('not_found', { url });
});

app.listen(port, () => {
  console.log(`Servidor esperando en: http://${ipAddress}:${port}`);
});
