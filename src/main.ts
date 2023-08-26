import { MinesweptServer } from './MinesweptWebsocket';
import {v4 as uuidv4} from 'uuid';

const ms = new MinesweptServer(3000);

ms.ws.on('connection', (conn) => {
    const uuid = uuidv4();
    ms.connections[uuid] = conn;

    conn.send(JSON.stringify({connected: true, uuid}));
});