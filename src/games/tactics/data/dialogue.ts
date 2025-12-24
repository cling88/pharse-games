import type {StageId} from '../types';

export interface Dialogue {
    speaker: string;
    text: string;
}

export interface StageDialogue {
    stageId: StageId;
    dialogues: Dialogue[]
}

export const DIALOGUES: StageDialogue[] = [
    {
        stageId: 'stage1',
        dialogues: [
            { speaker: '철수', text: '여기까지 온 건 맞는 것 같은데…' },
            { speaker: '시스템', text: '(바닥에 작은 발자국이 남아 있다)' },
            { speaker: '철수', text: '야… 혼자서 잘 다니고 있지? 제발.' }
        ]
    },
    {
        stageId: 'stage2',
        dialogues: [
            { speaker: '노인', text: '그 고양이라면, 더 안쪽으로 갔을 게다.' },
            { speaker: '철수', text: '아, 역시 숲에 노인 한 명쯤은 계셔야죠.' },
            { speaker: '노인', text: '길은 알려줄 수 있어도, 대신 가줄 순 없지.' }
        ]
    },
    {
        stageId: 'stage3',
        dialogues: [
            { speaker: '철수', text: '냄새가… 익숙한데.' },
            { speaker: '시스템', text: '(멀리서 고양이 울음소리가 들린다)' },
            { speaker: '철수', text: '거기지? 딱 기다려.' }
        ]
    },
    {
        stageId: 'boss',
        dialogues: [
            { speaker: '숲의 수호자', text: '이 숲에 들어온 건, 네가 선택한 일이다.' },
            { speaker: '철수', text: '고양이 데리러 왔을 뿐인데 일이 커졌네.' }
        ]
    }
];
