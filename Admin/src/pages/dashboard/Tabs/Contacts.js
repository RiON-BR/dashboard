import React, { Component } from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Button, Modal, ModalHeader, ModalBody, ModalFooter, UncontrolledTooltip, Form, Label, Input, InputGroup, Spinner } from 'reactstrap';
import SimpleBar from "simplebar-react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import axios from 'axios';
import config from '../../../config';
import { setActiveTab, activeUser, getRecentChatsSuccess } from '../../../redux/actions';

//use sortedContacts variable as global variable to sort contacts
let sortedContacts = [];

class Contacts extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modal: false,
            contacts: [],
            rawContacts: [],
            loading: true
        }
        this.toggle = this.toggle.bind(this);
        this.sortContact = this.sortContact.bind(this);
        this.fetchContacts = this.fetchContacts.bind(this);
        this.startChatWithContact = this.startChatWithContact.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.token !== this.props.token) {
            this.fetchContacts();
        }
    }

    componentDidMount() {
        this.fetchContacts();
    }

    toggle() {
        this.setState({ modal: !this.state.modal });
    }

    async fetchContacts() {
        this.setState({ loading: true });
        try {
            const token = this.props.token;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${config.API_URL}/api/users`, { headers });
            const users = response.data || [];
            
            const mapped = users.map(u => ({
                id: u.ID,
                name: u.DISPLAY_NAME || u.USERNAME || u.EMAIL,
                email: u.EMAIL
            }));

            this.setState({ rawContacts: mapped, loading: false }, () => {
                this.sortContact();
            });
        } catch (err) {
            console.error("Failed to fetch contacts directory:", err);
            this.setState({ loading: false });
        }
    }

    async startChatWithContact(email) {
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
            this.props.setActiveTab("chat");
        } catch (err) {
            console.error("Failed to start chat with contact:", err);
        }
    }

    sortContact() {
        const list = this.state.rawContacts || [];
        let data = list.reduce((r, e) => {
            try {
                let group = e.name && e.name[0] ? e.name[0].toUpperCase() : "?";
                if (!r[group]) r[group] = { group, children: [e] }
                else r[group].children.push(e);
            } catch (error) {
                return sortedContacts;
            }
            return r;
        }, {})

        let result = Object.values(data).sort((a, b) => a.group.localeCompare(b.group));
        this.setState({ contacts: result });
        sortedContacts = result;
        return result;
    }

    render() {
        const { t } = this.props;
        return (
            <React.Fragment>
                <div>
                    <div className="p-4">
                        <div className="user-chat-nav float-end">
                            <div id="add-contact">
                                {/* Button trigger modal */}
                                <Button type="button" color="link" onClick={this.toggle} className="text-decoration-none text-muted font-size-18 py-0">
                                    <i className="ri-user-add-line"></i>
                                </Button>
                            </div>
                            <UncontrolledTooltip target="add-contact" placement="bottom">
                                Add Contact
                                    </UncontrolledTooltip>
                        </div>
                        <h4 className="mb-4">Contacts</h4>

                        {/* Start Add contact Modal */}
                        <Modal isOpen={this.state.modal} centered toggle={this.toggle}>
                            <ModalHeader tag="h5" className="font-size-16" toggle={this.toggle}>
                                {t('Add Contacts')}
                            </ModalHeader>
                            <ModalBody className="p-4">
                                <Form>
                                    <div className="mb-4">
                                        <Label className="form-label" htmlFor="addcontactemail-input">{t('Email')}</Label>
                                        <Input type="email" className="form-control" id="addcontactemail-input" placeholder="Enter Email" />
                                    </div>
                                    <div>
                                        <Label className="form-label" htmlFor="addcontact-invitemessage-input">{t('Invatation Message')}</Label>
                                        <textarea className="form-control" id="addcontact-invitemessage-input" rows="3" placeholder="Enter Message"></textarea>
                                    </div>
                                </Form>
                            </ModalBody>
                            <ModalFooter>
                                <Button type="button" color="link" onClick={this.toggle}>Close</Button>
                                <Button type="button" color="primary">Invite Contact</Button>
                            </ModalFooter>
                        </Modal>
                        {/* End Add contact Modal */}

                        <div className="search-box chat-search-box">
                            <InputGroup size="lg" className="bg-light rounded-lg">
                                <Button color="link" className="text-decoration-none text-muted pr-1" type="button">
                                    <i className="ri-search-line search-icon font-size-18"></i>
                                </Button>
                                <Input type="text" className="form-control bg-light " placeholder={t('Search users..')} />
                            </InputGroup>
                        </div>
                        {/* End search-box */}
                    </div>
                    {/* end p-4 */}

                    {/* Start contact lists */}
                    <SimpleBar style={{ maxHeight: "100%" }} id="chat-room" className="p-4 chat-message-list chat-group-list">
                        {this.state.loading && (
                            <div className="text-center p-4">
                                <Spinner color="primary" />
                            </div>
                        )}
                        {!this.state.loading && sortedContacts.length === 0 && (
                            <div className="text-center text-muted p-4">No contacts found.</div>
                        )}
                        {
                            !this.state.loading && sortedContacts.map((contact, key) =>
                                <div key={key} className={key + 1 === 1 ? "" : "mt-3"}>
                                    <div className="p-3 fw-bold text-primary">
                                        {contact.group}
                                    </div>

                                    <ul className="list-unstyled contact-list">
                                        {
                                            contact.children.map((child, key) =>
                                                <li key={key} >
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <h5 className="font-size-14 m-0 text-truncate">{child.name}</h5>
                                                            <p className="text-muted font-size-12 mb-0 text-truncate">{child.email}</p>
                                                        </div>
                                                        <Button
                                                            color="primary"
                                                            size="sm"
                                                            className="me-3 px-3 rounded-pill shadow-sm"
                                                            onClick={() => this.startChatWithContact(child.email)}
                                                        >
                                                            Chat
                                                        </Button>
                                                        <UncontrolledDropdown>
                                                            <DropdownToggle tag="a" className="text-muted">
                                                                <i className="ri-more-2-fill"></i>
                                                            </DropdownToggle>
                                                            <DropdownMenu className="dropdown-menu-end">
                                                                <DropdownItem>{t('Share')} <i className="ri-share-line float-end text-muted"></i></DropdownItem>
                                                                <DropdownItem>{t('Block')} <i className="ri-forbid-line float-end text-muted"></i></DropdownItem>
                                                                <DropdownItem>{t('Remove')} <i className="ri-delete-bin-line float-end text-muted"></i></DropdownItem>
                                                            </DropdownMenu>
                                                        </UncontrolledDropdown>
                                                    </div>
                                                </li>
                                            )
                                        }
                                    </ul>
                                </div>
                            )
                        }

                    </SimpleBar>
                    {/* end contact lists */}
                </div>
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => {
    const { contacts } = state.Chat;
    const recentChatList = state.Chat?.users || [];
    const token = state.Auth?.user?.token;
    return { contacts, recentChatList, token };
};

export default connect(mapStateToProps, { setActiveTab, activeUser, getRecentChatsSuccess })(withTranslation()(Contacts));