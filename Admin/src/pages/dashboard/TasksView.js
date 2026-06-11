import React, { useState } from 'react';
import { 
    Row, Col, Card, CardBody, Button, 
    Modal, ModalHeader, ModalBody, ModalFooter, 
    Form, FormGroup, Label, Input 
} from 'reactstrap';
import { useSelector } from 'react-redux';

function TasksView({ tasks = [], onAddTask, onUpdateTaskStatus, onDeleteTask, filterTodayOnly = false }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [targetColumn, setTargetColumn] = useState('Todo');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskPriority, setTaskPriority] = useState('Medium');

    const toggleModal = () => setModalOpen(!modalOpen);

    const openAddTaskModal = (colStatus) => {
        setTargetColumn(colStatus);
        setTaskTitle('');
        setTaskDesc('');
        setTaskPriority('Medium');
        toggleModal();
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!taskTitle.trim()) return;

        onAddTask({
            title: taskTitle,
            description: taskDesc,
            priority: taskPriority,
            status: targetColumn
        });
        toggleModal();
    };

    // Filter tasks based on today's date if filterTodayOnly is true
    const processedTasks = tasks.filter(task => {
        if (!filterTodayOnly) return true;
        if (!task.createdAt) return false;
        
        const taskDate = new Date(task.createdAt);
        const today = new Date();
        return (
            taskDate.getDate() === today.getDate() &&
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getFullYear() === today.getFullYear()
        );
    });

    // Drag and Drop implementation
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

        // Validation Rules:
        // Todo -> In Progress (Valid)
        // In Progress -> Completed (Valid)
        // All others are invalid
        let isValid = false;
        if (sourceStatus === 'Todo' && targetStatus === 'In Progress') {
            isValid = true;
        } else if (sourceStatus === 'In Progress' && (targetStatus === 'Completed' || targetStatus === 'Done')) {
            isValid = true;
        }

        if (isValid) {
            onUpdateTaskStatus(taskId, targetStatus);
        } else {
            const warningMsg = `Invalid movement: Cannot move task from "${sourceStatus}" to "${targetStatus}". Progression must follow: Todo -> In Progress -> Completed.`;
            console.warn(warningMsg);
            alert(warningMsg);
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

    const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
    const isDark = layoutMode === 'dark';

    const renderColumn = (title, statusName) => {
        const colTasks = processedTasks.filter(t => t.status === statusName || (statusName === 'Completed' && t.status === 'Done'));

        return (
            <Col md={4} className="px-2 mb-4">
                <div 
                    className="p-3 rounded-3 h-100 d-flex flex-column" 
                    style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6', minHeight: '500px' }}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, statusName)}
                >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            <h5 className="font-size-15 mb-0 fw-semibold text-body">{title}</h5>
                            <span 
                                className="badge rounded-pill ms-2 font-size-11"
                                style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#F3F4F6' : '#374151' }}
                            >
                                {colTasks.length}
                            </span>
                        </div>
                    </div>

                    <Button 
                        color="none" 
                        className="w-100 py-2 mb-3 text-muted fw-medium border-dashed border-2 rounded-3 d-flex align-items-center justify-content-center"
                        style={{ borderStyle: 'dashed', borderColor: '#D1D5DB', backgroundColor: 'transparent' }}
                        onClick={() => openAddTaskModal(statusName)}
                    >
                        <i className="ri-add-line me-1"></i> Add task
                    </Button>

                    <div className="flex-grow-1 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                        {colTasks.map(task => {
                            // Calculate simple due date representation (mocked dynamic count)
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
                                                    onClick={() => onDeleteTask && onDeleteTask(task.id)}
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
                                            <div className="avatar-group d-flex">
                                                <div 
                                                    className="avatar-xs rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-medium font-size-10 shadow-sm"
                                                    style={{ width: '24px', height: '24px' }}
                                                >
                                                    U
                                                </div>
                                            </div>
                                            <div className="d-flex gap-3 text-muted font-size-12">
                                                <span><i className="ri-link me-1"></i> 2</span>
                                                <span><i className="ri-chat-3-line me-1"></i> 5</span>
                                            </div>
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

    return (
        <React.Fragment>
            <div className="w-100 p-4" style={{ backgroundColor: isDark ? '#0B0F19' : '#F8F9FA', height: '100vh', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-1 fw-bold text-body">Workspace Board</h4>
                        <p className="text-muted font-size-13 mb-0">Enforce structured workflow drag-and-drop progressions.</p>
                    </div>
                </div>

                <Row className="g-3">
                    {renderColumn('To do', 'Todo')}
                    {renderColumn('In Progress', 'In Progress')}
                    {renderColumn('Completed', 'Completed')}
                </Row>

                {/* Add Task Modal */}
                <Modal isOpen={modalOpen} toggle={toggleModal} centered contentClassName={isDark ? 'bg-dark text-white border-secondary' : ''}>
                    <ModalHeader toggle={toggleModal} className={isDark ? 'border-secondary' : ''}>
                        <span className={isDark ? 'text-white' : ''}>Create New Task</span>
                    </ModalHeader>
                    <Form onSubmit={handleFormSubmit}>
                        <ModalBody className="p-4">
                            <FormGroup className="mb-3">
                                <Label for="task-title-input" className="fw-semibold">Task Title</Label>
                                <Input 
                                    type="text" 
                                    id="task-title-input" 
                                    placeholder="Enter task title" 
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    className={isDark ? 'bg-dark text-white border-secondary' : ''}
                                    required 
                                />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <Label for="task-desc-input" className="fw-semibold">Description</Label>
                                <Input 
                                    type="textarea" 
                                    id="task-desc-input" 
                                    rows="3"
                                    placeholder="Enter description" 
                                    value={taskDesc}
                                    onChange={(e) => setTaskDesc(e.target.value)}
                                    className={isDark ? 'bg-dark text-white border-secondary' : ''}
                                />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <Label for="task-priority-input" className="fw-semibold">Priority</Label>
                                <Input 
                                    type="select" 
                                    id="task-priority-input"
                                    value={taskPriority}
                                    onChange={(e) => setTaskPriority(e.target.value)}
                                    className={isDark ? 'bg-dark text-white border-secondary' : ''}
                                >
                                    <option value="High" style={{ backgroundColor: isDark ? '#111827' : '#fff' }}>High</option>
                                    <option value="Medium" style={{ backgroundColor: isDark ? '#111827' : '#fff' }}>Medium</option>
                                    <option value="Low" style={{ backgroundColor: isDark ? '#111827' : '#fff' }}>Low</option>
                                </Input>
                            </FormGroup>
                            <FormGroup className="mb-0">
                                <Label className="fw-semibold">Column Destination</Label>
                                <Input 
                                    type="text" 
                                    value={targetColumn} 
                                    disabled 
                                    className={isDark ? 'bg-secondary text-white border-secondary' : 'bg-light'} 
                                />
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter className={isDark ? 'border-secondary' : ''}>
                            <Button type="button" color={isDark ? 'secondary' : 'light'} onClick={toggleModal}>Cancel</Button>
                            <Button type="submit" color="primary">Add Task</Button>
                        </ModalFooter>
                    </Form>
                </Modal>
            </div>
        </React.Fragment>
    );
}

export default TasksView;
