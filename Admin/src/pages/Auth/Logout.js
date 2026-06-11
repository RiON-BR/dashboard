import React, { useEffect } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import withRouter from "../../components/withRouter";

//redux store
import { logoutUser, logoutUserSuccess } from '../../redux/actions';

import { createSelector } from 'reselect';


/**
 * Logouts the user
 * @param {*} props 
 */
const Logout = (props) => {
  const dispatch = useDispatch();
  // const { isUserLogout } = useSelector((state) => ({
  //     isUserLogout: state.Auth.isUserLogout,
  //   }));

  const layoutdata = createSelector(
    (state) => state.Auth,
    (logoutauth) => ({
      isUserLogout: logoutauth.isUserLogout,
    }),
  );

  // Inside your component
  const isUserLogout = useSelector(layoutdata);

  useEffect(() => {
    // client-side logout: clear stored auth and update redux immediately
    try {
      localStorage.removeItem('authUser');
    } catch (e) {
      // ignore
    }

    dispatch(logoutUserSuccess());
    dispatch(logoutUser(props.router.navigate));

    // safety redirect in case saga/reducer timing changes
    props.router.navigate('/login');
  }, [dispatch, props.router.navigate]);

  if (isUserLogout) {
    return <Navigate to="/login" />;
  }

  document.title = "Logout | Chatvia React - Responsive Bootstrap 5 Chat App";

  return (<React.Fragment></React.Fragment>);
}

export default withRouter(connect(null, { logoutUser })(Logout));