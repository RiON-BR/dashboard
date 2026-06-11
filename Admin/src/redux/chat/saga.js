import { call, put, takeLatest, select } from 'redux-saga/effects';
import axios from 'axios';
import config from '../../config';

import {
  GET_RECENT_CHATS_REQUEST,
  GET_RECENT_CHATS_SUCCESS,
  GET_RECENT_CHATS_FAILURE
} from './constants';

const selectAuthToken = (state) => {
  return state?.Auth?.user?.token || state?.auth?.user?.token || state?.Auth?.token;
};

function* fetchRecentChats() {
  try {
    const token = yield select(selectAuthToken);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const res = yield call(axios.get, `${config.API_URL}/api/chat/recent`, { headers });

    yield put({ type: GET_RECENT_CHATS_SUCCESS, payload: res.data });
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Failed to fetch chats';
    yield put({ type: GET_RECENT_CHATS_FAILURE, payload: message });
  }
}

export default function* chatSaga() {
  yield takeLatest(GET_RECENT_CHATS_REQUEST, fetchRecentChats);
}



