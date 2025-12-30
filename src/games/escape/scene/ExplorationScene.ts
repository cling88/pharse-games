import Phaser from "phaser";
import type { GameState } from "../type";
import { VirtualJoystick } from "../systems/VirtualJoystick";

export default class ExplorationScene extends Phaser.Scene {
    // 플레이어
    private player!: Phaser.GameObjects.Arc;
    private playerVelocity: {x: number; y: number} = {x: 0, y: 0};
    private readonly playerSpeed = 200; 
    // 키보드입력
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: {[key: string]: Phaser.Input.Keyboard.Key};
    // 게임상태
    private gameState!: GameState;
    // 맵 크기 
    private readonly mapWidth = 800;
    private readonly mapHeight = 600; 
    // 모바일 조이스틱
    private joystick!: VirtualJoystick;
    private readonly useJoystick = false; // pc = false, mobile = 자동감지기능

    constructor() {
        super("ExplorationScene");
    }

    init(data: {gameState?: GameState}) {
        if(data.gameState) {
            this.gameState = data.gameState;
        } else {
            this.gameState = {
                collectedNumbers: [],
                hasKey: false,
                clearedPuzzles: new Set()
            }
        }
    }
    create() {
        const {width, height} = this.scale;
        this.add.rectangle(
            width / 2,
            height / 2,
            this.mapWidth,
            this.mapHeight,
            0x2a2a2a
        );
        // 플레이어 생성 (흰색 사각형)
        this.player = this.add.circle(
            this.mapWidth / 2,
            this.mapHeight / 2,
            15,
            0xffffff
        );
        this.player.setOrigin(0.5); // 플레이어 초기 위치 
        this.setupKeyboardInput(); // 키보드 입력 설정
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

    }

    private setupKeyboardInput () {
        // 방향키 설정
        this.cursors = this.input.keyboard!.createCursorKeys();
        // WASD 키 설정
        this.wasdKeys = this.input.keyboard!.addKeys('W, S, A, D') as {[key: string]: Phaser.Input.Keyboard.Key};
    }

    update(time: number, delta: number) {
        const {width, height} = this.scale;
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
            if(left){
                this.playerVelocity.x = -this.playerSpeed;
            } else if(right) {
                this.playerVelocity.x = this.playerSpeed;
            }

            if(up){
                this.playerVelocity.y = -this.playerSpeed;
            } else if(down) {
                this.playerVelocity.y = this.playerSpeed;
            }

            // 대각선 이동시 속도 정규화 
            if(this.playerVelocity.x !== 0 && this.playerVelocity.y !==0) {
                const diagonalSpeed = this.playerSpeed * 0.707;
                this.playerVelocity.x = this.playerVelocity.x > 0 ? diagonalSpeed : -diagonalSpeed;
                this.playerVelocity.y = this.playerVelocity.y > 0 ? diagonalSpeed : -diagonalSpeed;
            }
        }
 
        const deltaSeconds = delta / 1000;
        this.player.x += this.playerVelocity.x * deltaSeconds;
        this.player.y += this.playerVelocity.y * deltaSeconds;

        // 맵 경계 체크 
        const playerHalfSize = 15;
        const mapLeft = width / 2 - this.mapWidth / 2;
        const mapRight = width / 2 + this.mapWidth / 2;
        const mapTop = height / 2 - this.mapHeight / 2;
        const mapBottom  = height / 2 + this.mapHeight / 2;

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

}