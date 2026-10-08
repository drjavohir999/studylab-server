const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = __dirname;

// ВАЖНО:
// Premium-конспекты НЕ должны находиться внутри study_portal.html.
// Они хранятся здесь и выдаются сервером только Premium-пользователю.
const PREMIUM_NOTES = {
  "Стебель": {
    title: "Стебель",
    content: `
      <h3>Стебель — углублённый конспект</h3>

      <p>
        Стебель — вегетативный орган растения, обеспечивающий
        связь между корнем и листьями, а также проведение воды,
        минеральных и органических веществ.
      </p>

      <h4>Основные функции</h4>
      <ul>
        <li>опора надземных органов растения;</li>
        <li>проведение веществ;</li>
        <li>размещение листьев и почек;</li>
        <li>у некоторых растений — запасание питательных веществ.</li>
      </ul>

      <h4>Внутреннее строение</h4>
      <p>
        В зависимости от типа растения стебель имеет покровные,
        основные и проводящие ткани. Внутри располагаются проводящие
        элементы, обеспечивающие транспорт веществ.
      </p>

      <h4>Почки</h4>
      <p>
        На стебле располагаются верхушечные и боковые почки.
        Из почек могут развиваться новые побеги.
      </p>
    `
  }
};

// ----------------------------------------------------------------
// Простая демонстрационная авторизация
// ----------------------------------------------------------------

const sessions = new Map();

/*
  Для теста можно открыть:

  /api/login?premium=1

  Сервер создаст тестовую Premium-сессию.

  В дальнейшем вместо этого будет настоящая регистрация
  + база данных + проверка оплаты.
*/

function createSession(premium = false) {
  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token, {
    premium,
    createdAt: Date.now()
  });

  return token;
}

function getToken(req) {
  const auth = req.headers.authorization;

  if (!auth) return null;

  if (!auth.startsWith("Bearer ")) return null;

  return auth.substring(7);
}

function getSession(req) {
  const token = getToken(req);

  if (!token) return null;

  return sessions.get(token) || null;
}

// ----------------------------------------------------------------
// HTTP SERVER
// ----------------------------------------------------------------

const server = http.createServer((req, res) => {

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // --------------------------------------------------------------
  // Главная
  // --------------------------------------------------------------

  if (req.url === "/") {

    res.writeHead(200);

    res.end(JSON.stringify({
      status: "ok",
      message: "StudyLab UZ server is running"
    }));

    return;
  }

  // --------------------------------------------------------------
  // Тестовый Premium login
  // --------------------------------------------------------------

  if (req.url === "/api/login?premium=1") {

    const token = createSession(true);

    res.writeHead(200);

    res.end(JSON.stringify({
      success: true,
      token,
      premium: true
    }));

    return;
  }

  // --------------------------------------------------------------
  // Проверка Premium
  // --------------------------------------------------------------

  if (req.url === "/api/premium") {

    const session = getSession(req);

    res.writeHead(200);

    res.end(JSON.stringify({
      premium: !!(session && session.premium)
    }));

    return;
  }

  // --------------------------------------------------------------
  // Получение Premium-конспекта
  // --------------------------------------------------------------

  if (req.url.startsWith("/api/notes/")) {

    const session = getSession(req);

    // НЕТ PREMIUM → НЕТ КОНСПЕКТА
    if (!session || !session.premium) {

      res.writeHead(403);

      res.end(JSON.stringify({
        error: "Premium required",
        message: "Этот конспект доступен только Premium-пользователям."
      }));

      return;
    }

    const topic = decodeURIComponent(
      req.url.substring("/api/notes/".length)
    );

    const note = PREMIUM_NOTES[topic];

    if (!note) {

      res.writeHead(404);

      res.end(JSON.stringify({
        error: "Note not found"
      }));

      return;
    }

    res.writeHead(200);

    res.end(JSON.stringify({
      success: true,
      note
    }));

    return;
  }

  // --------------------------------------------------------------
  // 404
  // --------------------------------------------------------------

  res.writeHead(404);

  res.end(JSON.stringify({
    error: "Not found"
  }));
});

server.listen(PORT, () => {
  console.log(
    `StudyLab UZ server started on port ${PORT}`
  );
});
