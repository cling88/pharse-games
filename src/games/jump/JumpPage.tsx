import { useNavigate } from "react-router-dom";
import GamePage from "../common/GamePage";
import OneTapJumpScene from "./OneTapJumpScene";

export default function JumpPage() {
    const navigate = useNavigate();

    return(
        <>
            <GamePage
                scene={OneTapJumpScene}
                onExit={() => navigate("/")}
            />
        </>
    )
    
}
