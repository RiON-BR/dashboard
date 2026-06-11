import {
  CHAT_USER,
  ACTIVE_USER,
  FULL_USER,
  ADD_LOGGED_USER,
  CREATE_GROUP,
  GET_RECENT_CHATS_REQUEST,
  GET_RECENT_CHATS_SUCCESS,
  GET_RECENT_CHATS_FAILURE
} from './constants';

export const chatUser = () => ({
  type: CHAT_USER
});

export const activeUser = (userId) => ({
  type: ACTIVE_USER,
  payload: userId
});

export const setFullUser = (fullUser) => ({
  type: FULL_USER,
  payload: fullUser
});

export const addLoggedinUser = (userData) => ({
  type: ADD_LOGGED_USER,
  payload: userData
});

export const createGroup = (groupData) => ({
  type: CREATE_GROUP,
  payload: groupData
});

// Chat REST
export const getRecentChatsRequest = () => ({
  type: GET_RECENT_CHATS_REQUEST
});

export const getRecentChatsSuccess = (conversations) => ({
  type: GET_RECENT_CHATS_SUCCESS,
  payload: conversations
});

export const getRecentChatsFailure = (errorMessage) => ({
  type: GET_RECENT_CHATS_FAILURE,
  payload: errorMessage
});

