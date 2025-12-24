import type { EndingType } from "../types";

export interface Ending {
    type: EndingType;
    condition: string;
    text: string;
}

export const ENDINGS: Record<EndingType, Ending> = {
    happy: {
        type: 'happy',
        condition: '보스 처치 + HP 30 이상',
        text: '영희는 아무 일도 없었다는 듯, 집으로 돌아왔다.'
    },
    neutral: {
        type: 'neutral',
        condition: '보스 처치 + HP 낮음',
        text: '영희는 돌아왔지만, 숲은 쉽게 잊히지 않았다.'
    },
    bad: {
        type: 'bad',
        condition: '플레이어 패배',
        text: '숲은 조용했고, 영희는 돌아오지 않았다.'
    }
}