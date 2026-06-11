import React, { useState } from 'react';
import { Badge, Input, InputGroup, Spinner } from 'reactstrap';
import SimpleBar from "simplebar-react";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Typography, Box, Grid, Chip 
} from '@mui/material';
import { 
  Assignment as TaskIcon, 
  CalendarToday as DateIcon, 
  PriorityHigh as PriorityIcon, 
  Info as StatusIcon 
} from '@mui/icons-material';

export default function TasksRecords({ tasks = [], loading = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleOpenDetail = (task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
    setDetailOpen(false);
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Done':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Todo':
        return 'secondary';
      default:
        return 'light';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const query = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.status?.toLowerCase().includes(query)
    );
  });

  return (
    <Box sx={{ py: 5, px: 4, bgcolor: '#F8F9FA', flexGrow: 1, height: '100vh', overflowY: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#111927', fontFamily: 'Inter, sans-serif' }}>
          Task Records Directory
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontFamily: 'Inter, sans-serif' }}>
          Historical logs and details database for all tasks.
        </Typography>
      </Box>

      {/* Search Box */}
      <Box sx={{ mb: 4, maxWidth: 500 }}>
        <InputGroup className="bg-white rounded-3 shadow-sm border">
          <span className="input-group-text text-muted bg-white pe-1 ps-3 border-0">
            <i className="ri-search-line search-icon font-size-18"></i>
          </span>
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="form-control border-0 bg-white"
            placeholder="Search records by title, description or status..."
          />
        </InputGroup>
      </Box>

      {/* List container */}
      <SimpleBar style={{ maxHeight: "70vh" }} className="chat-message-list">
        {loading ? (
          <div className="text-center p-4">
            <Spinner color="primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #E5E7EB' }}>
            <Typography variant="body1" color="textSecondary">No task records found.</Typography>
          </Box>
        ) : (
          <ul className="list-unstyled chat-list chat-user-list">
            {filteredTasks.map((task, index) => (
              <li 
                key={task.id || index} 
                onClick={() => handleOpenDetail(task)}
                className="p-3 mb-2 rounded border border-light bg-white shadow-sm cursor-pointer hover-shadow"
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1 overflow-hidden">
                    <h5 className="font-size-15 fw-bold text-dark mb-1">{task.title}</h5>
                    {task.description && (
                      <p className="text-muted font-size-13 text-truncate mb-2">{task.description}</p>
                    )}
                    <div className="d-flex gap-2 align-items-center">
                      <Badge color={getPriorityBadgeColor(task.priority)} className="rounded-pill">
                        {task.priority || 'Medium'}
                      </Badge>
                      <Badge color={getStatusBadgeColor(task.status)} className="rounded-pill">
                        {task.status}
                      </Badge>
                      <span className="text-muted font-size-11 ms-auto">
                        Created: {new Date(task.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SimpleBar>

      {/* Task Description Breakdown Modal */}
      {selectedTask && (
        <Dialog 
          open={detailOpen} 
          onClose={handleCloseDetail}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 3, p: 1.5 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon color="primary" /> Task Breakdown
          </DialogTitle>
          <DialogContent dividers sx={{ py: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: '#111927' }}>
              {selectedTask.title}
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedTask.description || 'No description provided for this task.'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PriorityIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Priority</Typography>
                    <Chip 
                      label={selectedTask.priority || 'Medium'} 
                      size="small" 
                      color={
                        selectedTask.priority?.toLowerCase() === 'high' ? 'error' : 
                        selectedTask.priority?.toLowerCase() === 'medium' ? 'warning' : 'info'
                      }
                      sx={{ fontWeight: 600, mt: 0.5 }}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatusIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Status</Typography>
                    <Chip 
                      label={selectedTask.status} 
                      size="small" 
                      color={
                        selectedTask.status === 'Completed' || selectedTask.status === 'Done' ? 'success' : 
                        selectedTask.status === 'In Progress' ? 'primary' : 'secondary'
                      }
                      sx={{ fontWeight: 600, mt: 0.5 }}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <DateIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Created Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {new Date(selectedTask.createdAt || Date.now()).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pt: 2 }}>
            <Button onClick={handleCloseDetail} variant="contained" sx={{ borderRadius: 2 }}>
              Close Breakdown
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
