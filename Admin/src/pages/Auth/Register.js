import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Container, Row, Col, Card, CardBody, Form, Input, Button, FormFeedback, Label, InputGroup, Alert } from 'reactstrap';
import { registerUser, apiError } from '../../redux/actions';
import { useTranslation } from 'react-i18next';

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const { error, loading } = useSelector(state => state.Auth);

    const formik = useFormik({
        initialValues: { username: '', email: '', password: '', role: 'user' },
        validationSchema: Yup.object({
            username: Yup.string().required('Username is required'),
            email: Yup.string().email('Enter a valid email').required('Email is required'),
            password: Yup.string().required('Password is required'),
            role: Yup.string().oneOf(['user', 'seller']).required('Role is required')
        }),
        onSubmit: values => {
            dispatch(registerUser({
                email: values.email,
                username: values.username,
                password: values.password,
                role: values.role
            }, navigate));
        },
    });

    useEffect(() => {
        dispatch(apiError(""));
    }, [dispatch]);

    return (
        <div className="account-pages my-5 pt-sm-5">
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={6} xl={5}>
                        <Card>
                            <CardBody className="p-4">
                                {/* e.preventDefault() aur formik.handleSubmit ka sahi sequence */}
                                <Form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
                                    {error && <Alert color="danger" fade={false}>{error}</Alert>}
                                    
                                    <div className="mb-3">
                                        <Label>Email</Label>
                                        <Input 
                                            name="email" 
                                            onChange={formik.handleChange} 
                                            onBlur={formik.handleBlur}
                                            value={formik.values.email} 
                                            invalid={formik.touched.email && !!formik.errors.email}
                                        />
                                        <FormFeedback>{formik.errors.email}</FormFeedback>
                                    </div>

                                    <div className="mb-3">
                                        <Label>Username</Label>
                                        <Input 
                                            name="username" 
                                            onChange={formik.handleChange} 
                                            onBlur={formik.handleBlur}
                                            value={formik.values.username} 
                                            invalid={formik.touched.username && !!formik.errors.username}
                                        />
                                        <FormFeedback>{formik.errors.username}</FormFeedback>
                                    </div>

                                    <div className="mb-3">
                                        <Label>Password</Label>
                                        <Input 
                                            type="password" 
                                            name="password" 
                                            onChange={formik.handleChange} 
                                            onBlur={formik.handleBlur}
                                            value={formik.values.password} 
                                            invalid={formik.touched.password && !!formik.errors.password}
                                        />
                                        <FormFeedback>{formik.errors.password}</FormFeedback>
                                    </div>

                                    <div className="mb-3">
                                        <Label>Register As:</Label>
                                        <Input
                                            type="select"
                                            name="role"
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            value={formik.values.role}
                                            invalid={formik.touched.role && !!formik.errors.role}
                                        >
                                            <option value="user">User</option>
                                            <option value="seller">Seller</option>
                                        </Input>
                                        <FormFeedback>{formik.errors.role}</FormFeedback>
                                    </div>

                                    <Button color="primary" type="submit" block disabled={loading}>
                                        {loading ? "Registering..." : "Register"}
                                    </Button>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Register;