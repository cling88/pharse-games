import { useNavigate } from "react-router-dom";
import GamePage from "../common/GamePage";
import DodgeScene from "./DodgeScene";

export default function DodgePage() {
    const navigate = useNavigate();

    return(
        <>
            <GamePage
                scene={DodgeScene}
                onExit={() => navigate("/")}
            />
        </>
    )
    
}
