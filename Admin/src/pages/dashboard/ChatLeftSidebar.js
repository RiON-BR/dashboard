import React from 'react';
import { connect } from "react-redux";

import { TabContent, TabPane } from "reactstrap";

//Import Components
import ProfileView from "./Tabs/ProfileView";
import SettingsView from "./Tabs/SettingsView";
import Chats from "./Tabs/Chats";
import Groups from "./Tabs/Groups";
import Contacts from "./Tabs/Contacts";
import TasksRecords from "./Tabs/TasksRecords";

function ChatLeftSidebar(props) {

    const activeTab = props.activeTab;

    return (
        <React.Fragment>
            <div className="chat-leftsidebar me-lg-1">

                <TabContent activeTab={activeTab}  >
                    {/* Start Profile tab-pane */}
                    <TabPane tabId="profile" id="pills-user"   >
                        {/* profile content  */}
                        <ProfileView />
                    </TabPane>
                    {/* End Profile tab-pane  */}

                    {/* Start chats tab-pane  */}
                    <TabPane tabId="chat" id="pills-chat">
                        {/* chats content */}
                        <Chats recentChatList={props.recentChatList} />
                    </TabPane>
                    {/* End chats tab-pane */}

                    {/* Start groups tab-pane */}
                    <TabPane tabId="group" id="pills-groups">
                        {/* Groups content */}
                        <Groups />
                    </TabPane>
                    {/* End groups tab-pane */}

                    {/* Start contacts tab-pane */}
                    <TabPane tabId="contacts" id="pills-contacts">
                        {/* Contact content */}
                        <Contacts />
                    </TabPane>
                    {/* End contacts tab-pane */}

                    {/* Start settings tab-pane */}
                    <TabPane tabId="settings" id="pills-setting">
                        {/* Settings content */}
                        <SettingsView />
                    </TabPane>
                    {/* End settings tab-pane */}

                    {/* Start tasks tab-pane */}
                    <TabPane tabId="tasks" id="pills-tasks">
                        {/* Tasks content */}
                        <TasksRecords tasks={props.tasks} loading={props.tasksLoading} />
                    </TabPane>
                    {/* End tasks tab-pane */}
                </TabContent>
                {/* end tab content */}

            </div>
        </React.Fragment>
    );
}

const mapStatetoProps = state => {
    return {
        ...state.Layout
    };
};

export default connect(mapStatetoProps, null)(ChatLeftSidebar);