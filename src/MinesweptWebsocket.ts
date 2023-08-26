import { WebSocketServer } from 'ws';

class MinesweptServer extends WebSocketServer {
    ws: WebSocketServer;
    
    connections: Map<number, any>;
    games: Map<number, Game>;

    constructor(port: number) {
        super();
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
    }

    createGame(owner: string, gameMode: string): number {
        const gameId = Math.floor(Math.random() * 90000) + 10000;
        // Create game object
        const game: Game = {
            gameId, 
            gameMode,
            host: owner, 
            players: [],
            state: GameState.LOBBY
        }

        this.games[gameId] = game;

        return gameId;
    }

    broadcastMessage = (gameId: number, sender: string, message: string) => {
        this.games[gameId].players.forEach(uuid => {
            if(uuid != sender)
                this.connections[uuid].send(message);
        });
    }
    
}

type Game = {
    gameId: number,
    gameMode: string,
    host: string,
    players: string[],
    state: GameState
}

enum GameState {
    LOBBY, INGAME, ENDED
}

export {MinesweptServer, Game, GameState}