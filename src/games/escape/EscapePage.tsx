import { useNavigate } from "react-router-dom";
import GamePage from "../common/GamePage";
import MainHallScene from "./scene/MainHallScene";
import MeetingRoomScene from "./scene/MeetingRoomScene";
import ServerRoomScene from "./scene/ServerRoomScene";
import StorageRoomScene from "./scene/StorageRoomScene";

// puzzles
import PatternPuzzleScene from "./puzzle/PatternPuzzleScene";
import TimingPuzzleScene from "./puzzle/TimingPuzzleScene";
import SequencePuzzleScene from "./puzzle/SequencePuzzleScene";

export default function EscapePage() {
    const navigate = useNavigate();

    return(
        <>
            <GamePage
                scene={[MainHallScene, MeetingRoomScene, ServerRoomScene, StorageRoomScene, PatternPuzzleScene, TimingPuzzleScene, SequencePuzzleScene]}
                onExit={() => navigate("/")}
            />
        </>
    )
    
}
