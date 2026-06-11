import React, { Component } from 'react';
import { connect } from "react-redux";
import ChatLeftSidebar from "./ChatLeftSidebar";
import UserChat from "./UserChat/index";
import TasksView from "./TasksView";
import TasksRecords from "./Tabs/TasksRecords";
import BlogsView from "./BlogsView";
import PostsView from "./PostsView";
import AdminDashboardMetrics from "./AdminDashboardMetrics";
import GlobalTasksView from "./GlobalTasksView";
import ProductsView from "./ProductsView";
import CartView from "./CartView";
import WishlistView from "./WishlistView";
import OrdersView from "./OrdersView";
import AdminBlogs from "./AdminBlogs";
import AdminPosts from "./AdminPosts";
import AdminProducts from "./AdminProducts";

import { fetchTasks, createTask, updateTaskStatus, deleteTask } from "../../helpers/api/services/tasksService";
import { isAdmin } from "../../helpers/roleUtils";
import { setActiveTab } from "../../redux/actions";

class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tasks: [],
            loading: false
        };
        this.loadTasks = this.loadTasks.bind(this);
        this.handleAddTask = this.handleAddTask.bind(this);
        this.handleUpdateTaskStatus = this.handleUpdateTaskStatus.bind(this);
        this.handleDeleteTask = this.handleDeleteTask.bind(this);
        this.renderMainPane = this.renderMainPane.bind(this);
    }

    componentDidMount() {
        this.loadTasks();

        // Intercept post-login routing phase:
        // If Role === 'admin', force tab selection to load Admin Analytics Dashboard.
        const isUserAdmin = isAdmin();
        if (isUserAdmin && this.props.activeTab === 'chat') {
            this.props.setActiveTab('admin-overview');
        } else if (!isUserAdmin && this.props.activeTab === 'admin-overview') {
            this.props.setActiveTab('chat');
        }
    }

    componentDidUpdate(prevProps) {
        const taskTabs = ['tasks', 'tasks-today', 'tasks-records'];
        if (prevProps.activeTab !== this.props.activeTab && taskTabs.includes(this.props.activeTab)) {
            this.loadTasks();
        }
    }

    async loadTasks() {
        this.setState({ loading: true });
        try {
            const res = await fetchTasks();
            this.setState({ tasks: Array.isArray(res.data) ? res.data : [], loading: false });
        } catch (err) {
            console.error("Failed to load tasks in dashboard index:", err);
            this.setState({ tasks: [], loading: false });
        }
    }

    async handleAddTask(taskData) {
        try {
            const res = await createTask(taskData);
            if (res.data) {
                this.setState(prevState => ({
                    tasks: [res.data, ...prevState.tasks]
                }));
            }
        } catch (err) {
            console.error("Failed to add task:", err);
        }
    }

    async handleUpdateTaskStatus(taskId, status) {
        const prevTasks = [...this.state.tasks];
        const updatedTasks = this.state.tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, status };
            }
            return t;
        });
        this.setState({ tasks: updatedTasks });

        try {
            await updateTaskStatus(taskId, status);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update task status (Enforces progression: Todo -> In Progress -> Completed)");
            console.error("Failed to persist task status update, rolling back:", err);
            this.setState({ tasks: prevTasks });
        }
    }

    async handleDeleteTask(taskId) {
        const prevTasks = [...this.state.tasks];
        const updatedTasks = this.state.tasks.filter(t => t.id !== taskId);
        this.setState({ tasks: updatedTasks });

        try {
            await deleteTask(taskId);
        } catch (err) {
            console.error("Failed to delete task:", err);
            this.setState({ tasks: prevTasks });
        }
    }

    renderMainPane() {
        const { activeTab } = this.props;
        const { tasks, loading } = this.state;

        switch (activeTab) {
            case 'tasks-today':
                return (
                    <TasksView 
                        tasks={tasks} 
                        filterTodayOnly={true}
                        onAddTask={this.handleAddTask} 
                        onUpdateTaskStatus={this.handleUpdateTaskStatus} 
                        onDeleteTask={this.handleDeleteTask}
                    />
                );
            case 'tasks-records':
                return (
                    <TasksRecords 
                        tasks={tasks} 
                        loading={loading} 
                    />
                );
            case 'blogs-my':
                return <BlogsView filterMyOnly={true} />;
            case 'blogs-all':
                return <BlogsView filterMyOnly={false} />;
            case 'posts-my':
                return <PostsView filterMyOnly={true} />;
            case 'posts-all':
                return <PostsView filterMyOnly={false} />;
            case 'products-my':
                return <ProductsView filterMyOnly={true} />;
            case 'products-all':
                return <ProductsView filterMyOnly={false} />;
            case 'cart':
                return <CartView />;
            case 'wishlist':
                return <WishlistView />;
            case 'orders':
                return <OrdersView isSeller={false} />;
            case 'orders-received':
                return <OrdersView isSeller={true} />;
            case 'admin-overview':
                return <AdminDashboardMetrics />;
            case 'admin-global-tasks':
                return <GlobalTasksView />;
            case 'admin-blogs':
                return <AdminBlogs />;
            case 'admin-posts':
                return <AdminPosts />;
            case 'admin-products':
                return <AdminProducts />;
            case 'chat':
            case 'group':
            case 'contacts':
            case 'profile':
            case 'settings':
                return <UserChat recentChatList={this.props.users} />;
            default:
                return <UserChat recentChatList={this.props.users} />;
        }
    }

    render() {
        document.title = "Chat | Chatvia - Responsive Bootstrap 5 Admin Dashboard";
        const { activeTab } = this.props;
        const { tasks, loading } = this.state;

        const hideLeftSidebar = [
            'tasks-today', 'tasks-records', 'blogs-my', 'blogs-all',
            'posts-my', 'posts-all',
            'products-my', 'products-all',
            'admin-overview', 'admin-global-tasks',
            'admin-blogs', 'admin-posts', 'admin-products',
            'cart', 'wishlist', 'orders', 'orders-received'
        ].includes(activeTab);

        return (
            <React.Fragment>
                <div className="d-lg-flex w-100">
                    {/* chat left sidebar */}
                    {!hideLeftSidebar && (
                        <ChatLeftSidebar 
                            recentChatList={this.props.users} 
                            tasks={tasks} 
                            tasksLoading={loading} 
                        />
                    )}

                    {/* main dashboard view pane */}
                    {this.renderMainPane()}
                </div>
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => {
    const { users, active_user } = state.Chat;
    const { activeTab } = state.Layout;
    return { users, activeTab, active_user };
};

export default connect(mapStateToProps, { setActiveTab })(Index);