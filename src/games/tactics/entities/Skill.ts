import type { SkillData } from "../data/skill";

export class Skill {
    id:string;
    name: string;
    type: string;
    description: string;
    level: number = 1;
    range?: number;
    useCount: number = 3; // 스테이지당 스킬 사용 가능 횟수 (각 스킬별)

    constructor(data: SkillData) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.description = data.description;
        this.range = data.range;
    }

    // max level3
    levelUp() {
        if(this.level < 3) {
            this.level++;
        }
    }

    // Bring current level's effect
    getCurrentEffect(data: SkillData): string {
        const levelData = data.levels.find(l => l.level === this.level);
        return levelData?.effect || "";
    }
}