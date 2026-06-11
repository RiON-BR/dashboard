import React, { useEffect, useState } from 'react';
import { Card, CardBody, Col, Row, Spinner } from 'reactstrap';
import { fetchBlogs } from '../../../helpers/api/services/blogsService';
import { fetchTasks } from '../../../helpers/api/services/tasksService';

import RequireRole from '../../../components/RequireRole';

const BlogsAndTasks = () => {
  const [blogs, setBlogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const [blogsRes, tasksRes] = await Promise.all([fetchBlogs(), fetchTasks()]);
        if (!mounted) return;
        setBlogs(Array.isArray(blogsRes.data) ? blogsRes.data : []);
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      } catch (e) {
        // In this template, error handling is handled by sagas; keep it simple here.
        if (!mounted) return;
        setBlogs([]);
        setTasks([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <div>
      <Row className="g-3">
        <Col md={6}>
          <Card>
            <CardBody>
              <h4 className="mb-3">Blogs</h4>
              {blogs.length === 0 ? (
                <div className="text-muted">No blogs found.</div>
              ) : (
                <ul className="mb-0">
                  {blogs.slice(0, 10).map((b) => (
                    <li key={b.ID || b.id} className="mb-2">
                      <div className="fw-semibold">{b.TITLE || b.title}</div>
                      {b.CONTENT || b.content ? (
                        <div className="text-muted small">
                          {(b.CONTENT || b.content).toString().slice(0, 140)}...
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <CardBody>
              <h4 className="mb-3">Tasks</h4>
              {tasks.length === 0 ? (
                <div className="text-muted">No tasks found.</div>
              ) : (
                <ul className="mb-0">
                  {tasks.slice(0, 10).map((t) => (
                    <li key={t.ID || t.id} className="mb-2">
                      <div className="fw-semibold">{t.TITLE || t.title}</div>
                      <div className="text-muted small">{t.STATUS || t.status}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Example: admin-only UI differentiation */}
          <div className="mt-3">
            <RequireRole roles={['admin']}>
              <div className="alert alert-info mb-0">
                Admin view: you can access admin-only actions.
              </div>
            </RequireRole>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default BlogsAndTasks;

