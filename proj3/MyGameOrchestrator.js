class MyGameOrchestrator extends CGFobject {
    constructor(scene) {
        super(scene);
        this.board = new MyBoard(scene);
        this.pieces = [];
        this.tiles = [];
        this.movegames = [[]];
        this.currMove=[];
        this.theme = false;
        this.chainMoves = [];
        this.validChainMove = false;

        this.animator = null;

        this.boardState = [];

        this.request = null;

        this.selectedTile = null;

        // Deixar BaseA/BaseB + X como key ou alterar para as respetivas coordenadas?
        for(let i=1; i<=6; i++) {
            var currTile = new MyTile(scene, 0, i);
            var key = 0 + '-' + i;
            //console.log(key);
            this.tiles[key] = currTile;
        }
        for(let i=1; i<=6; i++) {
            var currTile = new MyTile(scene, 7, i);
            var key = 7 + '-' + i;
            //console.log(key);
            this.tiles[key] = currTile;
        }

        for(let i=1; i<=6; i++) {
            for(let j=1; j<=6; j++) {
                var currTile = new MyTile(scene, i, j);
                var key = i + '-' + j;
                //console.log(key);
                this.tiles[key] = currTile;
            }
        }

        this.playerAturn = false;

        this.playerType = {
            'Human' : 0,
            'Machine' : 1
        };
        
        this.gameStates = {
            'Menu' : 0,
            'Next turn' : 1,
            'Select Piece' : 2,
            'Select Tile' : 3,
            'Chain Move' : 4,
            'Choice' : 5,
            'Animation' : 6,
            'Check Win' : 7,
            'Win' : 8,

            'Undo' : 9,
            'Pause' :10,
            'Boost' :11,
            'Reprogram' :12
        }

        this.themes = {
            'Scene' : "Scene",
            'Scene2' : "Scene2"
        }

        this.gameState = this.gameStates.Menu;
        this.playerA = this.playerType.Human;
        this.playerB = this.playerType.Human;
        this.totalSeconds;
        this.playerAScore = 0;
        this.playerBScore = 0;

        this.printState();
        this.boardSetup();
        this.initialboard = [];

        var timerVar = setInterval(this.countTimer, 1000);

        this.initBuffers();
    }

    orchestrate(){
    }

    printState(){
        console.log("currently in ", this.gameState);
    }

    start(playerA, playerB){
        this.playerA = playerA;
        this.playerB = playerB;
        this.boardSetup();
        this.gameState = this.gameStates["Select Piece"];
        this.playerAturn = true;
        ping_server();
        this.printState();
    }

    update(t) {
        if(this.animator!=null) this.animator.currTime = t;
        if(this.animator==null) {this.animator = new MyAnimator(this.scene, this, t); console.log(t);}
        if(this.gameState == this.gameStates["Animation"]) {
            this.animator.update(t);
            if(this.animator.running==false) {
                this.animator.endAnimation();
                this.make_move();
            }
        }

    }
    display() {
        
        this.board.display();
        this.setupPickableGrid();
    }

    countTimer() {
        if(this.totalSeconds == null)
            this.totalSeconds = 1;
        this.totalSeconds++;
       //console.log(this.totalSeconds);
       document.getElementById("timer").innerHTML = "Timer: " + this.totalSeconds;
    }

    // tl;dr ID's (picking) das tiles das bases: 1,2,3,4,5,6 para jogador A e 71,72,73,74,75,76 para jogador B
    setupPickableGrid() {
        //setup player base tiles
        for(let i=0.5; i<6.5; i++) {
            this.scene.pushMatrix();
            // picking id only accepts numbers so player A base tiles will have this stupid ID with a single number 
            if(this.gameState ==  this.gameStates["Select Piece"] || this.gameState == this.gameStates["Select Tile"] || this.gameState == this.gameStates["Boost"] || this.gameState == this.gameStates["Reprogram"])
                this.scene.registerForPick(i+0.5, this.tiles['0-' + (i+0.5)]);
            this.scene.translate(i, 0.01, 0.5);
            this.tiles['0-' + (i+0.5)].display();
            this.scene.popMatrix();
        }
        for(let i=0.5; i<6.5; i++) {
            this.scene.pushMatrix();
            // picking id only accepts numbers so player A base tiles will have this stupid ID with a single number
            if(this.gameState ==  this.gameStates["Select Piece"] || this.gameState == this.gameStates["Select Tile"] || this.gameState == this.gameStates["Boost"] || this.gameState == this.gameStates["Reprogram"]) 
                this.scene.registerForPick(7*10 + i+0.5, this.tiles['7-' + (i+0.5)]);
            this.scene.translate(i, 0.01, 7.5);
            this.tiles['7-' + (i+0.5)].display();
            this.scene.popMatrix();
        }
        //setup playble tiles
        for(let i=1.5; i<7.5; i++) {
            for(let j=0.5; j<6.5; j++) {
                this.scene.pushMatrix();
                if(this.gameState ==  this.gameStates["Select Piece"] || this.gameState == this.gameStates["Select Tile"] || this.gameState == this.gameStates["Boost"] || this.gameState == this.gameStates["Reprogram"])
                    this.scene.registerForPick((i-0.5)*10 + j+0.5, this.tiles[(i-0.5) + '-' + (j+0.5)]);
                this.scene.translate(j, 0.01, i);
                this.tiles[(i-0.5) + '-' + (j+0.5)].display();
                this.scene.popMatrix(); 
            }
        }
    }
    
    boardSetup() {
        let piece;
        // Player A home-row
        piece = new MyPiece(this.scene,3);
        this.tiles['1-1'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,2);
        this.tiles['1-2'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,1);
        this.tiles['1-3'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,3);
        this.tiles['1-4'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,1);
        this.tiles['1-5'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,2);
        this.tiles['1-6'].setPiece(piece);
        // Player B home-row
        piece = new MyPiece(this.scene,1);
        this.tiles['6-1'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,3);
        this.tiles['6-2'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,2);
        this.tiles['6-3'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,2);
        this.tiles['6-4'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,3);
        this.tiles['6-5'].setPiece(piece);
        //
        piece = new MyPiece(this.scene,1);
        this.tiles['6-6'].setPiece(piece);

        //this.updateBoardState();
        //this.initialboard = this.boardState.slice();
        //console.log(this.initialboard);
    }

    undo(){
        this.currMove = [];
        this.loadBoardState();
        if (this.gameState == this.gameStates["Next turn"])
            this.gameState = this.gameStates["Select Piece"];
    }
    
    nextTurn(){
        this.currMove = [];
        if(this.movegames.length < 2) {
            console.log("Joga primeiro Boi, Ainda é a tua vez, conas.")
            return
        }
        this.playerAturn = !this.playerAturn;
        if(this.playerAturn && this.playerA == this.playerType.Human)
            this.scene.setCamera("playerA");
        else if(!this.playerAturn && this.playerB == this.playerType.Human)
            this.scene.setCamera("playerB");
        this.selectedTile = null;
        this.gameState = this.gameStates["Select Piece"];
        this.movegames = [[]];
    }

    clickHandler(obj, id) {
        console.log("CLICK HANDLER");
        if(obj != this.selectedTile && this.selectedTile == null && obj.getPiece()!=null && this.gameState != this.gameStates["Boost"] && this.gameState != this.gameStates["Reprogram"]) {
            this.selectedTile = obj;
            this.gameState = this.gameStates["Select Tile"];
            this.printState();
        }
        else if(obj != this.selectedTile &&this.selectedTile!=null && obj.getPiece()==null && this.gameState != this.gameStates["Boost"] && this.gameState != this.gameStates["Reprogram"]) {
            this.move(this.selectedTile.row, this.selectedTile.col, obj.row, obj.col);
            this.selectedTile = null;
        }
        else if(obj != this.selectedTile &&this.selectedTile!=null && obj.getPiece()!=null && this.gameState != this.gameStates["Boost"] && this.gameState != this.gameStates["Reprogram"]) {
            console.log("Press M for Rocket Boost or J for Reprogram Coordinates");
            this.chainMoves.push([this.selectedTile.row, this.selectedTile.col]);
            this.chainMoves.push([obj.row, obj.col]);
            this.gameState = this.gameStates.Choice;
        }
        else if(obj != this.selectedTile &&this.gameState == this.gameStates['Boost'] && obj.getPiece()!=null) {
            console.log("ADWWADWD2");
            let len = this.chainMoves.length;
            let P;
            if(this.playerAturn) P=1;
            else P=2;
            //if chain move is valid, pushes it to the array
            this.updateBoardState();
            let noPiece = false;
            valid_chain_move(this.selectedTile.row, this.selectedTile.col-1, this.chainMoves[len-1][0], this.chainMoves[len-1][1]-1, obj.row, obj.col-1, P, this.boardState, 2, data=>this.rocket_boost(data, this.selectedTile.row, this.selectedTile.col, obj.row, obj.col, noPiece));
        }
        else if(obj != this.selectedTile &&this.gameState == this.gameStates['Boost'] && obj.getPiece()==null) {
            console.log("merda")
            let P;
            if(this.playerAturn) P=1;
            else P=2;
            let len = this.chainMoves.length;
            //if chain move
            this.updateBoardState();
            let noPiece = true;
            console.log("this.chainMoves[len-1][0]", this.chainMoves[len-1][0]);
            console.log("this.chainMoves[len-1][1]-1", this.chainMoves[len-1][1]-1);
            valid_chain_move(this.selectedTile.row, this.selectedTile.col-1, this.chainMoves[len-1][0], this.chainMoves[len-1][1]-1, obj.row, obj.col-1, P, this.boardState, 2, data=>this.rocket_boost(data, this.selectedTile.row, this.selectedTile.col, obj.row, obj.col, noPiece));
        }
        else if(obj != this.selectedTile &&this.gameState == this.gameStates['Reprogram'] && obj.getPiece()==null) {
            let P;
            if(this.playerAturn) P=1;
            else P=2;
            let len = this.chainMoves.length;
            this.updateBoardState();
            valid_chain_move(this.selectedTile.row, this.selectedTile.col-1, this.chainMoves[len-1][0], this.chainMoves[len-1][1]-1, obj.row, obj.col-1, P, this.boardState, 1, data=>this.reprogram_coordinates(data, this.selectedTile.row, this.selectedTile.col, this.chainMoves[len-1][0], this.chainMoves[len-1][1], obj.row, obj.col));
        }
    }

    //TODO: AND CHECK IF THEY HAVE A PIECE
    checkWin(){
        this.updateBoardState();
        if(this.playerAturn) end_game_A(this.boardState, data=>this.game_over("a",data));
        else end_game_B(this.boardState, data=>this.game_over("b",data));
    }

    game_over(player,data) {
        if(data.target.response==1) {
            console.log("GAME OVER BOYS");
            this.updateScore(player);
        } else this.movegames.pop();
    }

    updateScore(player){
        if(player == "a")
            document.getElementById("playerAScore").innerHTML = "Player A: " + ++this.playerAScore;
        else
            document.getElementById("playerBScore").innerHTML = "Player B: " + ++this.playerBScore;
    }

    chooseBoost(){
        if(this.gameState == this.gameStates.Choice)
            this.gameState = this.gameStates.Boost; 
        this.printState();
    }
    chooseReprogram(){
        if(this.gameState == this.gameStates.Choice)
            this.gameState = this.gameStates.Reprogram;
        this.printState();
    }
    
    updateBoardState() {
        this.boardState = [];
        for(let i=0; i<=7; i++) {
            let currRow = [];
            for(let j=1; j<=6; j++) {
                switch(i){
                    case 0: if(this.tiles[i + '-' + j].getPiece()==null) currRow.push(-1);
                            else currRow.push(this.tiles[i + '-' + j].getPiece().level);
                            break;
                    case 7 :  if(this.tiles[i + '-' + j].getPiece()==null) currRow.push(-2);
                            else currRow.push(this.tiles[i + '-' + j].getPiece().level);
                             break;
                    default: if(this.tiles[i + '-' + j].getPiece()==null) currRow.push(0);
                            else currRow.push(this.tiles[i + '-' + j].getPiece().level);
                            break;
                }
            }
            this.boardState.push(currRow);
        }
        this.movegames.push(this.boardState);
        //console.log(this.boardState);
    }

    loadBoardState() {
        //console.log("Moves: ", this.movegames);
        if (this.movegames.length < 2)
            return;
        let previous = this.movegames.pop();
        //console.log(previous);
        
        for(let i=1; i<=6; i++) {           
            for(let j=0; j<=5; j++) {
                //console.log(i,j,previous[i][j]);
                //this.tiles[i + '-' + j].unsetPiece();
                if(previous[i][j] != 0){
                    switch(previous[i][j]){
                        case 1:
                            var piece = new MyPiece(this.scene, 1);
                            this.tiles[i + '-' + (j+1)].setPiece(piece);
                            break;
                        case 2:
                            var piece = new MyPiece(this.scene, 2);
                            this.tiles[i + '-' + (j+1)].setPiece(piece);
                            break;
                        case 3:
                            var piece = new MyPiece(this.scene, 3);
                            this.tiles[i + '-' + (j+1)].setPiece(piece);
                            break;     
                    }
                } else this.tiles[i + '-' + (j+1)].unsetPiece();
                    
            }
        }
    }

    move(x1, y1, x2, y2) {
        this.currMove = [];
        this.currMove.push(x1, y1, x2, y2);
        if(this.tiles[x1 + '-' + y1].getPiece() != null) {
            //console.log(this.boardState);
            //this.animator.calculate_animation(x1, y1, x2, y2);
            //this.animator.setAnimation(this.tiles[x1 + '-' + y1]);
            
            let player = 1;
            if (!this.playerAturn)  player = 2;
            // y's subtraidos por um pois no prolog as colunas começam a zero, mesmo na playable área
            this.updateBoardState();
            // checks if move is valid. make_move then handles prolog request result
            valid_move(x1, y1-1, x2, y2-1, player, this.boardState, data => this.make_move_animation(data, x1, y1, x2, y2));
        }
    }


    rocket_boost(data, x1, y1, x3, y3, noPiece) {
        console.log("AODNAWOINDAÇOUNBDALWJNDAWNDAWJIKDAWNLOKI", noPiece);
        if(data.target.response==1) {
            this.chainMoves.push([x3, x3]);

            if(noPiece) { // talvez depois criar make_chain_move_animation devido ao reprogram coordinates ou para meter o rocket boost explicito
                this.currMove = [];
                this.currMove.push(x1, y1, x3, y3);
                this.make_move_animation(data, x1, y1, x3, y3)
            }
        } else {
            this.selectedTile = null;
            this.currMove = [];
            this.gameState = this.gameStates["Select Piece"];
            this.printState();
        }
    }

    reprogram_coordinates(data, x1, y1, x2, y2, x3, y3) {
        if(data.target.response==1) {
            this.tiles[x3 + '-' + y3].setPiece(this.tiles[x2 + '-' + y2].getPiece());
            this.tiles[x2 + '-' + y2].setPiece(this.tiles[x1 + '-' + y1].getPiece());
            this.tiles[x1 + '-' + y1].unsetPiece();
            this.gameState = this.gameStates["Check Win"];
            this.checkWin();
            this.gameState = this.gameStates["Next turn"];
        } else {
            this.selectedTile = null;
            this.currMove = [];
            this.gameState = this.gameStates["Select Piece"];
            this.printState();
        }
    }

    make_move_animation(data, x1, y1, x2, y2) {
        
        //this.tiles[x1 + '-' + y1].getPiece().ongoingAnimation = true;
        if(data.target.response==1) {
            //var x1 = this.currMove[0];
            //var y1 = this.currMove[1];
            //var x2 = this.currMove[2];
            //var y2 = this.currMove[3];
            this.gameState = this.gameStates['Animation'];
            this.printState();
            // Fazer a animação 
            this.animator.calculate_animation(this.tiles[x1 + '-' + y1].getPiece(), x1, y1, x2, y2);
            this.animator.setAnimation(this.tiles[x1 + '-' + y1].getPiece());            
        } else {
            this.currMove = [];
            this.gameState = this.gameStates["Select Piece"];
            this.printState();
        }
    }

    make_move() {
        var x1 = this.currMove[0];
        var y1 = this.currMove[1];
        var x2 = this.currMove[2];
        var y2 = this.currMove[3];
        if(this.tiles[x1 + '-' + y1].getPiece() != null) {
            if(this.tiles[x2 + '-' + y2].getPiece() == null) {
                this.tiles[x2 + '-' + y2].setPiece(this.tiles[x1 + '-' + y1].getPiece());
                this.tiles[x1 + '-' + y1].unsetPiece();
            }
        }
        this.gameState = this.gameStates["Check Win"];
        this.printState();
        this.checkWin();
        this.gameState = this.gameStates["Next turn"];
        this.printState();
        this.animator = null;
    }
}