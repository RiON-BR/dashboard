import {
  CHAT_USER,
  ACTIVE_USER,
  FULL_USER,
  ADD_LOGGED_USER,
  CREATE_GROUP,
  GET_RECENT_CHATS_SUCCESS,
  GET_RECENT_CHATS_FAILURE
} from './constants';

const INIT_STATE = {
  active_user: 0,
  users: [],
  groups: [],
  contacts: [],
  recentChatsLoading: false,
  recentChatsError: null
};

const Chat = (state = INIT_STATE, action) => {
  switch (action.type) {
    case CHAT_USER:
      return { ...state };

    case ACTIVE_USER:
      return {
        ...state,
        active_user: action.payload
      };

    case FULL_USER:
      return {
        ...state,
        users: action.payload
      };

    case ADD_LOGGED_USER: {
      const newUser = action.payload;
      return {
        ...state,
        users: [...state.users, newUser]
      };
    }

    case CREATE_GROUP: {
      const newGroup = action.payload;
      return {
        ...state,
        groups: [...state.groups, newGroup]
      };
    }

    case GET_RECENT_CHATS_SUCCESS:
      return {
        ...state,
        users: Array.isArray(action.payload) ? action.payload : [],
        active_user: 0,
        recentChatsLoading: false,
        recentChatsError: null
      };

    case GET_RECENT_CHATS_FAILURE:
      return {
        ...state,
        recentChatsLoading: false,
        recentChatsError: action.payload || 'Failed to fetch chats'
      };

    default:
      return { ...state };
  }
};

export default Chat;

