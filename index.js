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

const xbee = new SerialPort("COM9", { baudRate: 57600 });

xbee.pipe(parser);
xbee.on("open", () => {
  console.log("Puerto abierto");
});

let trama = [
  {
    state: "M",
  },
  {
    control: {
      sail: 0,
      rudder: 0,
    },
  },
  {
    mision: [],
  },
];
io.on("connection", (socket) => {
  console.log("nuevo socket conectado");
  socket.on("xbee:mision", (data) => {
    console.log("mision: ",data);
    trama[2].mision = data;
    const aux = [...trama];
    aux.splice(1, 1);
    console.log(aux)
    xbee.write(stringify(aux));
  });
  socket.on("xbee:state", (data) => {
    console.log("state: ", data);
    trama[0].state = data;
    const aux = [...trama];
    data == "M" ? aux.splice(2, 1) : aux.splice(1, 1);
    console.log(aux)
    xbee.write(stringify(aux));
  });
  socket.on("xbee:control", (data) => {
    data = data.split("/");
    console.log(data);
    const sail = data[0];
    const rudder = data[1];
    console.log("control: ", sail, rudder);
    trama[1].control.sail = data[0];
    trama[1].control.rudder = data[1];
    const aux = [...trama];
    aux.splice(2, 1);
    console.log(aux)
    xbee.write(stringify(aux));
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
    if(sensors[0] = "CC") {
      console.log(sensors);
      io.emit("xbee:dataauto", {
        ditanciapnrecta: sensors[1],
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
        t: sensors[13]
      })
    }
    else {
      io.emit("xbee:datos", {
        lat: sensors[0],
        lng: sensors[1],
        sat: sensors[2],
        velocidadCuerpo: sensors[3],
        altitud: sensors[4],
        dia: sensors[5],
        mes: sensors[6],
        hora: sensors[7],
        min: sensors[8],
        accelx: sensors[9],
        accely: sensors[10],
        brujula: sensors[11],
        tempInterna: sensors[12],
        humedad: sensors[13],
        velViento: sensors[14],
        dirViento: sensors[15],
        // clutch01: sensors[16],
        // clutch02: sensors[17],
        // ctrlSale1: sensors[18],
        // ctrlSale2: sensors[19],
        // ctrlTimon1: sensor[20],
        // ctrlTimon2: sensors[21],
        // curso: sensors[22],
        // rumbo: sensors[23],
        // direccion: sensors[24]
      });
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
