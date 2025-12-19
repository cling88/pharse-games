import {createBrowserRouter} from 'react-router-dom'
import GameHub from './GameHub'
import DodgePage from '../games/dodge/DodgePage'
import JumpPage from '../games/jump/JumpPage'
import ShooterPage from '../games/shooter/ShooterPage'


export const router = createBrowserRouter([
    {
        path: '/',
        element: <GameHub />,
    },
    {
        path: '/dodge',
        element: <DodgePage />,
    },
    {
        path: '/jump',
        element: <JumpPage />,
    },
    {
        path: '/shooter',
        element: <ShooterPage />,
    }
])