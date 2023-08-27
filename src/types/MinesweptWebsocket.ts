import { WebSocketServer } from 'ws';
import { Game, GameState } from './Game'
import { Player } from './Player';

class MinesweptServer {
    ws: WebSocketServer;
    
    connections: { [key: string]: Player };
    games: { [key: number]: Game };

    constructor(port: number) {
        this.ws = new WebSocketServer({
            port,
            perMessageDeflate: {
              zlibDeflateOptions: {
                chunkSize: 1024,
                memLevel: 7,
                level: 3
              },
              zlibInflateOptions: {
                chunkSize: 10 * 1024
              },
              clientNoContextTakeover: true,
              serverNoContextTakeover: true,
              serverMaxWindowBits: 10,
              concurrencyLimit: 10,
              threshold: 1024
            },
            maxPayload: 2097152,
          });
        console.log("Websocket running on port 3000");

        this.connections = {};
        this.games = {};
    }

    createGame(owner: string, gameMode: string): number {
        const gameId = Math.floor(Math.random() * 90000) + 10000;
        // Create game object
        const game = new Game(gameId, gameMode, owner);

        this.games[gameId] = game;

        return gameId;
    }

    getGame(gameId: number): any {
        if(!this.games.hasOwnProperty(gameId)) return null;
        return this.games[gameId];
    }

    /**
     * 
     * @param uuid Player uuid
     * @returns Player class object, if not found it will return null
     */
    getPlayer(uuid: string): any {
        if(!this.connections.hasOwnProperty(uuid)) return null;
        return this.connections[uuid];
    }

    broadcastMessage = (gameId: number, sender: string, message: string) => {
        this.games[gameId].players.forEach((uuid: string) => {
            if(uuid != sender)
                this.connections[uuid].conn.send(message);
        });
    }
    
}

export {MinesweptServer}