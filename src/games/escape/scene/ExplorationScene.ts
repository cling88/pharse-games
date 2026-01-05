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

    constructor(key: string) {
        super(key);
    }

    init(data: {gameState?: GameState; roomId?: RoomId}) {
        // 게임 상태 초기화
        if(data.gameState) {
            this.gameState = data.gameState;
        } else {
            this.gameState = {
                collectedNumbers: [],
                hasKey: false,
                clearedPuzzles: new Set()
            };
        }
        
        // 방 ID 설정
        this.currentRoomId = data.roomId || this.getRoomId();
        
        // 방 데이터에서 맵 크기 가져오기
        const roomData = ROOMS[this.currentRoomId];
        this.mapWidth = roomData.width;
        this.mapHeight = roomData.height;
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
        const mapCenterX = width / 2;
        const mapCenterY = height / 2;
        this.player = this.add.circle(
            mapCenterX,
            mapCenterY,
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
            // 출입문 (나중에 구현)
            console.log("출입문은 아직 잠겨있습니다.");
        } else if(obj.type === 'chest') {
            // 상자 (나중에 구현)
            console.log("상자 상호작용 (나중에 구현)");
        } else if(obj.type === 'trigger') {
            // 퍼즐 트리거 (나중에 구현)
            console.log("퍼즐 시작 (나중에 구현)");
        }
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

    update(time: number, delta: number) {
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