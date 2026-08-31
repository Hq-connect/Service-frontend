import { configureStore } from '@reduxjs/toolkit'
import tenantReducer from '../../global/states/tenant.slice.js'
import authReducer from '../../features/auth/states/auth.states.js'
<<<<<<< Updated upstream
import chatReducer from '../../features/chats/states/chat.slice.js'
=======
import meetingsReducer from '../../features/meets/states/meeting.slice.js'

>>>>>>> Stashed changes
export const store = configureStore({
  reducer: {
    tenant: tenantReducer,
    auth: authReducer,
<<<<<<< Updated upstream
    chat: chatReducer,
=======
    meetings: meetingsReducer,
>>>>>>> Stashed changes
  },
})