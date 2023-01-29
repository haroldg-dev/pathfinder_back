const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket)=> {
    console.log('nuevo socket conectado');
});

app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/index.html');
});

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const parser = new Readline();


const xbee = new SerialPort(
    'COM3',
    {baudRate: 9600}
)

xbee.write('INICIO GATEWAY');

xbee.pipe(parser);

xbee.on('open', ()=> {
    console.log('Puerto abierto');
})

var buffer = '';
var sensors = null;
xbee.on('data', (line) => {
    buffer += line;
    var bufferAux = buffer.split("//");
    //console.log('buffer: ' + buffer)
    
    if (bufferAux.length > 1) {
        sensors = bufferAux[0].split("/");
        buffer = buffer.replace(bufferAux[0] + "//", "");
        console.log(sensors);
        io.emit('xbee:data', {
            latitude: sensors[0],
            longitud: sensors[1],
            sat: sensors[2],
            vel: sensors[3],
            alt: sensors[4],
            dia: sensors[5],
            mes: sensors[6],
            hora: sensors[7],
            min: sensors[8],
            dirv: sensors[9],
            velv: sensors[10],
            tempInterna: sensors[11],
            presion: sensors[12],
            r1: sensors[13],
            r2: sensors[14],
            r3: sensors[15], 
            r4: sensors[16],
    });
    }
    
    //xbee.write('Recibido');
})

xbee.on('err', (err) => {
    console.log(err.message);
})

server.listen(4000, () => {
    console.log('Servidor en puerto', 4000);
})