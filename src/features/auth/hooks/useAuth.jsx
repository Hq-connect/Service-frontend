import { useDispatch, useSelector } from "react-redux"
import { authService } from "../services/auth.service"
import { setError, setLoading, setUser } from "../states/auth.states";
import { useCallback } from "react";
function useAuth() {
    const dispatch = useDispatch();
    const { user, loading } = useSelector((state) => state.auth)
    const register = async (userData) => {
        dispatch(setLoading(true));
        try {
            const response = await authService.registerUser(userData);
            dispatch(setUser(response));
            return response;
        } catch (error) {
            dispatch(setError(error.response.data));
        }finally {
            dispatch(setLoading(false));
        }
    };

    const login = async (userData) => {
        dispatch(setLoading(true));
        try {
            const response = await authService.loginUser(userData);
            dispatch(setUser(response));
            return response;
        } catch (error) {
            dispatch(setError(error.response.data));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const logout = async () => {
        dispatch(setLoading(true));
        try {
            await authService.logoutUser();
            dispatch(setUser(null));
        } catch (error) {
            dispatch(setError(error.response.data));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const getCurrentUser = useCallback(async () => {
        try{
            const response = await authService.getCurrentUser();
            dispatch(setUser(response));
            return response;
        } catch (error) {
            dispatch(setError(error.response.data));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    return {
        user,
        loading,
        register,
        login,
        logout,
        getCurrentUser
    };
}

export default useAuth;