const express = require('express');
const axios = require('axios');
const querystring = require('querystring');

const app = express();
const port = 3000;

// 1. Credenciales de tu aplicación
const client_id = '206a7ab800e94c2a952f7a64c28db11d';       
const client_secret = '3f39840a78b54b488978136d901a65e6'; 
const redirect_uri = 'http://localhost:3000/callback'; 

app.use(express.static('public'));

// 2. Ruta para iniciar la autorización
app.get('/login', (req, res) => {
  // scopes: permisos que quieres pedir a Spotify
  const scopes = 'user-top-read'; // Permite leer tus Top Tracks

  // Construimos la URL de autorización
  const authUrl = 'https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    '&client_id=' + client_id +
    '&scope=' + encodeURIComponent(scopes) +
    '&redirect_uri=' + encodeURIComponent(redirect_uri);

  // Redirigimos al usuario a la página de login de Spotify
  res.redirect(authUrl);
});

// 3. Ruta de callback
app.get('/callback', async (req, res) => {
  // Spotify enviará un "code" como query param, ej: /callback?code=...
  const code = req.query.code || null;

  // Intercambiamos el "code" por un token de acceso
  try {
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        // Basic Auth con client_id y client_secret en base64
        'Authorization': 'Basic ' + Buffer
          .from(client_id + ':' + client_secret)
          .toString('base64')
      }
    });

    // Extraemos access_token y refresh_token
    const { access_token, refresh_token } = tokenResponse.data;

    // Redirigimos a la ruta principal, enviando los tokens en la query
    res.redirect('/?access_token=' + access_token + '&refresh_token=' + refresh_token);

  } catch (error) {
    console.error(error);
    res.send('Error al obtener el token');
  }
});

// 4. Ruta principal (página de inicio)
app.get('/', (req, res) => {
  // Si el usuario llegó con ?access_token=... en la URL, lo capturamos
  const access_token = req.query.access_token;
  if (!access_token) {
    // Si no hay token, le damos un enlace para iniciar sesión
    return res.send(`
      <h1>Spotify Auth Ejemplo</h1>
      <p>Haz clic en el enlace para iniciar sesión:</p>
      <a href="/login">Iniciar sesión con Spotify</a>
    `);
  }

  // Si sí hay token, lo mostramos en pantalla (en la vida real lo usaríamos en la app)
  res.send(`
    <h1>Autenticación exitosa</h1>
    <p>Access Token: ${access_token}</p>
    <p>Refresh Token: ${req.query.refresh_token}</p>
    <p>Ahora puedes usar este Access Token para obtener tus Top Tracks.</p>
  `);
});

// 5. Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

