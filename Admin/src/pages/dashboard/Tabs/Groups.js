import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, UncontrolledTooltip, Form, Label, Input, Alert, InputGroup, Badge } from 'reactstrap';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import SimpleBar from "simplebar-react";
import Select from 'react-select';
import axios from 'axios';
import config from '../../../config';
import { useSelector } from 'react-redux';

export default function Groups() {
  const { t } = useTranslation();
  const layoutMode = useSelector((state) => state.Layout.layoutMode) || 'light';
  const isDark = layoutMode === 'dark';

  const [modal, setModal] = useState(false);
  const [groupsList, setGroupsList] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isOpenAlert, setIsOpenAlert] = useState(false);
  const [message, setMessage] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const toggle = () => setModal(!modal);

  // Fetch groups and contacts on mount
  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const token = authUser.token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const loadData = async () => {
      try {
        // Fetch groups
        const groupsRes = await axios.get(`${config.API_URL}/api/groups`, { headers });
        setGroupsList(groupsRes.data || []);

        // Fetch contacts
        const usersRes = await axios.get(`${config.API_URL}/api/users`, { headers });
        const users = usersRes.data || [];
        setContactsList(users.map(u => ({
          value: u.ID,
          label: u.DISPLAY_NAME || u.USERNAME || u.EMAIL
        })));
      } catch (err) {
        console.error("Failed to load groups/contacts:", err);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Explicit validation check
    if (selectedMembers.length === 0) {
      setMessage("Please Select Members!!!");
      setIsOpenAlert(true);
      setTimeout(() => setIsOpenAlert(false), 3000);
      return;
    }

    if (!groupName.trim()) {
      setMessage("Group Name is required!!!");
      setIsOpenAlert(true);
      setTimeout(() => setIsOpenAlert(false), 3000);
      return;
    }

    try {
      const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      const token = authUser.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const payload = {
        name: "#" + groupName.trim(),
        description: groupDesc,
        selectedMembers: selectedMembers
      };

      const res = await axios.post(`${config.API_URL}/api/groups`, payload, { headers });
      
      // Add the new group at the beginning of the list
      setGroupsList(prev => [res.data.group, ...prev]);
      
      // Reset state and close modal
      setGroupName("");
      setGroupDesc("");
      setSelectedMembers([]);
      setModal(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create group");
      setIsOpenAlert(true);
      setTimeout(() => setIsOpenAlert(false), 3000);
    }
  };

  // Select custom styles for dark mode
  const selectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderColor: isDark ? '#374151' : '#D1D5DB',
      color: isDark ? '#F3F4F6' : '#111827',
      '&:hover': {
        borderColor: isDark ? '#60A5FA' : '#3B82F6'
      }
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected 
        ? (isDark ? '#3B82F6' : '#2563EB')
        : isFocused 
          ? (isDark ? '#374151' : '#F3F4F6')
          : 'transparent',
      color: isSelected ? '#FFFFFF' : (isDark ? '#F3F4F6' : '#111827'),
    }),
    multiValue: (styles) => ({
      ...styles,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
    }),
    multiValueLabel: (styles) => ({
      ...styles,
      color: isDark ? '#F3F4F6' : '#111827',
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      color: isDark ? '#9CA3AF' : '#4B5563',
      '&:hover': {
        backgroundColor: isDark ? '#EF4444' : '#FCA5A5',
        color: '#FFFFFF'
      }
    })
  };

  return (
    <React.Fragment>
      <div style={{ width: '100%' }}>
        <div className="p-4">
          <div className="user-chat-nav float-end">
            <div id="create-group">
              <Button onClick={toggle} type="button" color="link" className="text-decoration-none text-muted font-size-18 py-0">
                <i className="ri-group-line me-1"></i>
              </Button>
            </div>
            <UncontrolledTooltip target="create-group" placement="bottom">
              Create group
            </UncontrolledTooltip>
          </div>
          <h4 className="mb-4">{t('Groups')}</h4>

          {/* Start add group Modal */}
          <Modal isOpen={modal} centered toggle={toggle}>
            <ModalHeader tag="h5" className="modal-title font-size-14" toggle={toggle}>
              {t('Create New Group')}
            </ModalHeader>
            <ModalBody className="p-4" style={{ backgroundColor: isDark ? '#111827' : '#FFFFFF', color: isDark ? '#F3F4F6' : '#111827' }}>
              <Form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Label className="form-label" htmlFor="addgroupname-input" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    {t('Group Name')}
                  </Label>
                  <Input 
                    type="text" 
                    className="form-control" 
                    id="addgroupname-input" 
                    value={groupName} 
                    onChange={(e) => setGroupName(e.target.value)} 
                    placeholder="Enter Group Name" 
                    style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF', color: isDark ? '#F3F4F6' : '#111827', borderColor: isDark ? '#374151' : '#D1D5DB' }}
                  />
                </div>
                
                <div className="mb-4">
                  <Label className="form-label" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    {t('Group Members')}
                  </Label>
                  {isOpenAlert && (
                    <Alert color="danger" className="py-2 mb-3">
                      {message}
                    </Alert>
                  )}
                  
                  <Select
                    isMulti
                    options={contactsList}
                    onChange={(selectedOptions) => setSelectedMembers(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                    styles={selectStyles}
                    placeholder="Select Members..."
                    classNamePrefix="react-select"
                  />
                </div>

                <div>
                  <Label className="form-label" htmlFor="addgroupdescription-input" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    Description
                  </Label>
                  <textarea 
                    className="form-control" 
                    id="addgroupdescription-input" 
                    value={groupDesc} 
                    onChange={(e) => setGroupDesc(e.target.value)} 
                    rows="3" 
                    placeholder="Enter Description"
                    style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF', color: isDark ? '#F3F4F6' : '#111827', borderColor: isDark ? '#374151' : '#D1D5DB' }}
                  ></textarea>
                </div>
              </Form>
            </ModalBody>
            <ModalFooter style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6', borderColor: isDark ? '#374151' : '#E5E7EB' }}>
              <Button type="button" color="link" onClick={toggle} style={{ color: isDark ? '#9CA3AF' : '#4B5563' }}>
                {t('Close')}
              </Button>
              <Button type="button" color="primary" onClick={handleSubmit}>
                Create Group
              </Button>
            </ModalFooter>
          </Modal>
          {/* End add group Modal */}

          <div className="search-box chat-search-box">
            <InputGroup size="lg" className="bg-light rounded-lg">
              <Button color="link" className="text-decoration-none text-muted pr-1" type="button">
                <i className="ri-search-line search-icon font-size-18"></i>
              </Button>
              <Input type="text" className="form-control bg-light" placeholder="Search groups..." />
            </InputGroup>
          </div>
        </div>

        {/* Start chat-group-list */}
        <SimpleBar style={{ maxHeight: "100%" }} className="p-4 chat-message-list chat-group-list">
          <ul className="list-unstyled chat-list">
            {groupsList.map((group, key) => (
              <li key={key}>
                <Link to="#">
                  <div className="d-flex align-items-center">
                    <div className="chat-user-img me-3 ms-0">
                      <div className="avatar-xs">
                        <span className="avatar-title rounded-circle bg-primary-subtle text-primary">
                          {group.name ? group.name.charAt(1).toUpperCase() : 'G'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <h5 className="text-truncate font-size-14 mb-0" style={{ color: isDark ? '#F3F4F6' : '#111827' }}>
                        {group.name}
                        {group.isNew && (
                          <Badge color="none" pill className="badge-soft-danger float-end">New</Badge>
                        )}
                      </h5>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SimpleBar>
      </div>
    </React.Fragment>
  );
}