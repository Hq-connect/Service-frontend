import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import meetingService from "../services/meeting.service";
import {
    setMeetings,
    setLoading,
    setError,
    setCreateDialogOpen,
} from "../states/meeting.slice";
import { toast } from "sonner";

export const useMeetings = () => {
    const dispatch = useDispatch();
    const { meetings, loading, error, createDialogOpen } = useSelector(
        (state) => state.meetings
    );

    const fetchMeetings = useCallback(
        async (params = {}) => {
            try {
                dispatch(setLoading(true));
                dispatch(setError(null));
                const response = await meetingService.getMyMeetings(params);
                const list = response?.data?.meetings || [];
                dispatch(setMeetings(list));
                return list;
            } catch (err) {
                const msg = err.response?.data?.message || "Failed to load meetings";
                dispatch(setError(msg));
                toast.error(msg);
                return [];
            } finally {
                dispatch(setLoading(false));
            }
        },
        [dispatch]
    );

    const createMeeting = async (meetingData) => {
        try {
            dispatch(setLoading(true));
            const response = await meetingService.createMeeting(meetingData);
            const created = response?.data?.meeting;
            toast.success(
                meetingData.type === "instant"
                    ? "Instant meeting started!"
                    : "Meeting scheduled successfully!"
            );
            dispatch(setCreateDialogOpen(false));
            await fetchMeetings();
            return created;
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to create meeting";
            toast.error(msg);
            throw err;
        } finally {
            dispatch(setLoading(false));
        }
    };

    const cancelMeeting = async (meetingId) => {
        try {
            dispatch(setLoading(true));
            await meetingService.cancelMeeting(meetingId);
            toast.success("Meeting cancelled successfully");
            await fetchMeetings();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to cancel meeting";
            toast.error(msg);
        } finally {
            dispatch(setLoading(false));
        }
    };

    const endMeeting = async (meetingId) => {
        try {
            dispatch(setLoading(true));
            await meetingService.endMeeting(meetingId);
            toast.success("Meeting ended successfully");
            await fetchMeetings();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to end meeting";
            toast.error(msg);
        } finally {
            dispatch(setLoading(false));
        }
    };

    const joinByCode = async (joinCode) => {
        try {
            dispatch(setLoading(true));
            const response = await meetingService.joinMeeting(joinCode);
            toast.success("Joined meeting!");
            return response?.data;
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid join code or unable to join";
            toast.error(msg);
            throw err;
        } finally {
            dispatch(setLoading(false));
        }
    };

    const toggleCreateDialog = (open) => {
        dispatch(setCreateDialogOpen(open));
    };

    return {
        meetings,
        loading,
        error,
        createDialogOpen,
        fetchMeetings,
        createMeeting,
        cancelMeeting,
        endMeeting,
        joinByCode,
        toggleCreateDialog,
    };
};

export default useMeetings;
