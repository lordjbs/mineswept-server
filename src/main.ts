import { MinesweptServer } from './types/MinesweptWebsocket';
import { Game, GameState } from './types/Game';
import { Player } from './types/Player';

const ms = new MinesweptServer(3000);

ms.ws.on('connection', (conn: any) => {

    const player = new Player(conn);
    ms.connections[player.uuid] = player;

    conn.send(JSON.stringify({connected: true, uuid: player.uuid}));

    conn.on("message", (message: MessageEvent) => {
        // Parse message
        let data: { [x: string]: any; type: any; };

        try {
          data = JSON.parse(message.toString());
        } catch (e) {
            conn.send(JSON.stringify({success: false, message: "Invalid format"}));
            return;
        }

        handleEvent(conn, player.uuid, message, data);
    });
});

const handleEvent = (conn: any, uuid: string, message: Event, data: { [key: string]: any } ) => {

    //TODO: Add checks for json fields. For testing/beta we just expect the client to send the proper fields.
    switch(data["type"]) {
        case "createGame":
            var gameId = ms.createGame(uuid, "default");
            conn.send(JSON.stringify({success: true, type: "createGame", gameId}));
            
            ms.connections[uuid].gameId = gameId;
            ms.games[gameId].players.push(uuid);

            break;
        
        case "startGame": 
            // First start is only host
            var player = ms.getPlayer(uuid); // No null check needed as player should exist
            if(player.gameId == null) return conn.send({success: false, type: "startGame", message: "Player is not in a game"});

            // Request a field 
            var game = ms.getGame(data["gameId"]);
            if(game.host != uuid) return conn.send({success: false, type: "startGame", message: "Player is not the host"});
            
            ms.getPlayer(game.host).conn.send(JSON.stringify({type: "request", requestType: "field"}));
            
            break;

        case "remakeGame":
            //TODO: make host only?
            var gameId = ms.getPlayer(uuid).gameId as number;
            var game = ms.getGame(gameId);

            conn.send(JSON.stringify({success: true, type: "remakeGame"}));
            ms.broadcastMessage(ms.getPlayer(uuid).gameId, uuid, JSON.stringify({type: "remakeGame"}));
            // Request a newly generated field from the host
            ms.getPlayer(game.host).conn.send(JSON.stringify({type: "request", requestType: "field"}));

            ms.games[gameId].state = GameState.INGAME;

            break;

        case "joinGame": 
            const gameToJoin = data["gameId"];
            //TODO: Add regex check for proper game id
            if(ms.getGame(gameToJoin) == null)  return conn.send(JSON.stringify({success: false, type: "joinGame", message: "Unknown game"}));

            ms.games[gameToJoin].players.push(uuid);
            ms.connections[uuid].gameId = gameToJoin;
            conn.send(JSON.stringify({success: true, type: "joinGame", field: ms.games[gameToJoin].field, progress: ms.games[gameToJoin].progress}));

            break;

        case "gameField":
            // Check if sender is a game host or even has a game
            var player = ms.getPlayer(uuid); // No null check needed as player should exist
            if(player.gameId == null || data["gameId"] == null) return conn.send(JSON.stringify({success: false, type: "gameField", message: "Player is not in a game"}));
            
            var game = ms.getGame(data["gameId"]);
            if(game.host != uuid) return conn.send(JSON.stringify({success: false, type: "gameField", message: "Player is not the host"}));
            
            ms.games[data["gameId"]].field = data["field"];
            conn.send(JSON.stringify({success: true, type: "gameField"}));

            if(data["remake"] == true)
                ms.broadcastMessage(ms.getPlayer(uuid).gameId, uuid, JSON.stringify({type: "remakeGame", field: data["field"]}));

            break;

        case "gameEnd":
            var gameId = (ms.getPlayer(uuid) as Player).gameId; //Null check? Player should exist
            ms.games[gameId].state = GameState.ENDED;

            // Add success or failure? Client handled?
            ms.broadcastMessage(ms.getPlayer(uuid).gameId, uuid, JSON.stringify({type: "gameEnd"}));

            break;
        
        case "fieldClick":
            var gameId = (ms.getPlayer(uuid) as Player).gameId; //Null check? Player should exist
            ms.broadcastMessage(gameId, uuid, JSON.stringify({type: "fieldClick", field: data["field"], uuid}));

            ms.games[gameId].progress.push(data["field"]);
            break;
        
        case "mouseMove":
            ms.broadcastMessage(ms.getPlayer(uuid).gameId, uuid, JSON.stringify({type: "mouseMove", x: data["x"], y: data["y"], uuid}));

            break;
    }
}