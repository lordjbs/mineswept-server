interface IGame {
    gameId: number,
    gameMode: string,
    host: string,
    players: string[],
    state: GameState,
    field: any
}

class Game implements IGame {
    gameId: number
    gameMode: string
    host: string
    players: string[]
    state: GameState
    field: any

    constructor(gameId: number, gameMode: string, host: string) {
        this.gameId = gameId;
        this.gameMode = gameMode;
        this.host = host;
        this.players = [];
        this.state = GameState.LOBBY; // Games should always start in lobby
    } 
}

enum GameState {
    LOBBY, INGAME, ENDED
}

export {Game, GameState}