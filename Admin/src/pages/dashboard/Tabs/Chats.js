import React, { Component } from 'react';
import { Input, InputGroup, Modal, ModalHeader, ModalBody, Form, Label, Button } from "reactstrap";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import axios from 'axios';
import config from '../../../config';

//simplebar
import SimpleBar from "simplebar-react";

//actions
import { setconversationNameInOpenChat, activeUser, getRecentChatsRequest, getRecentChatsSuccess } from "../../../redux/actions";

//components

class Chats extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchChat: "",
            recentChatList: this.props.recentChatList || [],
            newChatModalOpen: false,
            newChatEmail: "",
            newChatError: "",
            newChatSubmitting: false
        };
        this.openUserChat = this.openUserChat.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.toggleNewChatModal = this.toggleNewChatModal.bind(this);
        this.handleNewChatSubmit = this.handleNewChatSubmit.bind(this);
    }

    toggleNewChatModal() {
        this.setState({
            newChatModalOpen: !this.state.newChatModalOpen,
            newChatEmail: "",
            newChatError: "",
            newChatSubmitting: false
        });
    }

    async handleNewChatSubmit(e) {
        e.preventDefault();
        const email = this.state.newChatEmail?.trim();
        if (!email) return;

        this.setState({ newChatSubmitting: true, newChatError: "" });
        try {
            const token = this.props.token;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.post(`${config.API_URL}/api/chat/new-by-email`, { email }, { headers });
            const newConv = response.data;

            const recentChatList = [...this.props.recentChatList];
            const existingIndex = recentChatList.findIndex(c => c.id === newConv.id);
            let activeIdx = 0;
            if (existingIndex >= 0) {
                activeIdx = existingIndex;
            } else {
                recentChatList.unshift(newConv);
                activeIdx = 0;
                this.props.getRecentChatsSuccess(recentChatList);
            }

            this.props.activeUser(activeIdx);

            this.setState({
                newChatModalOpen: false,
                newChatEmail: "",
                newChatSubmitting: false
            });
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to start chat";
            this.setState({ newChatError: msg, newChatSubmitting: false });
        }
    }

    componentDidMount() {
        if (this.props.token) {
            this.props.getRecentChatsRequest();
        }

        var li = document.getElementById("conversation" + this.props.active_user);
        if (li) {
            li.classList.add("active");
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.recentChatList !== this.props.recentChatList) {
            const search = this.state.searchChat;
            const conversation = this.props.recentChatList || [];
            if (!search || search.trim() === "") {
                this.setState({ recentChatList: conversation });
            } else {
                const filteredArray = conversation.filter(chat => 
                    chat?.name?.toLowerCase().includes(search.toLowerCase())
                );
                this.setState({ recentChatList: filteredArray });
            }
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (this.props.recentChatList !== nextProps.recentChatList) {
            const search = this.state.searchChat;
            const conversation = nextProps.recentChatList || [];
            if (!search || search.trim() === "") {
                this.setState({ recentChatList: conversation });
            } else {
                const filteredArray = conversation.filter(chat => 
                    chat?.name?.toLowerCase().includes(search.toLowerCase())
                );
                this.setState({ recentChatList: filteredArray });
            }
        }
    }

    handleChange(e) {
        const search = e.target.value;
        this.setState({ searchChat: search });
        const conversation = this.props.recentChatList || [];

        if (!search || search.trim() === "") {
            this.setState({ recentChatList: conversation });
            return;
        }

        const filteredArray = conversation.filter(chat => 
            chat?.name?.toLowerCase().includes(search.toLowerCase())
        );

        this.setState({ recentChatList: filteredArray });
    }

    openUserChat(e, chat) {
        e.preventDefault();

        var index = this.props.recentChatList.indexOf(chat);
        this.props.activeUser(index);

        var chatList = document.getElementById("chat-list");
        var clickedItem = e.target;
        var currentli = null;

        if (chatList) {
            var li = chatList.getElementsByTagName("li");
            for (var i = 0; i < li.length; ++i) {
                if (li[i].classList.contains('active')) {
                    li[i].classList.remove('active');
                }
            }
            for (var k = 0; k < li.length; ++k) {
                if (li[k].contains(clickedItem)) {
                    currentli = li[k];
                    break;
                }
            }
        }

        if (currentli) {
            currentli.classList.add('active');
        }

        var userChat = document.getElementsByClassName("user-chat");
        if (userChat) {
            userChat[0].classList.add("user-chat-show");
        }

        var unread = document.getElementById("unRead" + chat.id);
        if (unread) {
            unread.style.display = "none";
        }
    }

    render() {
        return (
            <React.Fragment>
                <div>
                    <div className="px-4 pt-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="mb-0">Chats</h4>
                            <Button color="link" onClick={this.toggleNewChatModal} className="text-decoration-none text-muted font-size-18 p-0">
                                <i className="ri-user-add-line"></i>
                            </Button>
                        </div>

                        {/* Start New Chat Modal */}
                        <Modal isOpen={this.state.newChatModalOpen} toggle={this.toggleNewChatModal} centered>
                            <ModalHeader toggle={this.toggleNewChatModal}>Start New Chat</ModalHeader>
                            <ModalBody className="p-4">
                                <Form onSubmit={this.handleNewChatSubmit}>
                                    <div className="mb-4">
                                        <Label className="form-label" htmlFor="newchatemail-input">Email Address</Label>
                                        <Input
                                            type="email"
                                            className="form-control"
                                            id="newchatemail-input"
                                            placeholder="Enter user email address"
                                            value={this.state.newChatEmail}
                                            onChange={(e) => this.setState({ newChatEmail: e.target.value, newChatError: "" })}
                                            invalid={!!this.state.newChatError}
                                            required
                                        />
                                        {this.state.newChatError && <div className="text-danger mt-1 small">{this.state.newChatError}</div>}
                                    </div>
                                    <div className="d-flex justify-content-end gap-2">
                                        <Button type="button" color="light" onClick={this.toggleNewChatModal}>Cancel</Button>
                                        <Button type="submit" color="primary" disabled={this.state.newChatSubmitting}>
                                            {this.state.newChatSubmitting ? "Starting..." : "Start Chat"}
                                        </Button>
                                    </div>
                                </Form>
                            </ModalBody>
                        </Modal>

                        <div className="search-box chat-search-box">
                            <InputGroup className="mb-3 rounded-3">
                                <span className="input-group-text text-muted bg-light pe-1 ps-3" id="basic-addon1">
                                    <i className="ri-search-line search-icon font-size-18"></i>
                                </span>
                                <Input
                                    type="text"
                                    value={this.state.searchChat}
                                    onChange={(e) => this.handleChange(e)}
                                    className="form-control bg-light"
                                    placeholder="Search messages or users"
                                />
                            </InputGroup>
                        </div>
                    </div>

                    <div>
                        <h5 className="mb-3 px-3 font-size-16">Recent</h5>
                        <SimpleBar className="chat-message-list">
                            <ul className="list-unstyled chat-list chat-user-list px-2" id="chat-list">
                                {(this.state.recentChatList || []).map((chat, key) => (
                                    <li
                                        key={key}
                                        id={"conversation" + key}
                                        className={chat.unRead ? "unread" : chat.isTyping ? "typing" : key === this.props.active_user ? "active" : ""}
                                    >
                                        <Link to="#" onClick={(e) => this.openUserChat(e, chat)}>
                                            <div className="d-flex">
                                                {
                                                    chat.profilePicture === "Null" || !chat.profilePicture ?
                                                        <div className={"chat-user-img " + (chat.status || "") + " align-self-center ms-0"}>
                                                            <div className="avatar-xs">
                                                                <span className="avatar-title rounded-circle bg-primary-subtle text-primary">
                                                                    {chat.name ? chat.name.charAt(0) : "?"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        :
                                                        <div className={"chat-user-img " + (chat.status || "") + " align-self-center ms-0"}>
                                                            <img src={chat.profilePicture} className="rounded-circle avatar-xs" alt="chatvia" />
                                                        </div>
                                                }

                                                <div className="flex-grow-1 overflow-hidden">
                                                    <h5 className="text-truncate font-size-15 mb-1 ms-3">{chat.name}</h5>
                                                    <p className="chat-user-message font-size-14 text-truncate mb-0 ms-3">
                                                        {
                                                            chat.isTyping ?
                                                                <>
                                                                    typing<span className="animate-typing">
                                                                        <span className="dot ms-1"></span>
                                                                        <span className="dot ms-1"></span>
                                                                        <span className="dot ms-1"></span>
                                                                    </span>
                                                                </>
                                                                :
                                                                <>
                                                                    {chat.messages && chat.messages.length > 0 && chat.messages[chat.messages.length - 1].isImageMessage === true ? <i className="ri-image-fill align-middle me-1"></i> : null}
                                                                    {chat.messages && chat.messages.length > 0 && chat.messages[chat.messages.length - 1].isFileMessage === true ? <i className="ri-file-text-fill align-middle me-1"></i> : null}
                                                                    {chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].message : null}
                                                                </>
                                                        }
                                                    </p>
                                                </div>

                                                <div className="font-size-11">{chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].time : null}</div>
                                                {chat.unRead === 0 ? null :
                                                    <div className="unread-message" id={"unRead" + chat.id}>
                                                        <span className="badge badge-soft-danger rounded-pill">
                                                            {chat.messages && chat.messages.length > 0 ? (chat.unRead >= 20 ? chat.unRead + "+" : chat.unRead) : ""}
                                                        </span>
                                                    </div>
                                                }
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </SimpleBar>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => {
    const { active_user } = state.Chat;
    const recentChatList = state.Chat?.users || [];
    const user = state.Auth?.user;
    return {
        active_user,
        recentChatList,
        token: user?.token
    };
};

export default connect(mapStateToProps, { setconversationNameInOpenChat, activeUser, getRecentChatsRequest, getRecentChatsSuccess })(Chats);

