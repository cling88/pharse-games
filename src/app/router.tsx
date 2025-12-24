import {createBrowserRouter, type RouteObject} from 'react-router-dom'
import GameHub from './GameHub'
import DodgePage from '../games/dodge/DodgePage'
import JumpPage from '../games/jump/JumpPage'
import ShooterPage from '../games/shooter/ShooterPage'
import RhythmPage from '../games/rhythm/RhythmPage'
import TacticsPage from '../games/tactics/TacticsPage'
import EscapePage from '../games/escape/EscapePage'

// 게임 라우트 정의 (GameHub에서 자동으로 메뉴 생성에 사용)
export interface GameRoute {
    path: string;
    name: string;
    element: React.ReactElement;
}

export const gameRoutes: GameRoute[] = [
    {
        path: '/dodge',
        name: 'Dodge',
        element: <DodgePage />,
    },
    {
        path: '/jump',
        name: 'One-Tap Jump',
        element: <JumpPage />,
    },
    {
        path: '/shooter',
        name: 'Minimal Shooter',
        element: <ShooterPage />,
    },
    {
        path: '/rhythm',
        name: 'Rhythm',
        element: <RhythmPage />,
    },
    {
        path: '/tactics',
        name: 'Tactics',
        element: <TacticsPage />,
    },
    {
        path: '/escape',
        name: 'Escape',
        element: <EscapePage />,
    }
];

// 전체 라우터 설정
const routes: RouteObject[] = [
    {
        path: '/',
        element: <GameHub />,
    },
    ...gameRoutes,
];

export const router = createBrowserRouter(routes, {
    basename: import.meta.env.PROD ? '/pharse-games' : undefined,
})