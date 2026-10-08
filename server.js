const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const PREMIUM_NOTES = {
  "Стебель": {
    title: "Стебель",
    content: `
      <h2>Стебель — углублённый конспект</h2>
      <p>Стебель — вегетативный орган растения, обеспечивающий опору и проведение веществ.</p>

      <h3>Основные функции</h3>
      <ul>
        <li>опора листьев, цветков и плодов;</li>
        <li>проведение воды и минеральных веществ;</li>
        <li>проведение органических веществ;</li>
        <li>размещение почек и листьев;</li>
        <li>запасание питательных веществ у некоторых растений.</li>
      </ul>

      <h3>Строение</h3>
      <p>
        Стебель включает покровные, основные и проводящие ткани.
        Проводящие ткани обеспечивают транспорт веществ между корнем и листьями.
      </p>

      <h3>Почки</h3>
      <p>
        На стебле находятся верхушечные и боковые почки.
        Из почек формируются новые побеги.
      </p>
    `
  }
};

const sessions = new Map();

function createSession(premium = false) {
  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token, {
    premium,
    createdAt: Date.now()
  });

  return token;
}

function getSession(req) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.substring(7);

  return sessions.get(token) || null;
}

const server = http.createServer((req, res) => {

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Главная страница
  if (req.url === "/" || req.url === "/index.html") {

    const file = path.join(__dirname, "study_portal.html");

    fs.readFile(file, (err, data) => {

      if (err) {
        res.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("study_portal.html not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });

      res.end(data);
    });

    return;
  }

  // Проверка сервера
  if (req.url === "/api/status") {

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({
      status: "ok",
      message: "StudyLab UZ server is running"
    }));

    return;
  }

  // Демо Premium-вход
  if (req.url === "/api/login?premium=1") {

    const token = createSession(true);

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({
      success: true,
      token: token,
      premium: true
    }));

    return;
  }

  // Проверка Premium
  if (req.url === "/api/premium") {

    const session = getSession(req);

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({
      premium: !!(session && session.premium)
    }));

    return;
  }

  // Premium-конспекты
  if (req.url.startsWith("/api/notes/")) {

    const session = getSession(req);

    if (!session || !session.premium) {

      res.writeHead(403, {
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(JSON.stringify({
        error: "Premium required",
        message: "Этот материал доступен только Premium."
      }));

      return;
    }

    const topic = decodeURIComponent(
      req.url.substring("/api/notes/".length)
    );

    const note = PREMIUM_NOTES[topic];

    if (!note) {

      res.writeHead(404, {
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(JSON.stringify({
        error: "Note not found"
      }));

      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({
      success: true,
      note: note
    }));

    return;
  }

  res.writeHead(404, {
    "Content-Type": "application/json; charset=utf-8"
  });

  res.end(JSON.stringify({
    error: "Not found"
  }));
});

server.listen(PORT, () => {
  console.log(
    `StudyLab UZ server started on port ${PORT}`
  );
});
