import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { getCurrentUserRole } from '../helpers/roleUtils';

/**
 * Gate UI based on JWT ROLE claim.
 *
 * Usage:
 *   <RequireRole roles={['admin']}>...</RequireRole>
 */
const RequireRole = ({ roles = [], children }) => {
  const authUser = useSelector((state) => state.Auth?.user);

  const roleFromJwt = getCurrentUserRole();
  const role = roleFromJwt || authUser?.role;

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  const normalized = String(role).toLowerCase();
  const ok = roles.some((r) => String(r).toLowerCase() === normalized);
  if (!ok) {
    // Keep the app stable; you can also navigate to a 403 page.
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RequireRole;

