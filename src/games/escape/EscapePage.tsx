import { useNavigate } from "react-router-dom";
import GamePage from "../common/GamePage";
import ExplorationScene from "./scene/ExplorationScene";

export default function EscapePage() {
    const navigate = useNavigate();

    return(
        <>
            <GamePage
                scene={ExplorationScene}
                onExit={() => navigate("/")}
            />
        </>
    )
    
}
