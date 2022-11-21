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
    '/dev/ttyUSB0',
    {baudRate: 9600}
)

xbee.write('INICIO GATEWAY');

xbee.pipe(parser);

xbee.on('open', ()=> {
    console.log('Puerto abierto');
})

var buffer = '';
var Accels = null;
xbee.on('data', (line) => {
    buffer += line;
    var bufferAux = buffer.split("//");
    //console.log('buffer: ' + buffer)
    
    if (bufferAux.length > 1) {
        Accels = bufferAux[0].split("/");
        buffer = buffer.replace(bufferAux[0] + "//", "");
        //console.log(Accels);
        io.emit('xbee:data', {
            x: Accels[0],
            y: Accels[1],
            z: Accels[2],
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