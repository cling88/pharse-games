import Phaser from "phaser";
import type { GridPosition } from "../types";

export class GridSystem {
    private scene: Phaser.Scene;
    private gridSize: number;
    private mapSize: {width: number, height: number};

    constructor(scene: Phaser.Scene, gridSize: number, mapSize: {width: number, height: number}) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.mapSize = mapSize;
    }

    // 그리드 시작 위치 계산
    getGridStartPosition(): {startX: number, startY: number} {
        const {width, height} = this.scene.scale;
        return {
            startX: (width - this.mapSize.width * this.gridSize) / 2,
            startY: (height - this.mapSize.height * this.gridSize) / 2
        };
    }

    // 포인터를 그리드 좌표로 변환
    pointerToGridPosition(pointer: Phaser.Input.Pointer): GridPosition | null {
        const {startX, startY} = this.getGridStartPosition();
        const gridX = Math.floor((pointer.x - startX) / this.gridSize);
        const gridY = Math.floor((pointer.y - startY) / this.gridSize);
        
        if(gridX < 0 || gridX >= this.mapSize.width || gridY < 0 || gridY >= this.mapSize.height) {
            return null;
        }
        return {x: gridX, y: gridY};
    }

    // 그리드 좌표를 픽셀 좌표로 변환
    gridToPixel(gridPos: GridPosition): {x: number, y: number} {
        const {startX, startY} = this.getGridStartPosition();
        return {
            x: startX + gridPos.x * this.gridSize + this.gridSize / 2,
            y: startY + gridPos.y * this.gridSize + this.gridSize / 2
        };
    }

    // 셀 생성
    createCell(gridPos: GridPosition, color: number, alpha: number, callback: () => void): Phaser.GameObjects.Rectangle {
        const {startX, startY} = this.getGridStartPosition();
        const pixelX = startX + gridPos.x * this.gridSize + this.gridSize / 2;
        const pixelY = startY + gridPos.y * this.gridSize + this.gridSize / 2;
        
        const cell = this.scene.add.rectangle(
            pixelX,
            pixelY,
            this.gridSize - 4,
            this.gridSize - 4,
            color,
            alpha
        ).setInteractive({useHandCursor: true});
        
        cell.on('pointerdown', callback);
        return cell;
    }

    // 그리드 그리기
    drawGrid(): Phaser.GameObjects.Rectangle[] {
        const {startX, startY} = this.getGridStartPosition();
        const cells: Phaser.GameObjects.Rectangle[] = [];
        
        for(let y = 0; y < this.mapSize.height; y++) {
            for (let x = 0; x < this.mapSize.width; x++) {
                const rect = this.scene.add.rectangle(
                    startX + x * this.gridSize + this.gridSize / 2,
                    startY + y * this.gridSize + this.gridSize / 2,
                    this.gridSize - 2,
                    this.gridSize - 2,
                    0xffffff,
                    0.1
                );
                cells.push(rect);
            }
        }
        return cells;
    }

    // 맵 크기 업데이트
    updateMapSize(mapSize: {width: number, height: number}) {
        this.mapSize = mapSize;
    }
}
