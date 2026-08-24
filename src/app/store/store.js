import { configureStore } from '@reduxjs/toolkit'
import tenantReducer from '../../global/states/tenant.slice.js'
export const store = configureStore({
  reducer: {
    tenant: tenantReducer,
  },
})