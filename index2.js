const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  let i = 0;
  /* while (socket) {
    let lat = -12.073465 + i;
    let lon = -77.15923 + i;
    io.emit("xbee:gps", {
      latitude: lat,
      longitud: lon,
    });
    i = i + 0.000001;
    sleep(1000);
    console.log(io);
  } */
  console.log(socket.id);
  /* for (let i = 0; i < 1000; i = i + 0.000001) {
    let lat = -12.073465 + i;
    let lon = -77.15923 + i;
    socket.emit("xbee:gps", {
      latitude: lat,
      longitud: lon,
    });

    console.log(lat, " - ", lon);
    sleep(1000);
  } */
});
io.on("getData", (data) => {
  console.log(data);
});
app.get("/", (req, res, next) => {
  res.sendFile(__dirname + "/index.html");
});

let i = 0;
while (io.connected) {
  let lat = -12.073465 + i;
  let lon = -77.15923 + i;
  io.emit("xbee:gps", {
    latitude: lat,
    longitud: lon,
  });
  i = i + 0.000001;
  sleep(2000);
  console.log(io.connected);
}
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
if (io.connected) {
}

/* io.emit("xbee:space", {
  accelx: sensors[9],
  accely: sensors[10],
  brujula: sensors[11],
});
io.emit("xbee:date", {
  dia: sensors[5],
  mes: sensors[6],
  hora: sensors[7],
  min: sensors[8],
});
io.emit("xbee:sensores", {
  sat: sensors[2],
  velocidadCuerpo: sensors[3],
  altitud: sensors[4],
  presion: sensors[12],
  dirViento: sensors[13],
  velViento: sensors[14],
  tempInterna: sensors[15],
  humedad: sensors[16],
  //servo: sensors[17]
}); */

server.listen(4000, () => {
  console.log("Servidor en puerto", 4000);
});
