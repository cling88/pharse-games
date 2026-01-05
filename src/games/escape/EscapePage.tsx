import { useNavigate } from "react-router-dom";
import GamePage from "../common/GamePage";
import MainHallScene from "./scene/MainHallScene";
import MeetingRoomScene from "./scene/MeetingRoomScene";
import ServerRoomScene from "./scene/ServerRoomScene";
import StorageRoomScene from "./scene/StorageRoomScene";

export default function EscapePage() {
    const navigate = useNavigate();

    return(
        <>
            <GamePage
                scene={[MainHallScene, MeetingRoomScene, ServerRoomScene, StorageRoomScene]}
                onExit={() => navigate("/")}
            />
        </>
    )
    
}
