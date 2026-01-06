import Phaser from "phaser";
import { VirtualJoystick } from "../systems/VirtualJoystick";
import { ROOMS } from "../data/rooms";
import type { GameState, RoomId, TriggerObject } from "../type";

export default abstract class ExplorationScene extends Phaser.Scene {
    // 플레이어
    protected player!: Phaser.GameObjects.Arc;
    protected playerVelocity: {x: number; y: number} = {x: 0, y: 0};
    protected readonly playerSpeed = 200;
    
    // 키보드 입력
    protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    protected wasdKeys!: {[key: string]: Phaser.Input.Keyboard.Key};
    
    // 게임 상태
    protected gameState!: GameState;
    protected currentRoomId!: RoomId;
    
    // 모바일 조이스틱
    protected joystick!: VirtualJoystick;
    
    // 맵 크기 (rooms.ts에서 가져옴)
    protected mapWidth!: number;
    protected mapHeight!: number;

    // 오브젝트 상호작용
    protected TriggerObject: TriggerObject[] = [];
    protected objectSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    protected interactionHint!: Phaser.GameObjects.Text | null; 
    protected nearObject: TriggerObject | null = null;
    protected readonly interactionDistance = 60;

    // 상자 퍼즐 모달
    private chestModal: Phaser.GameObjects.Container | null = null;
    private inputNumbers: number[] = [];

    constructor(key: string) {
        super(key);
    }

    init(data: {gameState?: GameState; roomId?: RoomId; playerPosition?: {x: number, y: number}}) {
        // 게임 상태 초기화
        if(data.gameState) {
            this.gameState = data.gameState;
        } else {
            const password = this.generatePassword();
            this.gameState = {
                password: password,
                puzzleReward: new Map<string, number>(),
                collectedNumbers: [],
                hasKey: false,
                clearedPuzzles: new Set<string>()
            };
        }
        
        // 방 ID 설정
        this.currentRoomId = data.roomId || this.getRoomId();
        
        // 방 데이터에서 맵 크기 가져오기
        const roomData = ROOMS[this.currentRoomId];
        this.mapWidth = roomData.width;
        this.mapHeight = roomData.height;

        // 플레이어 위치 저장
        (this as any).savedPlayerPosition = data.playerPosition;
    }

    create() {
        const {width, height} = this.scale;
        
        // 배경 (기본 색상)
        this.add.rectangle(
            width / 2,
            height / 2,
            this.mapWidth,
            this.mapHeight,
            0x2a2a2a
        );
        
        // 플레이어 생성 (초기 위치는 맵 중앙)
        const savedPos = (this as any).savedPlayerPosition;
        let playerX: number;
        let playerY: number;
        if(savedPos) { // 기존 저장된 위치가 있으면
            playerX = savedPos.x;
            playerY = savedPos.y;
        } else { // 없으면 앱 중앙
            playerX = width / 2;
            playerY = height / 2;
        }
        this.player = this.add.circle(
            playerX,
            playerY,
            15,
            0xffffff
        );
        this.player.setOrigin(0.5);
        
        // 키보드 입력 설정
        this.setupKeyboardInput();
        
        // 모바일 조이스틱 초기화
        this.joystick = new VirtualJoystick(this);
        this.joystick.create(80, height - 80);
        
        // 맵 경계 표시
        this.add.rectangle(
            width / 2,
            height / 2,
            this.mapWidth,
            this.mapHeight,
            0x000000,
            0
        ).setStrokeStyle(2, 0xffffff, 0.3);

        // 방 이름 표시 (맵 상단 가운데, 바깥쪽)
        const roomData = ROOMS[this.currentRoomId];
        const mapTop = height / 2 - this.mapHeight / 2;
        this.add.text(
            width / 2,
            mapTop - 30,
            roomData.name,
            {
                fontSize: "24px",
                color: "#ffffff",
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // 각 방별 고유 초기화 (하위 클래스에서 구현)
        this.onRoomCreate();
    }

    protected generatePassword(): number[] {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const password: number[] = [];
        for(let i=0; i<3; i++) {
            const randomIndex = Phaser.Math.Between(0, numbers.length - 1);
            password.push(numbers[randomIndex]);
            numbers.splice(randomIndex, 1); // 선택한 숫자는 제거 
        }
        return password;
    }

    protected getPuzzleRewardNumber(triggerObjectId: string): number {
        // 이미 할당된 숫자는 반환
        if(this.gameState.puzzleReward.has(triggerObjectId)) {
            return this.gameState.puzzleReward.get(triggerObjectId)!;
        }
        // 비밀번호에서 이미 할당된 숫자 제외 
        const assignedNumbers = Array.from(this.gameState.puzzleReward.values());
        const availableNumbers = this.gameState.password.filter(num => !assignedNumbers.includes(num));

        // 남은 숫자 중 랜덤 선택
        const randomIndex = Phaser.Math.Between(0, availableNumbers.length - 1);
        const selectedNumber = availableNumbers[randomIndex];
        // 할당 저장
        this.gameState.puzzleReward.set(triggerObjectId, selectedNumber);

        return selectedNumber;
    }

    protected setupObjectInteraction (): void {
        // 각 방에서 오브젝트 가져오기 
        const roomData = ROOMS[this.currentRoomId];
        this.TriggerObject = roomData.triggerObjects;
        this.renderObjects(); // 오브젝트 렌더링
        // 상호작용 힌트 텍스트 생성
        const {width, height} = this.scale;
        this.interactionHint = this.add.text(
            width / 2,
            height / 2 - 100,
            "",
            {
                fontSize: "24px",
                color: "#ffff00",
                align: "center",
                backgroundColor: "#000000",
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setVisible(false).setDepth(2000);
        // E 키로 상호작용 
        this.input.keyboard!.on("keydown-E", () => {
            if(this.nearObject) {
                this.interactWithObject(this.nearObject);
            }
        });
    } 

    protected renderObjects() {
        const {width, height} = this.scale;
        const mapLeft = width / 2 - this.mapWidth /2;
        const mapTop = height / 2 - this.mapHeight / 2;
        this.TriggerObject.forEach(obj => {
            const pixelX = mapLeft + obj.x;
            const pixelY = mapTop + obj.y;
            let color = 0x888888;
            let alpha = 0.8; 
             // 타입별 색상
             if(obj.type === 'door') {
                color = 0x8B4513; // 갈색
            } else if(obj.type === 'chest') {
                color = 0xFFD700; // 금색
            } else if(obj.type === 'trigger') {
                color = 0x4169E1; // 파란색
            }
            const sprite = this.add.rectangle(
                pixelX,
                pixelY,
                40, 
                40,
                color,
                alpha
            );
            // 레이블 텍스트 추가
            let labelText = "";
            if(obj.type === 'door') {
                if(obj.connectedRoomId) {
                    // 연결된 방이 있으면 방 이름 표시
                    const roomData = ROOMS[obj.connectedRoomId];
                    labelText = roomData.name;
                } else {
                    // 출입문 등 연결된 방이 없으면 "문" 표시
                    labelText = "문";
                }
            } else if(obj.type === 'chest') {
                labelText = '상자';
            } else {
                labelText = "오브젝트";
            }
            
            this.add.text(
                pixelX,
                pixelY - 30,
                labelText,
                {
                    fontSize: "12px",
                    color: "#ffffff"
                }
            ).setOrigin(0.5);
            this.objectSprites.set(obj.id, sprite);
        });
    }

    protected checkObjectProximity (): void {
        const {width, height} = this.scale;
        const mapLeft = width / 2 - this.mapWidth / 2;
        const mapTop = height / 2 - this.mapHeight / 2;
        let nearestObject: TriggerObject | null = null;
        let nearestDistance = Infinity;

        this.TriggerObject.forEach(obj => {
            const objX = mapLeft + obj.x;
            const objY = mapTop + obj.y;
            const distance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                objX,
                objY
            );
            if(distance < this.interactionDistance && distance < nearestDistance) {
                nearestDistance = distance; 
                nearestObject = obj;
            }
        });
        // 근처 오브젝트가 변경되었는지 확인
        if(nearestObject !== this.nearObject) {
            this.nearObject = nearestObject;
            this.updateInteractionHint()
        }
    }

    protected updateInteractionHint(): void {
        if(!this.interactionHint) return;
        if(this.nearObject) {
            let hintText = "";
            if(this.nearObject.type === "door" && this.nearObject.connectedRoomId) {
                const roomData = ROOMS[this.nearObject.connectedRoomId];
                hintText = `[E] ${roomData.name}으로 이동`;
            }  else if(this.nearObject.type === 'door' && !this.nearObject.connectedRoomId) {
                hintText = "[E] 출입문 (잠김)";
            } else if(this.nearObject.type === 'chest') {
                hintText = "[E] 상자 열기";
            } else if(this.nearObject.type === 'trigger') {
                hintText = "[E] 상호작용";
            }
            this.interactionHint.setText(hintText);
            this.interactionHint.setVisible(true);
        } else {
            this.interactionHint.setVisible(false);
        }
    }

    protected interactWithObject(obj: TriggerObject): void {
        if(obj.type === 'door' && obj.connectedRoomId) {
            const sceneName = this.getSceneNameFromRoomId(obj.connectedRoomId);
            this.scene.start(sceneName, { // 방 이동
                gameState: this.gameState,
                roomId: obj.connectedRoomId
            });
        }  else if(obj.type === 'door' && !obj.connectedRoomId) {
            // 출입문
            const {width, height} = this.scale;
            if(this.gameState.hasKey) {
                // 열쇠 있음
                const messageText = this.add.text(
                    width / 2,
                    height / 2,
                    "문이 열렸다",
                    {
                        fontSize: "32px",
                        color: "#00ff00",
                        fontStyle: "bold"
                    }
                ).setOrigin(0.5);
                this.time.delayedCall(1500, () => {
                    messageText.destroy();
                    this.scene.start("EndingScene", {
                        gameState: this.gameState
                    })
                })
            } else {
                // 열쇠 없음
                const messageText = this.add.text(
                    width / 2,
                    height / 2,
                    "열쇠가 필요하다",
                    {
                        fontSize: "28px",
                        color: "#ffff00",
                        fontStyle: "bold"
                    }
                ).setOrigin(0.5);
                this.time.delayedCall(2000, () => {
                    messageText.destroy();
                });
            }
        } else if(obj.type === 'chest') {
            // 상자 퍼즐 열기 
            this.showChestModal();
        } else if(obj.type === 'trigger') {
            // 퍼즐 시작
            if(!obj.puzzleType) {
                console.error("Trigger object missing puzzleType:", obj.id);
                return;
            }
            const puzzleSceneName = this.getPuzzleSceneName(obj.puzzleType);
            const {width, height} = this.scale;
            const mapeLeft = width / 2 - this.mapWidth / 2;
            const mapTop = height / 2 - this.mapHeight / 2;
            const objectPixelX = mapeLeft + obj.x;
            const objectPixelY = mapTop + obj.y; 
            const playerX = objectPixelX;
            const playerY = objectPixelY - 60; 
            
            // 현재 씬 이름 찾기 
            const currentSceneName = this.scene.key;
            this.scene.start(puzzleSceneName, {
                gameState: this.gameState,
                returnRoomId: currentSceneName,
                returnRoomData: {
                    roomId: this.currentRoomId,
                    playerX: playerX,
                    playerY: playerY
                },
                triggerObjectId: obj.id
            });
        }
    }

    protected showChestModal(): void {
        if(this.chestModal) return;
        const {width, height} = this.scale;
        
        // 모달 UI 
        const bg = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.7
        ).setInteractive();
        const modalBox = this.add.rectangle(
            width / 2,
            height / 2,
            500,
            400,
            0x2c3e50,
            0.95
        ).setStrokeStyle(2, 0xecf0f1);
        const titleText = this.add.text(
            width / 2,
            height / 2 - 150,
            "비밀번호 입력",
            {
                fontSize: "32px",
                color: "#fff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);
        const inputDisplay = this.add.text(
            width / 2,
            height / 2 - 80,
            "---",
            {
                fontSize: "48px",
                color: "#fff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        // 숫자 버튼들 0 - 9
        const numberButtons: Phaser.GameObjects.Rectangle[] = [];
        const buttonSize = 60;
        const buttonSpacing = 70;
        const startX = width / 2 - buttonSpacing;
        const startY = height / 2 + 20;

        for(let i = 0; i<10; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const btnX = startX + col * buttonSpacing;
            const btnY = startY + row * buttonSpacing;
            // 버튼 UI 
            const button = this.add.rectangle(
                btnX,
                btnY,
                buttonSize,
                buttonSize,
                0x3498db,
                0.9
            ).setInteractive({useHandCursor: true});
            const buttonText = this.add.text(
                btnX,
                btnY,
                i.toString(),
                {
                    fontSize: "28px",
                    color: "#fff",
                    fontStyle: "bold"
                }
            ).setOrigin(0.5);
            // 버튼 클릭 이벤트 
            button.on("pointerdown", () => {
                if(this.inputNumbers.length < 3) {
                    this.inputNumbers.push(i);
                    this.updateInputDisplay(inputDisplay);
                }
            });
            button.on('pointerover', () => {
                button.setFillStyle(0x2980b9, 0.9);
            });
            button.on('pointerout', () => {
                button.setFillStyle(0x3498db, 0.9)
            });
            numberButtons.push(button);
            modalBox.setData('buttons', [...(modalBox.getData('buttons') || []), button, buttonText]);
        }
        // 지우기 버튼
        const deleteButton = this.add.rectangle(
            width / 2 - 100,
            height / 2 + 130,
            120,
            40,
            0xe74c3c,
            0.9
        ).setInteractive({useHandCursor: true});
        const deleteText = this.add.text(
            width / 2 - 100,
            height / 2 + 130,
            "Del",
            {
                fontSize: "20px",
                color: "#fff"
            }
        ).setOrigin(0.5);
        deleteButton.on("pointerdown", () => {
            if(this.inputNumbers.length > 0) {
                this.inputNumbers.pop();
                this.updateInputDisplay(inputDisplay);
            }
        });
        deleteButton.on("pointerover", () => {
            deleteButton.setFillStyle(0xc0392b, 0.9);
        });
        deleteButton.on("pointerout", () => {
            deleteButton.setFillStyle(0xe74c3c, 0.9)
        });

        // 확인 버튼
        const confirmButton = this.add.rectangle(
            width / 2 + 100,
            height / 2 + 130,
            120,
            40,
            0x27ae60,
            0.9
        ).setInteractive({useHandCursor: true});
        const confirmText = this.add.text(
            width / 2 + 100,
            height / 2 + 130,
            "Confirm",
            {
                fontSize: "20px",
                color: "#fff"
            }
        ).setOrigin(0.5);
        confirmButton.on("pointerdown", () => {
            this.checkPassword(inputDisplay);
        });
        confirmButton.on("pointerover", () => {
            confirmButton.setFillStyle(0x229954, 0.9);
        });
        confirmButton.on("pointerout", () => {
            confirmButton.setFillStyle(0x27ae60, 0.9);
        });

        // 닫기 버튼
        const closeButton = this.add.rectangle(
            width / 2,
            height / 2 + 130,
            120,
            40,
            0x95a5a6,
            0.9
        ).setInteractive({useHandCursor: true});
        const closeText = this.add.text(
            width / 2,
            height / 2 + 130,
            "Close",
            {
                fontSize: "20px",
                color: "#fff"
            }
        ).setOrigin(0.5);
        closeButton.on("pointerdown", () => {
            this.closeChestModal();
        });
        closeButton.on("pointerover", () => {
            closeButton.setFillStyle(0x7f8c8d, 0.9);
        });
        closeButton.on("pointerout", () => {
            closeButton.setFillStyle(0x95a5a6, 0.9);
        });

        // 모달 생성
        this.chestModal = this.add.container(0, 0, [
            bg,
            modalBox,
            titleText,
            inputDisplay,
            deleteButton,
            deleteText,
            confirmButton,
            confirmText,
            closeButton,
            closeText,
            ...numberButtons.map((btn, idx) => {
                const btnText = this.add.text(
                    btn.x,
                    btn.y,
                    idx.toString(),
                    {
                        fontSize: '28px',
                        color: "#fff",
                        fontStyle: "bold"
                    }
                ).setOrigin(0.5);
                return btnText;
            })
        ]);

        //입력 초기화
        this.inputNumbers = [];
        this.updateInputDisplay(inputDisplay);
    }

    protected updateInputDisplay(display: Phaser.GameObjects.Text): void {
        let displayText = "";
        for(let i=0; i<3; i++) {
            if(i < this.inputNumbers.length) {
                displayText += this.inputNumbers[i].toString();
            } else {
                displayText += "-";
            }
        }
        display.setText(displayText);
    }

    protected checkPassword(inputDisplay: Phaser.GameObjects.Text): void {
        // 3자리 모두 입력 되었는지 확인
        if(this.inputNumbers.length !== 3) {
            inputDisplay.setText("3자리 입력!");
            inputDisplay.setColor("#ff0000");
            this.time.delayedCall(1000, () => {
                this.updateInputDisplay(inputDisplay);
                inputDisplay.setColor("#fff");
            });
            return;
        } 
        // 비밀번호 확인
        const inputPassword = this.inputNumbers;
        const correctPassword = this.gameState.password;

        // 배열 비교
        const isCorrect = inputPassword.length === correctPassword.length && 
                          inputPassword.every((val, idx) => val === correctPassword[idx]);
        if(isCorrect) {
            // 성공
            this.gameState.hasKey = true;
            this.closeChestModal();
            // 성공 메세지 표시 
            const {width, height} = this.scale;
            const successText = this.add.text(
                width / 2,
                height / 2,
                "열쇠를 획득!",
                {
                    fontSize: "32px",
                    color: "#00ff00",
                    fontStyle: "bold"
                }
            ).setOrigin(0.5);
            this.time.delayedCall(2000, () => {
                successText.destroy();
            });

        } else {
            // 실패
            inputDisplay.setText("비밀번호가 다릅니다!");
            inputDisplay.setColor("#ff0000");
            this.inputNumbers = [];
            this.time.delayedCall(1000, () => {
                this.updateInputDisplay(inputDisplay);
                inputDisplay.setColor("#fff");
            });
        }                          
    }

    protected closeChestModal() {
        if(this.chestModal) {
            this.chestModal.destroy();
            this.chestModal = null;
            this.inputNumbers = [];
        }
    }


    getPuzzleSceneName(puzzleType: "pattern" | "timing" | "sequence"): string {
        const sceneNameMap = {
            pattern: "PatternPuzzleScene",
            timing: "TimingPuzzleScene",
            sequence: "SequencePuzzleScene"
        }
        return sceneNameMap[puzzleType];
    }

    protected getSceneNameFromRoomId(roomId: RoomId): string {
        const sceneNameMap: Record<RoomId, string> = {
            mainHall: "MainHallScene",
            meetingRoom: "MeetingRoomScene",
            storageRoom: "StorageRoomScene",
            serverRoom: "ServerRoomScene"
        }
        return sceneNameMap[roomId];
    }

    protected setupKeyboardInput() {
        // 방향키 설정
        this.cursors = this.input.keyboard!.createCursorKeys();
        // WASD 키 설정
        this.wasdKeys = this.input.keyboard!.addKeys('W, S, A, D') as {[key: string]: Phaser.Input.Keyboard.Key};
    }

    protected handlePlayerInput() {
        this.playerVelocity.x = 0;
        this.playerVelocity.y = 0;
        
        // 조이스틱 입력 처리 (PC 마우스 / 모바일 터치 둘 다 지원)
        const joystickVel = this.joystick.getVelocity();
        if(joystickVel.x !== 0 || joystickVel.y !== 0) {
            this.playerVelocity.x = joystickVel.x * this.playerSpeed;
            this.playerVelocity.y = joystickVel.y * this.playerSpeed;
        } else {
            // 조이스틱 입력이 없을 때만 키보드 입력 처리
            const left = this.cursors.left!.isDown || this.wasdKeys.A.isDown;
            const right = this.cursors.right!.isDown || this.wasdKeys.D.isDown;
            const up = this.cursors.up!.isDown || this.wasdKeys.W.isDown;
            const down = this.cursors.down!.isDown || this.wasdKeys.S.isDown;
        
            // 4방향 이동 처리
            if(left) {
                this.playerVelocity.x = -this.playerSpeed;
            } else if(right) {
                this.playerVelocity.x = this.playerSpeed;
            }

            if(up) {
                this.playerVelocity.y = -this.playerSpeed;
            } else if(down) {
                this.playerVelocity.y = this.playerSpeed;
            }

            // 대각선 이동시 속도 정규화
            if(this.playerVelocity.x !== 0 && this.playerVelocity.y !== 0) {
                const diagonalSpeed = this.playerSpeed * 0.707;
                this.playerVelocity.x = this.playerVelocity.x > 0 ? diagonalSpeed : -diagonalSpeed;
                this.playerVelocity.y = this.playerVelocity.y > 0 ? diagonalSpeed : -diagonalSpeed;
            }
        }
    }

    protected handlePlayerMovement(delta: number) {
        const deltaSeconds = delta / 1000;
        this.player.x += this.playerVelocity.x * deltaSeconds;
        this.player.y += this.playerVelocity.y * deltaSeconds;
    }

    protected clampPlayerPosition() {
        const {width, height} = this.scale;
        const playerHalfSize = 15;
        const mapLeft = width / 2 - this.mapWidth / 2;
        const mapRight = width / 2 + this.mapWidth / 2;
        const mapTop = height / 2 - this.mapHeight / 2;
        const mapBottom = height / 2 + this.mapHeight / 2;

        this.player.x = Phaser.Math.Clamp(
            this.player.x,
            mapLeft + playerHalfSize,
            mapRight - playerHalfSize
        );
        this.player.y = Phaser.Math.Clamp(
            this.player.y,
            mapTop + playerHalfSize,
            mapBottom - playerHalfSize
        );
    }

    update(_time: number, delta: number) {
        // 입력 처리
        this.handlePlayerInput();
        
        // 플레이어 이동
        this.handlePlayerMovement(delta);
        
        // 경계 체크
        this.clampPlayerPosition();

        // 오브젝트 근접 체크 
        this.checkObjectProximity();
    }

    // 추상 메서드: 각 방에서 구현해야 함
    abstract getRoomId(): RoomId;
    abstract onRoomCreate(): void;
}