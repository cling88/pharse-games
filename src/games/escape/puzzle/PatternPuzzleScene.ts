import BasePuzzleScene from "./BasePuzzleScene";


export default class PatternPuzzleScene extends BasePuzzleScene {

    private gridSizes = [3, 4, 5]; // 단계별 cell 개수 
    private stagePatterns = [3, 5, 7]; // 단계별 점등 수 
    // private stagePatterns = [1, 1, 1]; // 테스트용
    private currentGridSize = 3; // 현재 cell 개수 
    private cellSize = 0;
    private cells: Phaser.GameObjects.Rectangle[] = [];
    private currentStage = 1; // 총 3단계
    
    private patternSequence: number[] = []; // 현재 단계의 패턴
    private playerSequence: number[] = []; // 플레이어 입력 순서
    private isWaitingInput = false; 



    constructor() {
        super("PatternPuzzleScene");
    }

    protected setupPuzzle () {
        const {width, height} = this.scale;
        this.add.text(width / 2, 50, "패턴 기억 퍼즐", {
            fontSize: "32px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // 게임 초기화
        this.currentStage = 1;
        this.playerSequence = [];
        this.isWaitingInput = false;

        this.startStage(this.currentStage);

        // 나가기 버튼
        const backButton = this.add.text(width / 2, height - 50, "나가기", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({useHandCursor: true});

        backButton.on('pointerdown', () => {
            this.returnToRoom();
        })
    }

    private createGrid() {
        // 기존 셀들 제거 
        this.cells.forEach(cell => cell.destroy());
        this.cells = [];

        const {width, height} = this.scale;
        // 현재 단계 cell 크기 
        this.currentGridSize = this.gridSizes[this.currentStage - 1];
        // cell 크기 자동 계산 
        const maxGridSize = Math.min(width, height - 200) * 0.6;
        this.cellSize = Math.floor(maxGridSize / this.currentGridSize);

        const gridWidth = this.currentGridSize * this.cellSize;
        const gridHeight = this.currentGridSize * this.cellSize;
        const startX = width / 2 - gridWidth / 2;
        const startY = height / 2 - gridHeight / 2 + 50;

        for(let row = 0; row < this.currentGridSize; row++) {
            for(let col = 0; col < this.currentGridSize; col++) {
                const x = startX + col * this.cellSize;
                const y = startY + row * this.cellSize;
                const cellIndex = row * this.currentGridSize + col; 
                // 셀 생성
                const cell = this.add.rectangle(x + this.cellSize / 2, y + this.cellSize / 2,
                    this.cellSize, this.cellSize, 0x2a2a2a
                );
                cell.setStrokeStyle(2, 0x555555);
                cell.setInteractive({useHandCursor: true});
                cell.setData('index', cellIndex);
                cell.on('pointerdown', () => {
                    if(this.isWaitingInput) {
                        this.handleCellClick(cellIndex);
                    }
                });
                this.cells.push(cell);
            }
        }   
    }

    private startStage(stage: number) {
        const count = this.stagePatterns[stage - 1];
        // cell 재생성 
        this.createGrid();

        // 랜덤 패턴 생성
        const maxCellIndex = this.currentGridSize * this.currentGridSize - 1;
        this.patternSequence = [];
        for (let i=0; i<count; i++) {
            this.patternSequence.push(Phaser.Math.Between(0, maxCellIndex));
        }
        this.playerSequence=[];
        this.isWaitingInput = false;
        this.showPattern();
    }

    private showPattern() {
        let currentIndex = 0; 
        const showNextCell = () => {
            if(currentIndex >= this.patternSequence.length) {
                // 모든 패턴 표시 완료 
                this.hideAllCells();
                this.isWaitingInput = true;
                return;
            }
            const cellIndex = this.patternSequence[currentIndex];
            const cell = this.cells[cellIndex];
            // 점등
            cell.setFillStyle(0xffff00);
            // 1초후 다음 셀로 
            this.time.delayedCall(800, () => {
                cell.setFillStyle(0x2a2a2a);
                currentIndex++;
                showNextCell();
            });
        }
        showNextCell();
    }

    private hideAllCells() {
        this.cells.forEach(cell => {
            cell.setFillStyle(0x2a2a2a);
        })
    }

    private handleCellClick(cellIndex: number) {
        if(!this.isWaitingInput) return;
        this.playerSequence.push(cellIndex);
        const cell = this.cells[cellIndex];
        // 클릭 피드백
        const originalColor = cell.fillColor;
        cell.setFillStyle(0x888888);
        this.time.delayedCall(200, () => {
            cell.setFillStyle(originalColor);
        });
        // 입력이 완료되었는지 확인
        if(this.playerSequence.length === this.patternSequence.length) {
            this.checkPattern();
        }
    }

    private checkPattern() {
        this.isWaitingInput = false;
        // 패턴 비교
        const isCorrect = this.playerSequence.every((val, idx) => {
            return val === this.patternSequence[idx]
        })
        if(isCorrect) {
            if(this.currentStage >= 3) {
                this.onPuzzleSuccess(); // 모든단계 완료 
            } else {
                // 단계 성공 메시지 표시
                const {width, height} = this.scale;
                const successText = this.add.text(width / 2, height / 2, "Success!", {
                    fontSize: "64px",
                    color: "#00ff00",
                    fontStyle: "bold"
                }).setOrigin(0.5);
                
                // 다음단계로 이동 
                this.currentStage++;
                this.time.delayedCall(800, () => {
                    successText.destroy();
                    this.showCountdown();
                })
            }
        } else {
            // 실패 
            this.onPuzzleFailure();
        }
    }

    private showCountdown() {
        const {width, height} = this.scale;
        let countdown = 3;
        const countdownText = this.add.text(width / 2, height / 2, countdown.toString(), {
            fontSize: "72px",
            color: "#ffff00",
            fontStyle: "bold"
        }).setOrigin(0.5);

        const updateCountdown = () => {
            countdown--;
            if(countdown > 0) {
                countdownText.setText(countdown.toString());
                this.time.delayedCall(500, updateCountdown);
            } else {
                countdownText.setText("START");
                this.time.delayedCall(400, () => {
                    countdownText.destroy();
                    this.startStage(this.currentStage);
                })
            }
        }
        this.time.delayedCall(500, updateCountdown);
    }

    // @override
    protected onPuzzleFailure(): void {
        const {width, height} = this.scale;
        // 실패 메세지 
        this.add.text(width / 2, height / 2 - 100, "Fail!", {
            fontSize: "48px",
            color: "#ff0000",
            fontStyle: "bold"
        }).setOrigin(0.5);
        // 재시도 버튼
        const retryButton = this.add.text(width / 2-100, height / 2+100, "Retry", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({useHandCursor: true});
        retryButton.on('pointerdown', () => {
            this.scene.restart()
        });
        // 나가기 버튼
        const exitButton = this.add.text(width / 2+100, height / 2+100, "Exit", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({useHandCursor: true});
        exitButton.on('pointerdown', () => {
            this.returnToRoom();
        });
    }

    update() {
        // TODO: 게임 로직 업데이트
    }


    

    
}