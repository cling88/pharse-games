import Phaser from "phaser";

export interface JoystickVelocity {
    x: number;
    y: number;
}

export class VirtualJoystick {
    private scene: Phaser.Scene;
    // 조이스틱 위치 및 크기 
    private centerX: number = 0; 
    private centerY: number = 0;
    private readonly outerRadius: number = 60;
    private readonly innerRadius: number = 25;
    private readonly maxRadius: number = 50; 

    // UI 요소 
    private outerCircle!: Phaser.GameObjects.Arc;
    private innerStick!: Phaser.GameObjects.Arc;

    // 상태
    private isActive: boolean = false;
    private touchPointer: Phaser.Input.Pointer | null = null; 
    private currentVelocity: JoystickVelocity = {x: 0, y: 0};

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 조이스틱 UI 생성 및 초기화
     * @param x 조이스틱 중심 X 좌표 (화면 좌표)
     * @param y 조이스틱 중심 Y 좌표 (화면 좌표)
    */
    create(x: number, y: number) {
        this.centerX = x;
        this.centerY = y;
        // 배경 원 (고정)
        this.outerCircle = this.scene.add.circle(
            this.centerX,
            this.centerY,
            this.outerRadius,
            0xffffff,
            0.3
        );
        this.outerCircle.setDepth(1000); // zIndex 
        this.outerCircle.setScrollFactor(0); // 카메라 스크롤 영향 없음

        // 스틱 (움직임)
        this.innerStick = this.scene.add.circle(
            this.centerX,
            this.centerY,
            this.innerRadius,
            0xffffff,
            0.8
        );
        this.innerStick.setDepth(1001);
        this.innerStick.setScrollFactor(0);

        this.setupInput();

    }

    private setupInput() {
        // 터치 시작
        this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            // 조이스틱 내에서 터치했는지 체크 
            const distance = Phaser.Math.Distance.Between(
                pointer.x,
                pointer.y,
                this.centerX,
                this.centerY
            );
            if(distance <= this.outerRadius) {
                this.isActive = true;
                this.touchPointer = pointer;
                this.updateStickPosition(pointer.x, pointer.y);
            }
        });
        // 드래그 중
        this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if(this.isActive && this.touchPointer && pointer.id === this.touchPointer.id) {
                this.updateStickPosition(pointer.x, pointer.y);
            }
        });
        // 터치 해제 
        this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            if(this.isActive && this.touchPointer && pointer.id === this.touchPointer.id) {
                this.reset();
            }
        });

    }

    private updateStickPosition(pointerX: number, pointerY: number) {
        // 조이스틱 중심에서 포인터까지의 백터
        // let dx = pointerX 
    }

    private reset() {

    }

}