const express = require("express");
const http = require("http");
const { stringify } = require("querystring");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const SerialPort = require("serialport");
const Readline = SerialPort.parsers.Readline;
const parser = new Readline();

const xbee = new SerialPort("COM3", { baudRate: 57600 });

xbee.pipe(parser);
xbee.on("open", () => {
  console.log("Puerto abierto");
});

let trama = {
  state: "M",
  control: {
    rudder: 0,
    sail1: 0,
    sail2: 0,
    clutch: 0,
  },
  mision: [],
};

io.on("connection", (socket) => {
  console.log("nuevo socket conectado");
  socket.on("xbee:mision", (data) => {
    trama.mision = data;
    const aux = { state: trama.state, mision: trama.mision };
    console.log("xbee:mision: ", aux);
    xbee.write(JSON.stringify(aux));
  });
  socket.on("xbee:state", (data) => {
    trama.state = data;
    console.log("xbee:state: ", data);
    //xbee.write(JSON.stringify(aux));
  });
  socket.on("xbee:control", (data) => {
    data = data.split("/");
    trama.control.rudder = data[0];
    trama.control.sail1 = data[1];
    trama.control.sail2 = data[2];
    trama.control.clutch = data[3];
    const aux = { state: trama.state, control: trama.control };
    console.log("xbee:control: ", aux);
    if (aux.state == "M" && data[0] != "0") {
      xbee.write(JSON.stringify(aux));
    }
  });
});

app.get("/", (req, res, next) => {
  res.sendFile(__dirname + "/index.html");
});

//const xbee = new SerialPort("/dev/ttyUSB0", { baudRate: 9600 });
//xbee.write("INICIO GATEWAY");

var buffer = "";
var sensors = null;

var alarmadb = [
  "LOW BATTERY 1",
  "LOW BATTERY 2",
  "STUCK RUDDER 1",
  "STUCK RUDDER 2",
  "STUCK SAIL 1",
  "STUCK SAIL 2",
  "GPS OFFLINE",
  "GIROSCOPIO OFFLINE",
  "VIENTO EN CONTRA",
  "VELOCIDAD DE VIENTO ELEVADO",
  "DESVIO DEL RUMBO",
  "INCLINACION ELEVADA",
  "FILTRACION DE AGUA",
  "VELERO TOO FAR",
  "FALLA COMUNICACION DE PLACA A RPI",
  "FALLA COMUNICACION XBEE",
];

// COMO ENVIO WAYPOINTS
// DISTACIA DE VELERO A ESTACION
// TRAMA DE CONTROL

xbee.on("data", (line) => {
  buffer += line;
  var bufferAux = buffer.split("//");
  //console.log('buffer: ' + buffer)
  if (bufferAux.length > 1) {
    sensors = bufferAux[0].split("/");
    buffer = buffer.replace(bufferAux[0] + "//", "");
    //console.log(sensors);
    if (sensors[0] == "CC") {
      //console.log(sensors);
      io.emit("xbee:dataauto", {
        distanciapnrecta: sensors[1],
        dhin: sensors[2],
        dh: sensors[3],
        as: sensors[4],
        rudderangle: sensors[5],
        rwh: sensors[6],
        h: sensors[7],
        p0: sensors[8],
        posact: sensors[9],
        distbefact: sensors[10],
        distanciap0w: sensors[11],
        waypoint: sensors[12],
        t: sensors[13],
      });
    } else if (sensors[0] == "GPS") {
      io.emit("xbee:gps", {
        lat: sensors[0],
        lng: sensors[1],
        sat: sensors[2],
        vel: sensors[3],
        alt: sensors[4],
        day: sensors[5],
        month: sensors[6],
      });
    } else if (sensors[0] == "ORD") {
      io.emit("xbee:ord", {
        m: sensors[0],
        timon: sensors[1],
        sail1: sensors[2],
        sail2: sensors[3],
        clutch: sensors[4],
      });
    } else {
      io.emit("xbee:datos", {
        mx: sensors[0],
        my: sensors[1],
        mz: sensors[2],
        accX: sensors[3],
        accY: sensors[4],
        accZ: sensors[5],
        gyrX: sensors[6],
        gyrY: sensors[7],
        gyrZ: sensors[8],
        temp: sensors[9],
        vel_wind: sensors[10],
        dir_wind: sensors[11],
        dt: sensors[12],
      });
      //console.log(sensors);
      // io.emit("xbee:datos", {
      //   lat: sensors[0],
      //   lng: sensors[1],
      //   sat: sensors[2],
      //   velocidadCuerpo: sensors[3],
      //   altitud: sensors[4],
      //   dia: sensors[5],
      //   mes: sensors[6],
      //   hora: sensors[7],
      //   min: sensors[8],
      //   accelx: sensors[9],
      //   accely: sensors[10],
      //   brujula: sensors[11],
      //   tempInterna: sensors[12],
      //   humedad: sensors[13],
      //   velViento: sensors[14],
      //   dirViento: sensors[15],
      //   posVela: sensors[16],
      //   bateria: sensors[17],
      //   paneles: sensors[18],
      //   // clutch01: sensors[16],
      //   // clutch02: sensors[17],
      //   // ctrlSale1: sensors[18],
      //   // ctrlSale2: sensors[19],
      //   // ctrlTimon1: sensor[20],
      //   // ctrlTimon2: sensors[21],
      //   // curso: sensors[22],
      //   // rumbo: sensors[23],
      //   // direccion: sensors[24]
      // });
    }
  }
  //xbee.write('Recibido');
});

xbee.on("err", (err) => {
  console.log(err.message);
});

server.listen(4000, () => {
  console.log("Servidor en puerto", 4000);
});
