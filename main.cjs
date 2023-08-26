"use strict";
exports.__esModule = true;
var ws_1 = require("ws");
var wss = new ws_1.WebSocketServer({
    port: 3000,
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
    maxPayload: 2097152
});
var connections = [];
var games = {};
wss.on('connection', function (conn) {
    connections.push(conn);
    var gameId;
    conn.on("message", function (message) {
        var data;
        try {
            data = JSON.parse(message.toString());
        }
        catch (e) {
            conn.close();
            return;
        }
        switch (data["type"]) {
            case "createGame":
                gameId = Math.floor(Math.random() * 90000) + 10000;
                games[gameId] = { gameId: gameId, host: conn, connections: [conn], field: null};
                conn.send(JSON.stringify({ type: "createGame", success: true, id: gameId }));
                break;
            case "gameField":
                if (games[gameId].host != conn)
                    return conn.send(JSON.stringify({ type: "gameField", success: false, message: "Not host" }));
                games[gameId].field = data["field"];
                games[gameId].size = data["size"];
                conn.send(JSON.stringify({ type: "gameField", success: true }));
                break;
            case "joinGame":
                gameId = data["id"];
                if (!games.hasOwnProperty(gameId))
                    return conn.send(JSON.stringify({ type: "joinGame", success: false, message: "Invalid id" }));
                games[gameId].connections.push(conn);
                console.log({ type: "joinGame", success: true, field: games[gameId].field, size: games[gameId].size });
                conn.send(JSON.stringify({ type: "joinGame", success: true, field: games[gameId].field, size: games[gameId].size }));
                break;
            case "fieldClick":
                broadcastMessage(gameId, conn, JSON.stringify({ type: "fieldClick", num: data["num"] }));
                break;
            case "mouseMove":
                broadcastMessage(gameId, conn, JSON.stringify({ "type": "mouseMove", "x": data["x"], y: data["y"] }));
                break;
        }
    });
});
var broadcastMessage = function (gameId, sender, message) {
    games[gameId].connections.forEach(function (conn) {
        if (conn != sender)
            conn.send(message);
    });
};
