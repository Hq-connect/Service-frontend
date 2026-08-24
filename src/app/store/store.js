import { configureStore } from '@reduxjs/toolkit'
import tenantReducer from '../../global/states/tenant.slice.js'
import authReducer from '../../features/auth/states/auth.states.js'
export const store = configureStore({
  reducer: {
    tenant: tenantReducer,
    auth: authReducer,
  },
})