import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Input,
  InputGroup,
  Modal,
  ModalHeader,
  ModalBody,
  Form
} from 'reactstrap';
import { fetchBlogs, likeBlog, addBlogComment } from '../helpers/api/services/blogsService';

// Import local assets
import logo from "../assets/images/logo.svg";
import scenicBanner from "../assets/images/scenic_banner.png";
import img1 from '../assets/images/small/img-1.jpg';
import img2 from '../assets/images/small/img-2.jpg';
import img3 from '../assets/images/small/img-3.jpg';
import img4 from '../assets/images/small/img-4.jpg';
import avatar1 from '../assets/images/users/avatar-1.jpg';
import avatar2 from '../assets/images/users/avatar-2.jpg';
import avatar3 from '../assets/images/users/avatar-3.jpg';
import avatar4 from '../assets/images/users/avatar-4.jpg';

// Mock blogs fallback list with mapped categories
const MOCK_BLOGS = [
  {
    id: 'mock-1',
    title: 'The Future of AI: Multi-Agent Systems in Production',
    content: 'Multi-agent frameworks are rapidly moving from academic research projects to industrial-scale production. By delegating specialized roles to different agents—such as planners, developers, reviewers, and monitors—organizations can build highly resilient, autonomous workflows. This article explores how to architect such systems, coordinate shared state, handle race conditions, and monitor agent performance using modern distributed tracing tools.',
    category: 'Technical',
    authorName: 'Sarah Jenkins',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    clickCount: 142,
    likesCount: 38,
    imageData: img1,
    avatar: avatar1,
    readTime: '8 min read'
  },
  {
    id: 'mock-2',
    title: 'Designing for the Modern Web: Micro-interactions and Glassmorphism',
    content: 'Aesthetics are not just about how a page looks, but how it feels to interact with it. By incorporating subtle micro-animations on hover, smooth spring transitions, and carefully calibrated backdrop blur filters (glassmorphism), we can build user interfaces that feel premium and alive. In this deep dive, we discuss the CSS layout discipline, custom HSL color palettes, and performance optimization techniques for complex canvas and CSS animations.',
    category: 'Productivity',
    authorName: 'Alex Rivera',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    clickCount: 95,
    likesCount: 24,
    imageData: img2,
    avatar: avatar2,
    readTime: '6 min read'
  },
  {
    id: 'mock-3',
    title: 'A Pragmatic Guide to Functional Programming in TypeScript',
    content: 'TypeScript allows us to write safer code, but when paired with functional programming libraries like fp-ts, it can completely transform our codebase. Say goodbye to try-catch loops, undefined runtime errors, and deeply nested imperative pipelines. We walk through practical patterns for using Option, Either, and TaskEither to represent computations, errors, and side effects as pure, predictable values.',
    category: 'Technical',
    authorName: 'Michael Chen',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    clickCount: 184,
    likesCount: 57,
    imageData: img3,
    avatar: avatar3,
    readTime: '5 min read'
  },
  {
    id: 'mock-4',
    title: 'Building Resilient Lifestyles: The Power of Habits and Focus',
    content: 'In our hyper-connected world, deep work and uninterrupted focus have become rare commodities. Achieving peak productivity is less about raw willpower and more about environment design and habit sequencing. By structuring your morning routine, tracking your energy levels instead of just your hours, and implementing hard boundaries on notifications, you can reclaim your attention and live a balanced, high-impact life.',
    category: 'Productivity',
    authorName: 'Elena Rostova',
    createdAt: new Date(Date.now() - 3600000 * 240).toISOString(),
    clickCount: 63,
    likesCount: 19,
    imageData: img4,
    avatar: avatar4,
    readTime: '4 min read'
  },
  {
    id: 'mock-5',
    title: 'Welcome to Chatvia: Shared Digital Space & Guidelines',
    content: 'Welcome to our platform. We are dedicated to creating a workspace where developers, sellers, and creators can interact, collaborate, and share knowledge safely. In this community post, we highlight best practices for collaboration, sharing ideas, and providing feedback to help everyone grow together.',
    category: 'Community',
    authorName: 'Chatvia Team',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    clickCount: 82,
    likesCount: 15,
    imageData: img1,
    avatar: avatar2,
    readTime: '3 min read'
  }
];

const CATEGORIES = ["All", "Community", "Technical", "Productivity"];

const normalizeCategory = (cat) => {
  const c = (cat || 'Community').trim().toLowerCase();
  if (['technical', 'technology', 'development', 'programming', 'code'].includes(c)) return 'Technical';
  if (['productivity', 'design', 'life', 'habit', 'lifestyle'].includes(c)) return 'Productivity';
  if (['community', 'general', 'news'].includes(c)) return 'Community';
  return 'Community';
};

export default function Home() {
  const navigate = useNavigate();
  const [dbBlogs, setDbBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Auth state check
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Local comments for mock blogs
  const [mockComments, setMockComments] = useState({
    'mock-1': [
      { id: 1, username: 'Dave Cooper', commentText: 'Incredible write-up! Multi-agent systems are indeed the future.', createdAt: new Date(Date.now() - 3600000 * 4).toISOString() }
    ],
    'mock-2': [
      { id: 1, username: 'Clara Oswald', commentText: 'Loving the glassmorphism effects! The hover interactions feel so smooth.', createdAt: new Date(Date.now() - 3600000 * 8).toISOString() }
    ]
  });

  // Local likes tracking for mock blogs
  const [mockLikes, setMockLikes] = useState({
    'mock-1': { liked: false, count: 38 },
    'mock-2': { liked: false, count: 24 },
    'mock-3': { liked: false, count: 57 },
    'mock-4': { liked: false, count: 19 },
    'mock-5': { liked: false, count: 15 }
  });

  // Reader Modal State
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [activeComments, setActiveComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likesInfo, setLikesInfo] = useState({ liked: false, count: 0 });

  useEffect(() => {
    // Check authUser in localStorage
    const authUser = localStorage.getItem('authUser');
    setIsAuthenticated(!!authUser);

    // Fetch db blogs
    const getBlogs = async () => {
      try {
        const res = await fetchBlogs();
        setDbBlogs(res.data || res || []);
      } catch (err) {
        console.warn('Backend API not available or requires auth. Falling back to local mock data.', err);
      }
    };
    getBlogs();
  }, []);

  // Show database blogs if available; otherwise fallback to mock blogs
  const allBlogs = dbBlogs.length > 0
    ? dbBlogs.map(b => ({
        ...b,
        isDb: true,
        category: normalizeCategory(b.category),
        readTime: Math.max(1, Math.ceil((b.content || '').split(' ').length / 200)) + ' min read',
        avatar: avatar1
      }))
    : MOCK_BLOGS.map(b => ({
        ...b,
        isDb: false,
        likedByUser: mockLikes[b.id]?.liked,
        likesCount: mockLikes[b.id]?.count
      }));

  // Filter & search implementation
  const filteredBlogs = allBlogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          blog.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (blog.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
                            (blog.category || '').toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Handle open article reader
  const handleOpenBlog = async (blog) => {
    if (blog.isDb) {
      navigate(`/blogs/${blog.id}`);
    } else {
      setSelectedBlog(blog);
      setReaderOpen(true);
      setNewComment('');
      // Local state for mock blog
      setActiveComments(mockComments[blog.id] || []);
      setLikesInfo({ liked: mockLikes[blog.id]?.liked, count: mockLikes[blog.id]?.count });
    }
  };

  // Handle Close reader
  const handleCloseReader = () => {
    setReaderOpen(false);
    setSelectedBlog(null);
  };

  // Like Toggle Handler
  const handleLikeToggle = async () => {
    if (!selectedBlog) return;

    if (selectedBlog.isDb) {
      if (!isAuthenticated) {
        alert('Please login to like this database post.');
        return;
      }
      try {
        const res = await likeBlog(selectedBlog.id);
        const data = res.data || res;
        setLikesInfo({ liked: data.liked, count: data.likesCount });
        
        // Update local db list cache
        setDbBlogs(prev => prev.map(b => b.id === selectedBlog.id ? { ...b, likedByUser: data.liked, likesCount: data.likesCount } : b));
      } catch (err) {
        console.error('Failed to like db blog', err);
      }
    } else {
      // Mock blog toggle state locally
      const current = mockLikes[selectedBlog.id] || { liked: false, count: 0 };
      const nextLiked = !current.liked;
      const nextCount = nextLiked ? current.count + 1 : current.count - 1;
      
      const newMockLikes = {
        ...mockLikes,
        [selectedBlog.id]: { liked: nextLiked, count: nextCount }
      };
      setMockLikes(newMockLikes);
      setLikesInfo({ liked: nextLiked, count: nextCount });
    }
  };

  // Add Comment Handler
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedBlog) return;

    if (selectedBlog.isDb) {
      if (!isAuthenticated) {
        alert('Please login to post a comment.');
        return;
      }
      try {
        const res = await addBlogComment(selectedBlog.id, newComment);
        const posted = res.data || res;
        setActiveComments(prev => [...prev, {
          id: posted.id,
          username: posted.username,
          commentText: posted.commentText,
          createdAt: posted.createdAt
        }]);
        setNewComment('');
      } catch (err) {
        console.error('Failed to post comment on db blog', err);
      }
    } else {
      // Mock blog add local comment
      const newCommentObj = {
        id: Date.now(),
        username: 'Guest Reader',
        commentText: newComment,
        createdAt: new Date().toISOString()
      };
      const blogComments = mockComments[selectedBlog.id] || [];
      const updatedComments = [...blogComments, newCommentObj];
      
      setMockComments({
        ...mockComments,
        [selectedBlog.id]: updatedComments
      });
      setActiveComments(updatedComments);
      setNewComment('');
    }
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  // Constants for sidebar highlights
  const topAuthors = [
    { name: 'Sarah Jenkins', role: 'Technical Contributor', followers: '1.2k', avatar: avatar1 },
    { name: 'Alex Rivera', role: 'UI/UX Designer', followers: '940', avatar: avatar2 },
    { name: 'Michael Chen', role: 'TS Lead developer', followers: '820', avatar: avatar3 },
    { name: 'Elena Rostova', role: 'Lifestyle Writer', followers: '650', avatar: avatar4 }
  ];

  const recentHighlights = allBlogs.slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFBFC', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .home-navbar {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(114, 105, 239, 0.1);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }
        .hero-section {
          position: relative;
          padding: 120px 0;
          background-image: linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url(${scenicBanner});
          background-size: cover;
          background-position: center;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          overflow: hidden;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.2;
          color: #ffffff;
          letter-spacing: -1.5px;
          margin-bottom: 20px;
          font-family: 'Inter', sans-serif;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .hero-subtitle {
          font-size: 1.25rem;
          font-weight: 500;
          line-height: 1.6;
          color: #f1f5f9;
          margin-bottom: 0px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }
        .category-pill {
          padding: 10px 22px !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          border-radius: 30px !important;
          cursor: pointer;
          transition: all 0.25s ease !important;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
          color: #475569;
        }
        .category-pill.active {
          background-color: #7269ef !important;
          border-color: #7269ef !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(114, 105, 239, 0.3);
        }
        .category-pill:hover:not(.active) {
          background-color: #f1f5f9;
          color: #1e293b;
          transform: translateY(-1px);
        }
        .search-input-group {
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          background-color: #ffffff;
          max-width: 320px;
          width: 100%;
        }
        .search-input-group:focus-within {
          border-color: #7269ef;
          box-shadow: 0 4px 20px rgba(114, 105, 239, 0.15);
        }
        .search-input-group input {
          border: none !important;
          box-shadow: none !important;
          padding-left: 0 !important;
        }
        .blog-card {
          border-radius: 16px !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          background: #ffffff !important;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
          cursor: pointer;
        }
        .blog-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(114, 105, 239, 0.12) !important;
          border-color: rgba(114, 105, 239, 0.2) !important;
        }
        .blog-card-img-wrapper {
          position: relative;
          overflow: hidden;
        }
        .blog-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .blog-card:hover .blog-card-img {
          transform: scale(1.05);
        }
        .blog-category-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background-color: rgba(255, 255, 255, 0.95) !important;
          color: #1e293b !important;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 6px 12px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .blog-title {
          font-weight: 800;
          color: #1e293b;
          line-height: 1.4;
          transition: color 0.2s ease;
        }
        .blog-card:hover .blog-title {
          color: #7269ef;
        }
        .blog-excerpt {
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .author-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        .custom-modal {
          border-radius: 20px !important;
          overflow: hidden;
        }
        .custom-modal-header {
          border-bottom: none !important;
          padding: 24px 24px 10px 24px !important;
        }
        .custom-modal-body {
          padding: 10px 24px 24px 24px !important;
        }
        .modal-hero-img {
          width: 100%;
          max-height: 350px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .comment-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #475569;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
        }
        .sidebar-widget {
          background-color: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
        }
        .sidebar-title {
          font-weight: 700;
          font-size: 1.1rem;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f1f5f9;
          font-family: 'Inter', sans-serif;
          text-align: left;
        }
        .author-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          text-align: left;
        }
        .author-item:last-child {
          margin-bottom: 0;
        }
        .highlight-item {
          text-align: left;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .highlight-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        .highlight-link {
          font-weight: 600;
          font-size: 0.95rem;
          color: #1e293b;
          text-decoration: none;
          line-height: 1.4;
          display: block;
          transition: color 0.2s;
        }
        .highlight-link:hover {
          color: #7269ef;
        }
      `}</style>

      {/* Top Header Navbar */}
      <nav className="navbar navbar-expand-lg home-navbar sticky-top navbar-light bg-white px-3 px-md-5">
        <Container fluid className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 cursor-pointer" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src={logo} alt="logo" height="30" />
            <span className="fw-bold text-primary font-size-20" style={{ color: '#7269ef', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>
              Chatvia
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              color="primary"
              onClick={navigateToLogin}
              style={{
                backgroundColor: '#7269ef',
                borderColor: '#7269ef',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                padding: '8px 20px',
                boxShadow: 'none'
              }}
            >
              Login / Register
            </Button>
          </div>
        </Container>
      </nav>

      {/* Hero Header Section */}
      <section className="hero-section text-center">
        <Container>
          <h1 className="hero-title">
            Discover the Latest <span style={{ color: '#a78bfa' }}>Feeds & Ideas</span>
          </h1>
          <p className="hero-subtitle">
            Welcome to Chatvia's public board. Explore, search, and discover thought-provoking articles, development tips, and life learnings created by our community.
          </p>
        </Container>
      </section>

      {/* Filter and Content section */}
      <Container className="py-5 flex-grow-1">
        
        {/* Search & Category filter panel */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-5">
          {/* Categories pills */}
          <div className="d-flex gap-2 flex-wrap align-items-center">
            {CATEGORIES.map(cat => (
              <Badge
                key={cat}
                pill
                onClick={() => setSelectedCategory(cat)}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Search bar */}
          <InputGroup className="search-input-group px-3 py-1 align-items-center">
            <i className="ri-search-line text-muted font-size-18 me-2"></i>
            <Input
              type="text"
              placeholder="Search articles, keywords..."
              value={searchQuery}
              onChange={(e) => searchQuery(e.target.value)}
              className="bg-transparent"
            />
          </InputGroup>
        </div>

        {/* Asymmetrical List Layout with Sidebar */}
        <Row>
          {/* Main Feed Column */}
          <Col lg={8} md={8} xs={12}>
            {filteredBlogs.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-4 border p-4">
                <h5 className="text-muted mb-3">
                  No articles match your search or filter criteria.
                </h5>
                <Button 
                  outline
                  color="primary"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  style={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                {filteredBlogs.map((blog) => (
                  <Card 
                    key={blog.id}
                    onClick={() => handleOpenBlog(blog)}
                    className="blog-card border-0"
                  >
                    <Row className="g-0 align-items-stretch">
                      {/* Media Cover (Left side) */}
                      <Col xs={12} md={4} className="blog-card-img-wrapper" style={{ minHeight: '240px' }}>
                        <img
                          src={blog.imageData || img1}
                          alt={blog.title}
                          className="blog-card-img w-100 h-100"
                        />
                        <Badge color="light" className="blog-category-badge">
                          {blog.category}
                        </Badge>
                      </Col>

                      {/* Content Body (Right side) */}
                      <Col xs={12} md={8} className="d-flex flex-column justify-content-between p-4">
                        <div style={{ textAlign: 'left' }}>
                          <h4 className="blog-title mb-3" style={{ fontSize: '1.35rem', fontFamily: 'Inter, sans-serif', fontWeight: 800 }}>
                            {blog.title}
                          </h4>
                          <p className="blog-excerpt text-muted mb-4">
                            {blog.content}
                          </p>
                        </div>

                        {/* Author badge footer */}
                        <div className="mt-auto pt-3 border-top">
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div className="d-flex align-items-center">
                              <img src={blog.avatar} className="author-avatar me-2" alt="" />
                              <div style={{ textAlign: 'left' }}>
                                <span className="fw-bold text-dark d-block" style={{ fontSize: '0.85rem' }}>
                                  {blog.authorName}
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {new Date(blog.createdAt).toLocaleDateString()} &bull; {blog.readTime}
                                </span>
                              </div>
                            </div>
                            
                            <div className="d-flex gap-3 align-items-center" style={{ fontSize: '0.82rem' }}>
                              <span className="fw-semibold text-secondary">
                                💖 {blog.likesCount} likes
                              </span>
                              <span className="text-muted">
                                👁️ {blog.clickCount || 0} views
                              </span>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            )}
          </Col>

          {/* Editorial Sidebar highlights Column */}
          <Col lg={4} md={4} xs={12} className="mt-4 mt-md-0">
            <div className="d-flex flex-column gap-4">
              
              {/* Top Authors Widget */}
              <div className="sidebar-widget">
                <h5 className="sidebar-title">Top Authors</h5>
                <div className="d-flex flex-column gap-3">
                  {topAuthors.map((author, idx) => (
                    <div className="author-item" key={idx}>
                      <img src={author.avatar} alt={author.name} className="author-avatar" style={{ width: '40px', height: '40px' }} />
                      <div className="flex-grow-1">
                        <span className="fw-bold text-dark d-block" style={{ fontSize: '0.875rem' }}>{author.name}</span>
                        <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{author.role}</span>
                      </div>
                      <Badge color="light" pill style={{ fontSize: '0.75rem', border: '1px solid #e2e8f0', color: '#475569', padding: '4px 10px' }}>
                        {author.followers}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Highlights Widget */}
              <div className="sidebar-widget">
                <h5 className="sidebar-title">Recent Highlights</h5>
                <div className="d-flex flex-column gap-3">
                  {recentHighlights.map((hl) => (
                    <div className="highlight-item" key={hl.id}>
                      <a 
                        href="#highlight" 
                        onClick={(e) => { e.preventDefault(); handleOpenBlog(hl); }}
                        className="highlight-link"
                      >
                        {hl.title}
                      </a>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          By {hl.authorName}
                        </span>
                        <span className="fw-semibold text-secondary" style={{ fontSize: '0.75rem' }}>
                          👁️ {hl.clickCount} views
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Col>
        </Row>
      </Container>

      {/* Footer copyright */}
      <footer className="py-4 text-center border-top bg-white mt-auto">
        <Container>
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>
            &copy; {new Date().getFullYear()} Chatvia. All rights reserved. Crafted with passion.
          </span>
        </Container>
      </footer>

      {/* Public Article Reader Modal */}
      {selectedBlog && (
        <Modal 
          isOpen={readerOpen} 
          toggle={handleCloseReader} 
          size="lg"
          centered
          className="custom-modal"
          contentClassName="border-0 rounded-4"
        >
          <ModalHeader toggle={handleCloseReader} className="custom-modal-header position-relative d-block">
            <Badge color="primary" className="mb-2 bg-primary-subtle text-primary border-0 px-2.5 py-1.5" style={{ fontSize: '0.8rem', borderRadius: '4px' }}>
              {selectedBlog.category}
            </Badge>
            <h4 className="fw-bold text-dark mt-2 mb-0" style={{ fontSize: '1.75rem', fontFamily: 'Inter, sans-serif' }}>
              {selectedBlog.title}
            </h4>
          </ModalHeader>
          <ModalBody className="custom-modal-body px-4 pb-4">
            <img 
              src={selectedBlog.imageData || img1} 
              alt={selectedBlog.title} 
              className="modal-hero-img w-100 mb-4" 
              style={{ objectFit: 'cover', maxHeight: '350px', borderRadius: '12px' }}
            />
            
            <div className="d-flex align-items-center mb-4 pb-3 border-bottom text-start">
              <img src={selectedBlog.avatar} className="author-avatar me-3" alt="" />
              <div>
                <span className="fw-bold text-dark d-block" style={{ fontSize: '0.9rem' }}>
                  By {selectedBlog.authorName}
                </span>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Published {new Date(selectedBlog.createdAt).toLocaleDateString()} &bull; {selectedBlog.readTime}
                </span>
              </div>
            </div>

            <p style={{ color: '#334155', fontSize: '1.05rem', lineHeight: '1.8', whiteSpace: 'pre-line', textAlign: 'left' }}>
              {selectedBlog.content}
            </p>

            <hr className="my-4" />

            <div className="d-flex align-items-center gap-2 mb-4">
              <Button
                outline
                color={likesInfo.liked ? 'danger' : 'secondary'}
                onClick={handleLikeToggle}
                className="d-flex align-items-center gap-2 px-4 py-2 border-0 shadow-sm"
                style={{ borderRadius: '8px', fontWeight: 600, backgroundColor: likesInfo.liked ? '#fff1f2' : '#f8fafc' }}
              >
                <i className={likesInfo.liked ? "ri-heart-fill text-danger font-size-18" : "ri-heart-line text-muted font-size-18"}></i>
                <span className={likesInfo.liked ? "text-danger" : "text-dark"}>
                  {likesInfo.count} {likesInfo.count === 1 ? 'Like' : 'Likes'}
                </span>
              </Button>
            </div>

            <div className="mt-5 text-start">
              <h5 className="fw-bold text-dark mb-4" style={{ fontSize: '1.2rem' }}>
                Discussion ({activeComments.length})
              </h5>

              {/* Add comment form */}
              <Form onSubmit={handleAddComment} className="d-flex gap-3 mb-4">
                <div className="comment-avatar flex-shrink-0 bg-primary text-white" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  G
                </div>
                <InputGroup className="shadow-sm border rounded-3 overflow-hidden">
                  <Input
                    placeholder={isAuthenticated || !selectedBlog.isDb ? "Join the discussion..." : "Log in to post a comment..."}
                    disabled={selectedBlog.isDb && !isAuthenticated}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="border-0 px-3"
                    style={{ fontSize: '0.95rem' }}
                  />
                  <Button 
                    type="submit" 
                    color="primary" 
                    disabled={(!isAuthenticated && selectedBlog.isDb) || !newComment.trim()}
                    className="px-4 border-0 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: '#7269ef' }}
                  >
                    <i className="ri-send-plane-fill font-size-16"></i>
                  </Button>
                </InputGroup>
              </Form>

              {/* Comments display list */}
              {activeComments.length === 0 ? (
                <p className="text-muted fst-italic py-2" style={{ fontSize: '0.9rem' }}>
                  No comments yet. Share your thoughts!
                </p>
              ) : (
                <div className="comments-list d-flex flex-column gap-3">
                  {activeComments.map((c, index) => (
                    <div key={c.id || index} className="p-3 bg-light rounded-3 shadow-sm border border-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="comment-avatar bg-secondary text-white" style={{ width: '28px', height: '28px', fontSize: '0.8rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {String(c.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{c.username}</span>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-secondary mb-0 ps-1" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                        {c.commentText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ModalBody>
        </Modal>
      )}

    </div>
  );
}
