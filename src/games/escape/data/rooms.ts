import type { RoomId, TriggerObject } from "../type";

export interface RoomData {
    id: RoomId;
    name: string;
    width: number;
    height: number;
    triggerObjects: TriggerObject[];
}

export const ROOMS: Record<RoomId, RoomData> = {
    mainHall: {
        id: 'mainHall',
        name: "메인홀",
        width: 800,
        height: 600,
        triggerObjects: [
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
            },
            // 메인홀 -> 회의실
            {
                id: "doorToMeetingRoom",
                type: "door",
                x: 100,
                y: 300,
                roomId: "mainHall",
                connectedRoomId: "meetingRoom"
            },
            // 메인홀 -> 창고 (상단)
            {
                id: "doorToStorageRoom",
                type: "door",
                x: 400,
                y: 50,
                roomId: "mainHall",
                connectedRoomId: "storageRoom"
            },
            // 메인홀 -> 서버실 (하단)
            {
                id: "doorToServerRoom",
                type: "door",
                x: 400,
                y: 550,
                roomId: "mainHall",
                connectedRoomId: "serverRoom"
            }
        ]
    },
    meetingRoom: {
        id: 'meetingRoom',
        name: "회의실",
        width: 600,
        height: 400,
        triggerObjects: [
            // 회의실 -> 메인홀 
            {
                id: "doorToMainHall",
                type: "door",
                x: 550,
                y: 200,
                roomId: "meetingRoom",
                connectedRoomId: "mainHall"
            },
            {
                id: 'documentPile', // 퍼즐 트리거 
                type: 'trigger',
                x: 50,
                y: 50,
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
        triggerObjects: [
            // 회의실 -> 메인홀 
            {
                id: "doorToMainHall",
                type: "door",
                x: 250,
                y: 350,
                roomId: "storageRoom",
                connectedRoomId: "mainHall"
            },
            { // 창고 퍼블 트리거 
                id: 'lockedBox',
                type: 'trigger',
                x: 450,
                y: 50,
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
        triggerObjects: [
            // 서버실 → 메인홀
            {
                id: "doorToMainHall",
                type: "door",
                x: 50,
                y: 250,
                roomId: "serverRoom",
                connectedRoomId: "mainHall",
            },
            { // 서버실 퍼즐 트리거 
                id: 'terminal',
                type: 'trigger',
                x: 550,
                y: 450,
                roomId: 'serverRoom',
                puzzleType: 'sequence',
            }
        ]
    }
}



