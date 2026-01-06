
import BasePuzzleScene from "./BasePuzzleScene";
import Phaser from "phaser";


type CardShape = "rectangle" | "circle" | "triangle" | "star";
type CardColor = number; // 0xFF0000

interface CardData {
    shape: CardShape;
    color: CardColor;
    cardIndex: number;
}

interface Card {
    container: Phaser.GameObjects.Container;
    backFace: Phaser.GameObjects.Rectangle;
    frontFace: Phaser.GameObjects.Graphics;
    data: CardData;
    isFlipped: boolean;
    isMatched: boolean;
    cardId: number; // 고유 ID
}


export default class SequencePuzzleScene extends BasePuzzleScene {

    private gridConfigs = [
        { rows: 3, cols: 2, pairs: 3 }, // 1단계: 3×2, 3쌍
        { rows: 4, cols: 2, pairs: 4 }, // 2단계: 4×2, 4쌍
        { rows: 5, cols: 2, pairs: 5 }  // 3단계: 5×2, 5쌍
    ]
    private timeLimits = [8, 7, 10];

    private currentStage = 1; 
    private cards: Card[] = [];
    private flippedCards: Card[] = [];
    private isComparing = false;
    private isGameActive = false; 
    private timeLeft = 0; 
    private timeBar!: Phaser.GameObjects.Rectangle;
    private timeBarBg!: Phaser.GameObjects.Rectangle;
    private backButton!: Phaser.GameObjects.Text;

    private shapes: CardShape[] = ["rectangle", "circle", "triangle", 'star'];
    private colors: CardColor[] = [
        0xff0000, // 빨강
        0x0000ff, // 파랑
        0x00ff00, // 초록
        0xffff00, // 노랑
        0xff00ff, // 보라
        0xff8800  // 주황
    ]


    constructor() {
        super("SequencePuzzleScene");
    }

    protected setupPuzzle () {
        const {width, height} = this.scale;
        this.add.text(width / 2, 50, "카드 뒤집기 퍼즐", {
            fontSize: "32px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // 초기화 
        this.currentStage = 1;
        this.cards = [];
        this.flippedCards = [];
        this.isComparing = false;
        this.isGameActive = false; 

        // 나가기 버튼 (화면 하단으로 이동)
        this.backButton = this.add.text(width / 2, height - 50, "나가기", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({useHandCursor: true});
        this.backButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            this.returnToRoom();
        });

        this.startStage(this.currentStage);

    }

    private startStage(stage: number) {
        const config = this.gridConfigs[stage - 1];
        this.createCards(config.pairs);
        this.showAllCards(); // 모든 카드 1초간 앞면 표시
        // 1초 후 카운트 다운 시작
        this.time.delayedCall(1000, () => {
            this.hideAllCards();
            this.showCountDown();
        })
    }

    private createCards(pairCount: number) {
        const cardDataList: CardData[] = [];
        const usedCombinations: Set<string> = new Set();
        for(let i=0; i<pairCount; i++){
            let shape: CardShape;
            let color: CardColor;
            let key:string;
            // 중복되지 않는 조합
            do {
                shape = Phaser.Utils.Array.GetRandom(this.shapes);
                color = Phaser.Utils.Array.GetRandom(this.colors);
                key = `${shape}-${color}`;
            } while(usedCombinations.has(key));

            usedCombinations.add(key);
            // 같은 쌍을 2개씩 추가 
           const cardData: CardData = {shape, color, cardIndex: i};
           cardDataList.push(cardData);
           cardDataList.push({...cardData});
        }

        // 카드 섞기 
        Phaser.Utils.Array.Shuffle(cardDataList);
        // 카드 생성 
        const config = this.gridConfigs[this.currentStage - 1];
        const {width, height} = this.scale;
        // 플레이 영역 크기 
        const playAreaWidth = 900;
        const playAreaHeight = Math.max(500, config.rows * 120 + 100);
        const playAreaX = width / 2;
        const playAreaY = height / 2;

        // 카드 크기 계산 (화면에 맞게 비율 조정)
        // 가로: 플레이 영역의 80%를 열 수로 나눔
        // 세로: 플레이 영역의 높이를 행 수로 나눔 (여백 고려)
        const availableWidth = playAreaWidth * 0.85; // 좌우 여백 15%
        const availableHeight = playAreaHeight * 0.7; // 상하 여백 30% (타임바 포함)
        const maxCardWidth = availableWidth / config.cols;
        const maxCardHeight = availableHeight / config.rows;
        // 가로와 세로 중 작은 값을 기준으로 카드 크기 결정 (비율 유지)
        const cardWidth = Math.min(maxCardWidth, maxCardHeight / 1.2) * 0.9; // 간격을 위해 90%
        const cardHeight = cardWidth * 1.2;

        // 시작 위치 계산
        const totalCardsWidth = cardWidth * config.cols;
        const totalCardsHeight = cardHeight * config.rows;
        const startX = playAreaX - totalCardsWidth / 2;
        const startY = playAreaY - totalCardsHeight / 2 + 60; // 타임바 아래로 60px
        const spacingX = cardWidth * 1.05; // 카드 간격 5%
        const spacingY = cardHeight * 1.05; // 카드 간격 5%

        // 타임 바
        const timeBarWidth = playAreaWidth * 0.6; 
        const timeBarHeight = 20; 
        const timeBarX = playAreaX; 
        const timeBarY = playAreaY - playAreaHeight / 2 + 50; // 플레이 상단 에서 50px 아래  

        this.timeBarBg = this.add.rectangle(timeBarX, timeBarY, timeBarWidth, timeBarHeight, 0x333333);
        this.timeBar = this.add.rectangle(timeBarX - timeBarWidth / 2, timeBarY, 0, timeBarHeight, 0x00ff00).setOrigin(0, 0.5);

        for(let i = 0; i<cardDataList.length; i++) {
            const row = Math.floor(i / config.cols);
            const col = i % config.cols;
            const x = startX + col * spacingX + cardWidth / 2;
            const y = startY + row * spacingY + cardHeight / 2;
            const card = this.createCard(x, y, cardWidth, cardHeight, cardDataList[i], i);
            this.cards.push(card);
        }


    }

    private createCard(x: number, y: number, width: number, height: number, data: CardData, cardId: number): Card {
        // Container 생성 
        const container = this.add.container(x, y);
        
        // 뒷면 (직접 interactive로 설정)
        const backFace = this.add.rectangle(0, 0, width, height, 0x808080);
        backFace.setStrokeStyle(2, 0x000000);
        backFace.setOrigin(0.5);
        backFace.setInteractive({ useHandCursor: true });
        backFace.setData('cardId', cardId);

        // 앞면 (Graphics)
        const frontFace = this.add.graphics();
        this.drawShape(frontFace, data.shape, data.color, width, height);
        frontFace.setVisible(false);
        // Graphics는 interactive가 불안정하므로 이벤트는 뒷면에만 등록

        container.add([backFace, frontFace]);

        return {
            container,
            backFace,
            frontFace,
            data,
            isFlipped: false,
            isMatched: false,
            cardId: cardId
        }
    }

    private drawShape(graphics: Phaser.GameObjects.Graphics, shape: CardShape, color: CardColor, width: number, height: number) {
        graphics.clear();
        graphics.fillStyle(color);
        graphics.lineStyle(2, 0x000000);
        const size = Math.min(width, height) * 0.4;
        const centerX = 0; 
        const centerY = 0; 
        switch(shape) {
            case "rectangle": 
                graphics.fillRect(centerX -size / 2, centerY - size / 2, size, size);
                graphics.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
                break;
            case "circle": 
                graphics.fillCircle(centerX, centerY, size / 2);
                graphics.strokeCircle(centerX, centerY, size / 2);
                break;
            case "triangle":
                const triangleHeight = size * 0.866; 
                graphics.beginPath();
                graphics.moveTo(centerX, centerY - triangleHeight / 2);
                graphics.lineTo(centerX - size / 2, centerY + triangleHeight / 2);
                graphics.lineTo(centerX + size / 2, centerY + triangleHeight / 2);
                graphics.closePath();
                graphics.fillPath();
                graphics.strokePath();
                break;
            case "star":
                const outerRadius = size / 2;
                const innerRadius = outerRadius * 0.4;
                graphics.beginPath();
                for(let i = 0; i< 5; i++) {
                    const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
                    const x = centerX + Math.cos(angle) * outerRadius;
                    const y = centerY + Math.sin(angle) * outerRadius;
                    if(i === 0) graphics.moveTo(x, y);
                    else graphics.lineTo(x, y);
                    const innerAngle = ((i + 0.5) * 4 * Math.PI / 5) - Math.PI / 2;
                    const innerX = centerX + Math.cos(innerAngle) * innerRadius;
                    const innerY = centerY + Math.sin(innerAngle) * innerRadius;
                    graphics.lineTo(innerX, innerY);
                }
                graphics.closePath();
                graphics.fillPath();
                graphics.strokePath();
                break;
        }
    }

    private showAllCards() {
        this.cards.forEach(card => {
            card.frontFace.setVisible(true);
            card.backFace.setVisible(false);
        })
    }

    private hideAllCards() {
        this.cards.forEach(card => {
            card.frontFace.setVisible(false);
            card.backFace.setVisible(true);
            card.isFlipped = false;
        })
    }

    private showCountDown() {
        const {width, height} = this.scale;
        let countdown = 3; 
        const countdownText = this.add.text(width / 2, height / 2, countdown.toString(), {
            fontSize: "72px",
            color: "ffff00",
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
                    this.startGame();
                })
            }
        }
        this.time.delayedCall(500, updateCountdown);
    }

    private startGame() {
        this.isGameActive = true;
        this.flippedCards = [];
        this.timeLeft = this.timeLimits[this.currentStage - 1];
        this.updateTimeBar();
    
        // 카드 클릭 이벤트 등록 (각 카드의 뒷면과 앞면에 직접 이벤트 등록)
        for(let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            // 기존 이벤트 제거 (뒷면에만 이벤트가 있으므로 뒷면만 제거)
            card.backFace.removeAllListeners('pointerdown');
            
            // 즉시 실행 함수로 각 카드를 완전히 캡처
            ((capturedCard: Card) => {
                let isProcessing = false; // 중복 클릭 방지
                
                // 클릭 핸들러 함수
                const handleClick = (pointer: Phaser.Input.Pointer) => {
                    // 이미 처리 중이면 무시
                    if(isProcessing) return;
                    
                    // 이벤트 전파 중지
                    if(pointer.event) {
                        pointer.event.stopPropagation();
                        pointer.event.preventDefault();
                    }
                    
                    // 게임 상태 확인 (즉시 처리)
                    if(this.isGameActive && !this.isComparing && !capturedCard.isFlipped && !capturedCard.isMatched) {
                        isProcessing = true;
                        // 캡처된 card 객체 사용 (즉시 처리)
                        this.handleCardClick(capturedCard);
                        // 다음 프레임에서 플래그 리셋
                        this.time.delayedCall(10, () => {
                            isProcessing = false;
                        });
                    }
                };
                
                // 뒷면에만 이벤트 등록 (뒤집혔을 때는 앞면이 보이므로 뒷면 클릭 불가)
                card.backFace.on('pointerdown', handleClick);
            })(card);
        }

        // 매초마다 시간 업데이트 
        this.time.addEvent({
            delay: 100,
            loop: true,
            callback: this.updateTimer,
            callbackScope: this
        });
    }

    private updateTimer() {
        if(!this.isGameActive) return;
        this.timeLeft -= 0.1;
        this.updateTimeBar();
        if(this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.isGameActive = false;
            this.onPuzzleFailure();
        }
    }

    private updateTimeBar() {
        if(!this.timeBar || !this.timeBarBg) return;
        const maxWidth = this.timeBarBg.width;
        const ratio = this.timeLeft / this.timeLimits[this.currentStage - 1];
        this.timeBar.width = maxWidth * ratio;
        this.timeBar.x = this.timeBarBg.x - maxWidth / 2;
        // 색상 변경 
        if(ratio > 0.5) {
            this.timeBar.setFillStyle(0x00ff00);
        } else if(ratio > 0.25) {
            this.timeBar.setFillStyle(0xffff00);
        } else {
            this.timeBar.setFillStyle(0xff0000);
        }
    }

    private handleCardClick(card: Card) {
        // 이미 뒤집혔거나 매칭된 카드는 클릭 불가 
        if(card.isFlipped || card.isMatched) return;
        // 이미 2장 뒤집혔으면 무시 
        if(this.flippedCards.length >= 2) return;
        
        // 카드 뒤집기 (즉시 처리)
        card.isFlipped = true;
        card.backFace.setVisible(false);
        card.frontFace.setVisible(true);
        this.flippedCards.push(card);
        // 2장 뒤집어졌으면 비교 
        if(this.flippedCards.length === 2) {
            this.isComparing = true;
            this.time.delayedCall(300, () => {
                this.compareCards();
            })
        }
    }

    private compareCards() {
        if(this.flippedCards.length !== 2) return;
        const card1 = this.flippedCards[0];
        const card2 = this.flippedCards[1];
        if(card1.data.cardIndex === card2.data.cardIndex) {
            // 같은 카드 상태 변경  
            card1.isMatched = true;
            card2.isMatched = true;
            // 초기화 
            this.flippedCards = [];
            this.isComparing = false;
            // 모든 카드가 매칭 되었는지 확인
            this.checkWin(); 
        } else {
            // 매칭 실패
            card1.isFlipped = false;
            card2.isFlipped = false;
            card1.backFace.setVisible(true);
            card2.backFace.setVisible(true);
            card1.frontFace.setVisible(false);
            card2.frontFace.setVisible(false);
            // 초기화 
            this.flippedCards = [];
            this.isComparing = false;
        }
    }

    private checkWin() {
        // 모든 카드가 매칭 되었는지 확인
        const allMatched = this.cards.every(card => card.isMatched);
        if(allMatched) {
            this.isGameActive = false;
            if(this.currentStage >= 3) {
                // 게임 클리어
                this.onPuzzleSuccess();
            } else {
                // 다음 단계로 이동 
                const {width, height} = this.scale;
                const successText = this.add.text(width / 2, height / 2, "Success!", {
                    fontSize: "64px",
                    color: "#00ff00",
                    fontStyle: "bold"
                }).setOrigin(0.5);
                // next stage
                this.currentStage++;
                this.time.delayedCall(800, () => {
                    successText.destroy();
                    // 기존 카드 제거 
                    this.cards.forEach(card => card.container.destroy());
                    this.timeBar.destroy();
                    this.timeBarBg.destroy();
                    this.startStage(this.currentStage);
                });
            }
        }
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
        // 게임 로직은 time events로 처리
    }
}
