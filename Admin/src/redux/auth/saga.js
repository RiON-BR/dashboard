import { all, call, fork, put, takeEvery } from 'redux-saga/effects';
import axios from 'axios';
import config from '../../config';
import { REGISTER_USER, LOGIN_USER } from './constants';
import { loginUserSuccess, registerUserSuccess, apiError } from './actions';

// Register worker function
function* register({ payload: { user, history } }) {
    const navigate = history?.navigate || history;
    try {
        console.log("Saga triggered for register:", user);
        const response = yield call(axios.post, `${config.API_URL}/api/auth/register`, user);
        
        yield put(registerUserSuccess(response.data));
        navigate("/login"); 
    } catch (error) {
        const message = error.response?.data?.message || "Registration failed!";
        yield put(apiError(message));
    }
}

// Watcher function - Yeh rootSaga se connect hone ke liye zaroori hai
export function* watchRegisterUser() {
    yield takeEvery(REGISTER_USER, register);
}

// Default authSaga function jo aapne sagas.js mein call kiya hai
function* login({ payload: { username, password, history } }) {
    const navigate = history?.navigate || history;
    try {
        const response = yield call(axios.post, `${config.API_URL}/api/auth/login`, {
            username,
            password,
        });

        // response.data = { id, name, email, role, token }
yield put(loginUserSuccess(response.data));
        const user = response.data;
        const { setLoggedInUser } = require('../../helpers/authUtils');
        setLoggedInUser(user);
        navigate('/dashboard');
    } catch (error) {
        const message = error.response?.data?.message || 'Invalid credentials';
        yield put(apiError(message));
    }
}

export default function* authSaga() {
    yield all([
        fork(watchRegisterUser),
        takeEvery(LOGIN_USER, login),
    ]);
}

