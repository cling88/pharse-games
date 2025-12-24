import type { GridPosition, Status } from "../types";
import type { EnemyData } from "../data/enemies";

export class Enemy {
    name: string;
    position: GridPosition;
    stats: Status;
    traits: string[];

    constructor(data: EnemyData, position: GridPosition) {
        this.name = data.name;
        this.position = position;
        this.stats = {...data.stats}
        this.traits = data.traits || [];
    }

    modifyHp(amount: number){
        this.stats.hp = Math.max(0, Math.min(this.stats.maxHp, this.stats.hp + amount))
    }
    
    moveTo(position: GridPosition) {
        this.position = position;
    }
    
    isAlive():boolean {
        return this.stats.hp > 0;
    }
}