import type { RoomId, TriggerObject } from "../type";

export interface RoomData {
    id: RoomId;
    name: string;
    width: number;
    height: number;
    TriggerObjects: TriggerObject[];
}

export const ROOMS: Record<RoomId, RoomData> = {
    mainHall: {
        id: 'mainHall',
        name: "메인홀",
        width: 800,
        height: 600,
        TriggerObjects: [
            {
                id: "exitDoor",
                type: "door",
                x: 750,
                y: 300,
                roomId: "mainHall"
            },
            {
                id: "finalChest",
                type: "chest",
                x: 400,
                y: 300,
                roomId: "mainHall"
            }
        ]
    },
    meetingRoom: {
        id: 'meetingRoom',
        name: "회의실",
        width: 600,
        height: 400,
        TriggerObjects: [
            {
                id: 'documentPile',
                type: 'trigger',
                x: 300,
                y: 200,
                roomId: 'meetingRoom',
                puzzleType: 'pattern',
            }
        ]
    },
    storageRoom: {
        id: 'storageRoom',
        name: "창고",
        width: 500,
        height: 400,
        TriggerObjects: [
            {
                id: 'lockedBox',
                type: 'trigger',
                x: 250,
                y: 200,
                roomId: 'storageRoom',
                puzzleType: 'timing',
            }
        ]
    },
    serverRoom: {
        id: 'serverRoom',
        name: "서버실",
        width: 600,
        height: 500,
        TriggerObjects: [
            {
                id: 'terminal',
                type: 'trigger',
                x: 300,
                y: 250,
                roomId: 'serverRoom',
                puzzleType: 'sequence',
            }
        ]
    }
}



