import { configureStore } from '@reduxjs/toolkit'
import tenantReducer from '../../global/states/tenant.slice.js'
import authReducer from '../../features/auth/states/auth.states.js'
import chatReducer from '../../features/chats/states/chat.slice.js'
import meetingsReducer from '../../features/meets/states/meeting.slice.js'
import notificationReducer from '../../features/notifications/states/notification.slice.js'

export const store = configureStore({
  reducer: {
    tenant: tenantReducer,
    auth: authReducer,
    chat: chatReducer,
    meetings: meetingsReducer,
    notifications: notificationReducer,
  },
})