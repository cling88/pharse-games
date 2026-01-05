import type { RoomId } from "../type";
import ExplorationScene from "./ExplorationScene";

export default class MeetingRoomScene extends ExplorationScene {
    constructor() {
        super("MeetingRoomScene");
    }
       

    getRoomId():RoomId {
        return 'meetingRoom'
    }

    onRoomCreate(): void {
        this.setupObjectInteraction();
    }
    
}