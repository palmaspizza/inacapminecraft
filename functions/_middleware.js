// Cloudflare Pages Function — se ejecuta automáticamente en el edge
// para TODAS las rutas de tu sitio (por eso se llama _middleware.js
// y vive en la carpeta /functions en la raíz del repositorio).
//
// Reescribe las etiquetas Open Graph con el estado real del servidor,
// pero SOLO para bots de redes sociales (WhatsApp, Discord, Twitter, etc).
// Los visitantes normales reciben el sitio sin ningún cambio.

const STATUS_URL = "https://zazahousestudios-8b7ca-default-rtdb.firebaseio.com/serverStatus.json";

const BOT_PATTERN = /facebookexternalhit|twitterbot|discordbot|whatsapp|telegrambot|slackbot|linkedinbot|pinterest|embedly|quora link preview|vkshare|redditbot|skypeuripreview/i;

export async function onRequest(context) {
  const { request, next } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = BOT_PATTERN.test(userAgent);

  // Deja que Cloudflare Pages sirva el archivo normal primero
  const response = await next();

  const contentType = response.headers.get("content-type") || "";
  if (!isBot || !contentType.includes("text/html")) {
    return response;
  }

  let html = await response.text();

  let online = false;
  try {
    const statusRes = await fetch(STATUS_URL);
    const data = await statusRes.json();
    online = !!(data && data.online);
  } catch (err) {
    online = false; // si falla la consulta, asumimos apagado por seguridad
  }

  const title = online
    ? "Servidor Minecraft INACAP — ✅ Encendido ahora"
    : "Servidor Minecraft INACAP — 🟥 Apagado ahora";

  const description = online
    ? "El servidor está encendido ahora mismo. Entra y juega con la comunidad INACAP."
    : "El servidor está apagado en este momento. Cualquiera puede encenderlo desde esta página.";

  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${title}">`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${description}">`
  );

  const newHeaders = new Headers(response.headers);
  newHeaders.delete("content-length");

  return new Response(html, {
    status: response.status,
    headers: newHeaders
  });
}
