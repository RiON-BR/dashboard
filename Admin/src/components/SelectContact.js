import React, { Component } from 'react';
import { Input, Label } from "reactstrap";
import { connect } from "react-redux";
import axios from 'axios';
import config from '../config';

class SelectContact extends Component {
    constructor(props) {
        super(props);
        this.state = {
            localContacts: []
        };
        this.sortContact = this.sortContact.bind(this);
        this.fetchContacts = this.fetchContacts.bind(this);
    }

    componentDidMount() {
        if (!this.props.contacts || this.props.contacts.length === 0) {
            this.fetchContacts();
        }
    }

    async fetchContacts() {
        try {
            const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
            const token = authUser.token;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${config.API_URL}/api/users`, { headers });
            const users = response.data || [];
            
            const mapped = users.map(u => ({
                id: u.ID,
                name: u.DISPLAY_NAME || u.USERNAME || u.EMAIL,
                email: u.EMAIL
            }));

            this.setState({ localContacts: mapped });
        } catch (err) {
            console.error("Failed to fetch contacts dynamically in SelectContact:", err);
        }
    }

    sortContact(contacts) {
        if (!contacts || !Array.isArray(contacts)) return [];
        let data = contacts.reduce((r, e) => {
            try {
                // get first letter of name of current element
                let group = e.name && e.name[0] ? e.name[0].toUpperCase() : "?";
                // if there is no property in accumulator with this letter create it
                if (!r[group]) r[group] = { group, children: [e] }
                // if there is push current element to children array for that letter
                else r[group].children.push(e);
            } catch (error) {
                return r;
            }
            // return accumulator
            return r;
        }, {});

        // since data at this point is an object, to get array of values
        // we use Object.values method and sort alphabetically
        return Object.values(data).sort((a, b) => a.group.localeCompare(b.group));
    }

    render() {
        const contactsSource = (this.props.contacts && this.props.contacts.length > 0)
            ? this.props.contacts
            : this.state.localContacts;
            
        const sorted = this.sortContact(contactsSource);
        
        return (
            <React.Fragment>
                {
                    sorted.map((contact, key) =>
                        <div key={key}>
                            <div className="p-3 fw-bold text-primary">
                                {contact.group}
                            </div>

                            <ul className="list-unstyled contact-list">
                                {
                                    contact.children.map((child, keyChild) =>
                                        <li key={keyChild} className="py-1">
                                            <div className="form-check d-flex align-items-center">
                                                <Input 
                                                    type="checkbox" 
                                                    className="form-check-input" 
                                                    onChange={(e) => this.props.handleCheck(e, child.id)} 
                                                    id={"memberCheck" + child.id} 
                                                    value={child.name} 
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <Label 
                                                    className="form-check-label ms-2 mb-0" 
                                                    htmlFor={"memberCheck" + child.id}
                                                    style={{ color: '#1E293B', fontWeight: 500, cursor: 'pointer' }}
                                                >
                                                    {child.name}
                                                </Label>
                                            </div>
                                        </li>
                                    )
                                }
                            </ul>
                        </div>
                    )
                }
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => {
    const { contacts } = state.Chat;
    return { contacts };
};

// Map empty actions since they are not needed here
export default connect(mapStateToProps, {})(SelectContact);