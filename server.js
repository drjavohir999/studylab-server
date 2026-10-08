const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/") {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "ok",
      message: "StudyLab UZ server is running"
    }));
    return;
  }

  if (req.url === "/api/premium") {
    res.writeHead(200);
    res.end(JSON.stringify({
      premium: false,
      message: "Premium проверяется сервером"
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({
    error: "Not found"
  }));
});

server.listen(PORT, () => {
  console.log(`StudyLab UZ server started on port ${PORT}`);
});
