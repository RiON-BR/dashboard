import React, { Component } from 'react';
import withRouter from "../../components/withRouter";
import { connect } from "react-redux"
import PropTypes from "prop-types";
import { changeLayoutMode } from '../../redux/actions';

//Import Components
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

class Index extends Component {
    constructor(props) {
        super(props);
        this.state={};
        this.capitalizeFirstLetter.bind(this);
    }
    
    //function for capital first letter of current page pathname
    capitalizeFirstLetter = string => {
        return string.charAt(1).toUpperCase() + string.slice(2);
    };

    componentDidMount(){
        var getLayoutMode = localStorage.getItem("layoutMode");
        this.props.changeLayoutMode(getLayoutMode);
        if (getLayoutMode) {
            this.props.changeLayoutMode(getLayoutMode);
        } else {
            this.props.changeLayoutMode(this.props.layout.layoutMode);
        }

        // let currentage = this.capitalizeFirstLetter(this.props.router.location.pathname);

        //set document title according to page path name
        // document.title = currentage + " | Chatvia - Responsive Bootstrap 5 Admin Dashboard";
    }
    
    render() {
        return (
            <React.Fragment>
                <div className="layout-wrapper d-lg-flex" style={{ height: '100vh', overflow: 'hidden' }}>
                    {/* left sidebar menu */}
                    <Sidebar />
                    {/* render page content */}
                    <div className="flex-grow-1" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Header />
                        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

Index.propTypes = {
    layoutMode: PropTypes.any,
  };

const mapStateToProps = state => {
    const { layoutMode } = state.Layout;
    return { layoutMode };
  };

export default withRouter(connect(mapStateToProps, { changeLayoutMode })(Index))