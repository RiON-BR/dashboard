import React, { useEffect, useState } from 'react';
import { 
  Row, Col, Card, CardBody, Button, Form, FormGroup, Label, Input 
} from 'reactstrap';
import { useSelector } from 'react-redux';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, CircularProgress, Avatar } from '@mui/material';
import axios from 'axios';
import config from '../../config';
import { fetchGlobalTasks, updateTaskStatus, deleteTask } from '../../helpers/api/services/tasksService';

export default function GlobalTasksView() {
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser'))?.token : '';
      const [tasksRes, usersRes] = await Promise.all([
        fetchGlobalTasks(),
        axios.get(`${config.API_URL}/api/users`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        })
      ]);
      setTasks(tasksRes.data || tasksRes || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch global tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (taskId, targetStatus) => {
    const originalTasks = [...tasks];
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    try {
      await updateTaskStatus(taskId, targetStatus);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status (Enforces progression: Todo -> In Progress -> Completed)');
      // Rollback
      setTasks(originalTasks);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (err) {
        alert(err.message || 'Failed to delete task');
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6C737F';
    }
  };

  // Drag and Drop
  const onDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('sourceStatus', task.status);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData('taskId'));
    const sourceStatus = e.dataTransfer.getData('sourceStatus');

    // Progression check
    let isValid = false;
    if (sourceStatus === 'Todo' && targetStatus === 'In Progress') {
      isValid = true;
    } else if (sourceStatus === 'In Progress' && (targetStatus === 'Completed' || targetStatus === 'Done')) {
      isValid = true;
    }

    if (isValid) {
      handleUpdateStatus(taskId, targetStatus);
    } else {
      alert(`Invalid transition: Cannot drag from "${sourceStatus}" to "${targetStatus}". Progression must be: Todo -> In Progress -> Completed.`);
    }
  };

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    const matchUser = selectedUser === 'all' || Number(task.userId) === Number(selectedUser);
    const matchPriority = selectedPriority === 'all' || task.priority?.toLowerCase() === selectedPriority.toLowerCase();
    return matchUser && matchPriority;
  });

  const renderColumn = (title, statusName) => {
    const colTasks = filteredTasks.filter(t => t.status === statusName || (statusName === 'Completed' && t.status === 'Done'));

    return (
      <Col md={4} className="px-2 mb-4">
        <div 
          className="p-3 rounded-3 h-100 d-flex flex-column" 
          style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6', minHeight: '550px' }}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, statusName)}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <h5 className="font-size-15 mb-0 fw-bold text-body">{title}</h5>
              <span 
                className="badge rounded-pill ms-2 font-size-11"
                style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#F3F4F6' : '#374151' }}
              >
                {colTasks.length}
              </span>
            </div>
          </div>

          <div className="flex-grow-1 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            {colTasks.map(task => {
              const dueDays = (task.id % 5) + 2; 

              return (
                <Card 
                  key={task.id} 
                  className="border-0 shadow-sm mb-3 cursor-grab"
                  style={{ border: isDark ? '1px solid #374151' : '1px solid #F1F5F9', borderRadius: '10px', backgroundColor: isDark ? '#111827' : '#FFFFFF' }}
                  draggable
                  onDragStart={(e) => onDragStart(e, task)}
                >
                  <CardBody className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span 
                        className="font-size-11 fw-medium px-2 py-0.5 rounded"
                        style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#9CA3AF' : '#6C737F' }}
                      >
                        Due {dueDays} days
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn btn-link text-danger p-0 border-0 line-height-1"
                          style={{ outline: 'none', boxShadow: 'none' }}
                          title="Delete task"
                        >
                          <i className="ri-delete-bin-line font-size-14"></i>
                        </button>
                        <span 
                          className="dot rounded-circle"
                          style={{ width: '8px', height: '8px', backgroundColor: getPriorityColor(task.priority) }}
                        />
                      </div>
                    </div>

                    <h5 className="font-size-14 fw-bold text-body mb-1">{task.title}</h5>
                    {task.description && (
                      <p 
                        className="text-muted font-size-13 mb-3 text-truncate-2-lines"
                        style={{ 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {task.description}
                      </p>
                    )}

                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-light">
                      <div className="d-flex align-items-center gap-1.5">
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem', bgcolor: 'secondary.main', fontWeight: 600 }}>
                          {String(task.ownerName || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {task.ownerName || 'Unknown'}
                        </Typography>
                      </div>
                      <span className="badge font-size-11 text-capitalize" style={{ backgroundColor: '#E2E8F0', color: '#475569' }}>
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </Col>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, height: '100vh' }}>
        <Typography color="error" variant="h6">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: isDark ? '#0B0F19' : '#F8F9FA', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#F3F4F6' : '#111927', fontFamily: 'Inter, sans-serif' }}>
            Global Workspace Board
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontFamily: 'Inter, sans-serif' }}>
            Monitor and progression-audit tasks across the entire company.
          </Typography>
        </Box>
      </Box>

      {/* Filter Dropdowns Toolbars */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, bgcolor: isDark ? '#111827' : '#FFFFFF', p: 2.5, borderRadius: 3, border: isDark ? '1px solid #374151' : '1px solid #E5E7EB' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="filter-user-label">Filter by User</InputLabel>
          <Select
            labelId="filter-user-label"
            value={selectedUser}
            label="Filter by User"
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <MenuItem value="all">All Users</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.ID} value={user.ID}>
                {user.DISPLAY_NAME || user.USERNAME || user.EMAIL}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="filter-priority-label">Filter by Priority</InputLabel>
          <Select
            labelId="filter-priority-label"
            value={selectedPriority}
            label="Filter by Priority"
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Kanban Board */}
      <Row className="g-3">
        {renderColumn('To do', 'Todo')}
        {renderColumn('In Progress', 'In Progress')}
        {renderColumn('Completed', 'Completed')}
      </Row>
    </Box>
  );
}
