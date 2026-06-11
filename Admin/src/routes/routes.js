import React from "react";
import { Navigate } from "react-router-dom";

// lazy load all the views
const Dashboard = React.lazy(() => import("../pages/dashboard/index"));
const StarterPage = React.lazy(() => import("../pages/StarterPage/index"));

// Home Page
const Home = React.lazy(() => import("../pages/Home"));
const BlogDetailsPage = React.lazy(() => import("../pages/BlogDetailsPage"));
const BlogEditPage = React.lazy(() => import("../pages/BlogEditPage"));
const CheckoutPage = React.lazy(() => import("../pages/dashboard/CheckoutPage"));

// auth
const Login = React.lazy(() => import("../pages/Auth/Login"));
const Logout = React.lazy(() => import("../pages/Auth/Logout"));
const ForgetPassword = React.lazy(() => import("../pages/Auth/ForgetPassword"));
const Register = React.lazy(() => import("../pages/Auth/Register"));
const LockScreen = React.lazy(() => import("../pages/Auth/LockScreen"));

// declare all routes
const authProtectedRoutes = [
  { path: "/dashboard", component: <Dashboard /> },
  { path: "/pages-starter", component: <StarterPage /> },
  { path: "/blogs/create", component: <BlogEditPage /> },
  { path: "/blogs/edit/:id", component: <BlogEditPage /> },
  { path: "/checkout", component: <CheckoutPage /> },
  { path: "*", component: <Navigate to="/dashboard" /> },
];

const publicRoutes = [
  { path: "/", component: <Home /> },
  { path: "/blogs/:id", component: <BlogDetailsPage /> },
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forget-password", component: <ForgetPassword /> },
  { path: "/register", component: <Register /> },
  { path: "/lock-screen", component: <LockScreen />}
];

export { authProtectedRoutes, publicRoutes };

