import type { StageId } from "../types";

export interface StageConfig {
    id: StageId;
    name: string;
    bgColor: number;
    mapSize: {width: number; height: number;};
    enemyCount: number; 
}

export const STAGES: Record<StageId, StageConfig> = {
    stage1: {
        id: 'stage1',
        name: '숲의 가장자리',
        bgColor: 0x8BCF9B, // 연한 초록
        mapSize: { width: 6, height: 6 },
        enemyCount: 2
    },
    stage2: {
        id: 'stage2',
        name: '숲의 경계',
        bgColor: 0x3F6B4E, // 짙은 초록
        mapSize: { width: 7, height: 7 },
        enemyCount: 3
    },
    stage3: {
        id: 'stage3',
        name: '유적 입구',
        bgColor: 0x6E7F73, // 회녹색
        mapSize: { width: 8, height: 8 },
        enemyCount: 4
    },
    boss: {
        id: 'boss',
        name: '숲의 수호자',
        bgColor: 0x2E4F4F, // 어두운 청록
        mapSize: { width: 9, height: 9 },
        enemyCount: 1 // 보스 1명
    }
}