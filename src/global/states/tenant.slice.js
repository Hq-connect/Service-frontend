import { createSlice } from "@reduxjs/toolkit";
import { getTenantSlug } from "../utils/tenant";


const initialSlug = getTenantSlug();

const initialState = {
    slug: initialSlug,
    tenant: null,
    initialized: !!initialSlug,
    loading: true,
};

const tenantSlice = createSlice({
    name: "tenant",

    initialState,

    reducers: {
        setTenant: (state, action) => {
            state.tenant = action.payload.tenant || null;
            state.initialized = true;
        },

        setTenantData: (state, action) => {
            state.tenant = action.payload;
        },

        setTenantLoading: (state, action) => {
            state.loading = action.payload;
        },

        clearTenant: (state) => {
            state.slug = null;
            state.tenant = null;
            state.initialized = false;
            state.loading = false;
        },
    },
});

export const {
    setTenant,
    setTenantData,
    setTenantLoading,
    clearTenant,
} = tenantSlice.actions;

export default tenantSlice.reducer;