import React, { useState, useEffect, useRef } from 'react';
import { DropdownMenu, DropdownItem, DropdownToggle, UncontrolledDropdown, Modal, ModalHeader, ModalBody, CardBody, Button, ModalFooter } from "reactstrap";
import { connect } from "react-redux";

import SimpleBar from "simplebar-react";

import withRouter from "../../../components/withRouter";

//Import Components
import UserProfileSidebar from "../../../components/UserProfileSidebar";
import SelectContact from "../../../components/SelectContact";
import UserHead from "./UserHead";
import ImageList from "./ImageList";
import ChatInput from "./ChatInput";
import FileList from "./FileList";

import { openUserSidebar, setFullUser, getRecentChatsRequest } from "../../../redux/actions";
import { sendMessage } from "../../../helpers/api/services/chatService";
import axios from 'axios';
import config from '../../../config';

//Import Images
import avatar4 from "../../../assets/images/users/avatar-4.jpg";
import avatar1 from "../../../assets/images/users/avatar-1.jpg";

//i18n
import { useTranslation } from 'react-i18next';

function UserChat(props) {

    const ref = useRef();

    const [modal, setModal] = useState(false);

    /* intilize t variable for multi language implementation */
    const { t } = useTranslation();

    //demo conversation messages
    //userType must be required
    const [allUsers, setAllUsers] = useState(props.recentChatList || []);
    const [chatMessages, setchatMessages] = useState(
        props.recentChatList && props.recentChatList[props.active_user]
            ? props.recentChatList[props.active_user].messages || []
            : []
    );

    useEffect(() => {
        setAllUsers(props.recentChatList || []);
        const activeUser = props.recentChatList && props.recentChatList[props.active_user];
        if (activeUser) {
            setchatMessages(activeUser.messages || []);
        } else {
            setchatMessages([]);
        }

        if (ref.current && ref.current.recalculate) {
            ref.current.recalculate();
            if (ref.current.el) {
                ref.current.getScrollElement().scrollTop = ref.current.getScrollElement().scrollHeight;
            }
        }
    }, [props.active_user, props.recentChatList]);

    const toggle = () => setModal(!modal);

    const handleAcceptRequest = async () => {
        try {
            const token = props.token || JSON.parse(localStorage.getItem('authUser'))?.token;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.post(`${config.API_URL}/api/chat/conversation/${activeUser.id}/accept`, {}, { headers });
            props.getRecentChatsRequest();
        } catch (err) {
            console.error("Failed to accept chat request:", err);
            alert(err.response?.data?.message || "Failed to accept chat request");
        }
    };

    const handleRejectRequest = async () => {
        if (window.confirm("Are you sure you want to reject this chat request?")) {
            try {
                const token = props.token || JSON.parse(localStorage.getItem('authUser'))?.token;
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                await axios.post(`${config.API_URL}/api/chat/conversation/${activeUser.id}/reject`, {}, { headers });
                props.getRecentChatsRequest();
            } catch (err) {
                console.error("Failed to reject chat request:", err);
                alert(err.response?.data?.message || "Failed to reject chat request");
            }
        }
    };

    const addMessage = async (message, type) => {
        const activeUserObj = props.recentChatList && props.recentChatList[props.active_user];
        if (!activeUserObj || !activeUserObj.id) {
            console.error("No active conversation to send message to");
            return;
        }

        var messageObj = null;
        let d = new Date();
        var n = d.getSeconds();

        if (type === "textMessage") {
            try {
                const response = await sendMessage(activeUserObj.id, message);
                // response is the data object containing the new message properties
                const resData = response.data || response;
                messageObj = {
                    id: resData.id || (chatMessages.length + 1),
                    message: message,
                    time: resData.time || (String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0')),
                    userType: "sender",
                    image: avatar4,
                    isFileMessage: false,
                    isImageMessage: false
                };
            } catch (err) {
                console.error("Failed to persist message on server:", err);
                messageObj = {
                    id: chatMessages.length + 1,
                    message: message,
                    time: String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0'),
                    userType: "sender",
                    image: avatar4,
                    isFileMessage: false,
                    isImageMessage: false
                };
            }
        } else {
            switch (type) {
                case "fileMessage":
                    messageObj = {
                        id: chatMessages.length + 1,
                        message: 'file',
                        fileMessage: message.name,
                        size: message.size,
                        time: "00:" + n,
                        userType: "sender",
                        image: avatar4,
                        isFileMessage: true,
                        isImageMessage: false
                    };
                    break;

                case "imageMessage":
                    var imageMessage = [
                        { image: message },
                    ];

                    messageObj = {
                        id: chatMessages.length + 1,
                        message: 'image',
                        imageMessage: imageMessage,
                        size: message.size,
                        time: "00:" + n,
                        userType: "sender",
                        image: avatar4,
                        isImageMessage: true,
                        isFileMessage: false
                    };
                    break;

                default:
                    break;
            }
        }

        if (messageObj) {
            setchatMessages([...chatMessages, messageObj]);

            let copyallUsers = [...allUsers];
            copyallUsers[props.active_user].messages = [...chatMessages, messageObj];
            copyallUsers[props.active_user].isTyping = false;
            props.setFullUser(copyallUsers);

            scrolltoBottom();
        }
    }

    function scrolltoBottom() {
        if (ref.current.el) {
            ref.current.getScrollElement().scrollTop = ref.current.getScrollElement().scrollHeight;
        }
    }


    const deleteMessage = (id) => {
        let conversation = chatMessages;

        var filtered = conversation.filter(function (item) {
            return item.id !== id;
        });

        setchatMessages(filtered);
    }



    const active_user = props.active_user;
    const isValidActiveIndex = props.recentChatList && Number.isFinite(active_user) && active_user >= 0 && active_user < props.recentChatList.length;
    const activeUser = isValidActiveIndex ? props.recentChatList[active_user] : null;

    if (active_user === null || active_user === undefined || !activeUser) {
        return (
            <React.Fragment>
                <div className="user-chat w-100 overflow-hidden d-flex align-items-center justify-content-center">
                    <div className="text-center p-4">
                        <div className="avatar-xl mb-4 mx-auto bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '96px', height: '96px' }}>
                            <i className="ri-message-3-line" style={{ fontSize: '48px' }}></i>
                        </div>
                        <h4 className="fw-semibold mb-2">Welcome to Chatvia!</h4>
                        <p className="text-muted max-w-sm">Select a contact from the sidebar or start a new conversation to begin chatting.</p>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    const isPending = activeUser && activeUser.isGroup !== true && activeUser.chatStatus === 'pending';

    return (
        <React.Fragment>
            <div className="user-chat w-100 overflow-hidden">

                <div className="d-lg-flex">

                    <div className={props.userSidebar ? "w-70 overflow-hidden position-relative" : "w-100 overflow-hidden position-relative"}>

                        {/* render user head */}
                        <UserHead  />

                        {isPending ? (
                            <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: 'calc(100% - 120px)', minHeight: '350px' }}>
                                <div className="text-center p-4">
                                    <div className="avatar-xl mb-4 mx-auto bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '96px', height: '96px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '50%' }}>
                                        <i className="ri-user-add-line" style={{ fontSize: '48px' }}></i>
                                    </div>
                                    <h4 className="fw-semibold mb-2">Chat Request Pending</h4>
                                    
                                    {activeUser.user2Id === props.currentUserId ? (
                                        <>
                                            <p className="text-muted max-w-sm mb-4">You have received a chat request from this user. Accept or reject it to manage the chat.</p>
                                            <div className="d-flex gap-2 justify-content-center">
                                                <Button color="primary" onClick={handleAcceptRequest} className="px-4 py-2" style={{ backgroundColor: '#7269ef', borderColor: '#7269ef', borderRadius: '8px', fontWeight: 600 }}>
                                                    Accept Request
                                                </Button>
                                                <Button color="danger" onClick={handleRejectRequest} className="px-4 py-2" style={{ borderRadius: '8px', fontWeight: 600 }}>
                                                    Reject Request
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted max-w-sm">Waiting for the recipient to accept your chat request.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <SimpleBar
                                    style={{ maxHeight: "100%" }}
                                    ref={ref}
                                    className="chat-conversation p-5 p-lg-4"
                                    id="messages">
                            <ul className="list-unstyled mb-0">


                                {
                                    chatMessages.map((chat, key) =>
                                        chat.isToday && chat.isToday === true ? <li key={"dayTitle" + key}>
                                            <div className="chat-day-title">
                                                <span className="title">Today</span>
                                            </div>
                                        </li> :
                                            (activeUser.isGroup === true) ?
                                                <li key={key} className={chat.userType === "sender" ? "right" : ""}>
                                                    <div className="conversation-list">
                                                        { /* previously broken conditional: removed for valid JSX */ }

                                                        {
                                                            //logic for display user name and profile only once, if current and last messaged sent by same receiver
                                                        }

                                                        <div className="chat-avatar">
                                                            {chat.userType === "sender" ? <img src={avatar1} alt="chatvia" /> :
                                                                activeUser.profilePicture === "Null" ?
                                                                    <div className="chat-user-img align-self-center me-3">
                                                                        <div className="avatar-xs">
                                                                            <span className="avatar-title rounded-circle bg-primary-subtle text-primary">
                                                                                {chat.userName && chat.userName.charAt(0)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    : <img src={activeUser.profilePicture} alt="chatvia" />
                                                            }
                                                        </div>

                                                        <div className="user-chat-content">
                                                            <div className="ctext-wrap">
                                                                <div className="ctext-wrap-content">
                                                                    {
                                                                        chat.message &&
                                                                        <p className="mb-0">
                                                                            {chat.message}
                                                                        </p>
                                                                    }
                                                                    {
                                                                        chat.imageMessage &&
                                                                        // image list component
                                                                        <ImageList images={chat.imageMessage} />
                                                                    }
                                                                    {
                                                                        chat.fileMessage &&
                                                                        //file input component
                                                                        <FileList fileName={chat.fileMessage} fileSize={chat.size} />
                                                                    }
                                                                    {
                                                                        chat.isTyping &&
                                                                        <p className="mb-0">
                                                                            typing
                                                                            <span className="animate-typing">
                                                                                <span className="dot ms-1"></span>
                                                                                <span className="dot ms-1"></span>
                                                                                <span className="dot ms-1"></span>
                                                                            </span>
                                                                        </p>
                                                                    }
                                                                    {
                                                                        !chat.isTyping && <p className="chat-time mb-0"><i className="ri-time-line align-middle"></i> <span className="align-middle">{chat.time}</span></p>
                                                                    }
                                                                </div>
                                                                {
                                                                    !chat.isTyping &&
                                                                    <UncontrolledDropdown className="align-self-start">
                                                                        <DropdownToggle tag="a" className="text-muted ms-1">
                                                                            <i className="ri-more-2-fill"></i>
                                                                        </DropdownToggle>
                                                                        <DropdownMenu>
                                                                            <DropdownItem>{t('Copy')} <i className="ri-file-copy-line float-end text-muted"></i></DropdownItem>
                                                                            <DropdownItem>{t('Save')} <i className="ri-save-line float-end text-muted"></i></DropdownItem>
                                                                            <DropdownItem onClick={toggle}>Forward <i className="ri-chat-forward-line float-end text-muted"></i></DropdownItem>
                                                                            <DropdownItem onClick={() => deleteMessage(chat.id)}>Delete <i className="ri-delete-bin-line float-end text-muted"></i></DropdownItem>
                                                                        </DropdownMenu>
                                                                    </UncontrolledDropdown>
                                                                }

                                                            </div>
                                                            <div className="conversation-name">
                                                                {chat.userType === "sender" ? (chat.senderDisplayName || chat.userName) : (chat.userName || chat.receiverDisplayName || chat.senderDisplayName)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                                :
                                                <li key={key} className={chat.userType === "sender" ? "right" : ""}>
                                                    <div className="conversation-list">
                                                        {
                                                            //logic for display user name and profile only once, if current and last messaged sent by same receiver
                                                            chatMessages[key + 1] ? chatMessages[key].userType === chatMessages[key + 1].userType ?

                                                                <div className="chat-avatar">
                                                                    <div className="blank-div"></div>
                                                                </div>
                                                                :
                                                                <div className="chat-avatar">
                                                                    {chat.userType === "sender" ? <img src={avatar1} alt="chatvia" /> :
                                                                        activeUser.profilePicture === "Null" ?
                                                                            <div className="chat-user-img align-self-center me-3">
                                                                                <div className="avatar-xs">
                                                                                    <span className="avatar-title rounded-circle bg-primary-subtle text-primary">
                                                                                        {activeUser.name.charAt(0)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            : <img src={activeUser.profilePicture} alt="chatvia" />
                                                                    }
                                                                </div>
                                                                : <div className="chat-avatar">
                                                                    {chat.userType === "sender" ? <img src={avatar1} alt="chatvia" /> :
                                                                        activeUser.profilePicture === "Null" ?
                                                                            <div className="chat-user-img align-self-center me-3">
                                                                                <div className="avatar-xs">
                                                                                    <span className="avatar-title rounded-circle bg-primary-subtle text-primary">
                                                                                        {activeUser.name.charAt(0)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            : <img src={activeUser.profilePicture} alt="chatvia" />
                                                                    }
                                                                </div>
                                                        }


                                                        <div className="user-chat-content">
                                                            <div className="ctext-wrap">
                                                                <div className="ctext-wrap-content">
                                                                    {
                                                                        chat.message &&
                                                                        <p className="mb-0">
                                                                            {chat.message}
                                                                        </p>
                                                                    }
                                                                    {
                                                                        chat.imageMessage &&
                                                                        // image list component
                                                                        <ImageList images={chat.imageMessage} />
                                                                    }
                                                                    {
                                                                        chat.fileMessage &&
                                                                        //file input component
                                                                        <FileList fileName={chat.fileMessage} fileSize={chat.size} />
                                                                    }
                                                                    {
                                                                        chat.isTyping &&
                                                                        <p className="mb-0">
                                                                            typing
                                                                            <span className="animate-typing">
                                                                                <span className="dot ms-1"></span>
                                                                                <span className="dot ms-1"></span>
                                                                                <span className="dot ms-1"></span>
                                                                            </span>
                                                                        </p>
                                                                    }
                                                                    {
                                                                        !chat.isTyping && <p className="chat-time mb-0"><i className="ri-time-line align-middle"></i> <span className="align-middle">{chat.time}</span></p>
                                                                    }
                                                                </div>
                                                                {
                                                                    !chat.isTyping &&
                                                                    <UncontrolledDropdown className="align-self-start ms-1">
                                                                        <DropdownToggle tag="a" className="text-muted">
                                                                            <i className="ri-more-2-fill"></i>
                                                                        </DropdownToggle>
                                                                        <DropdownMenu>
                                                                            <DropdownItem>{t('Copy')} <i className="ri-file-copy-line float-end text-muted"></i></DropdownItem>
                                                                            <DropdownItem>{t('Save')} <i className="ri-save-line float-end text-muted"></i></DropdownItem>
                                                                            <DropdownItem onClick={toggle}>Forward <i className="ri-chat-forward-line float-end text-muted"></i></DropdownItem>
                                                                            <DropdownItem onClick={() => deleteMessage(chat.id)}>Delete <i className="ri-delete-bin-line float-end text-muted"></i></DropdownItem>
                                                                        </DropdownMenu>
                                                                    </UncontrolledDropdown>
                                                                }

                                                            </div>
                                                            {
                                                                (!chatMessages[key + 1] || chatMessages[key].userType !== chatMessages[key + 1].userType) &&
                                                                <div className="conversation-name">{chat.userType === "sender" ? (chat.senderDisplayName || chat.userName) : (chat.userName || activeUser?.name)}</div>
                                                            }

                                                        </div>
                                                    </div>
                                                </li>
                                    )
                                }
                            </ul>
                        </SimpleBar>

                        <Modal backdrop="static" isOpen={modal} centered toggle={toggle}>
                            <ModalHeader toggle={toggle}>Forward to...</ModalHeader>
                            <ModalBody>
                                <CardBody className="p-2">
                                    <SimpleBar style={{ maxHeight: "200px" }}>
                                        <SelectContact handleCheck={() => { }} />
                                    </SimpleBar>
                                    <ModalFooter className="border-0">
                                        <Button color="primary">Forward</Button>
                                    </ModalFooter>
                                </CardBody>
                            </ModalBody>
                        </Modal>

                                <ChatInput onaddMessage={addMessage} />
                            </>
                        )}
                    </div>

                    <UserProfileSidebar activeUser={activeUser} />

                </div>
            </div>
        </React.Fragment>
    );
}

const mapStateToProps = (state) => {
    const { active_user } = state.Chat;
    const { userSidebar } = state.Layout;
    const user = state.Auth?.user;
    const recentChatList = state.Chat?.users || [];
    return {
        active_user,
        userSidebar,
        recentChatList,
        currentUserId: Number(user?.id || user?.userId || user?.sub),
        token: user?.token
    };
};

export default withRouter(connect(mapStateToProps, { openUserSidebar, setFullUser, getRecentChatsRequest })(UserChat));

