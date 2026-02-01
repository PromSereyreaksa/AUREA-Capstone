import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { FaArrowLeft, FaPencilAlt, FaMapMarkerAlt, FaEnvelope, FaGlobe, FaInstagram, FaBehance } from 'react-icons/fa';
import '../styles/profile.css';

export const DesignerProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Mock profile data
  const [profile] = useState({
    first_name: 'Sereyreaksa',
    last_name: 'Prom',
    bio: 'Passionate UI/UX designer with 5+ years of experience creating beautiful and functional digital experiences. I specialize in mobile app design, web interfaces, and brand identity systems. My approach combines user research, creative problem-solving, and attention to detail to deliver designs that users love.',
    skills: 'UI/UX Design, Figma, Adobe XD, Branding, Web Design, Mobile Design, Prototyping, User Research',
    location: 'San Francisco, CA',
    profile_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    email: 'sereyreaksa@aurea.tools',
    website: 'www.sereyreaksa.design',
    instagram: '@sereyreaksa.design',
    behance: 'sereyreaksa',
  });

  const isOwnProfile = user?.user_id === parseInt(userId || '0');

  useEffect(() => {
    // Simulate loading profile data
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [userId]);

  const handleEditProfile = () => {
    // TODO: Replace with actual edit page route once built
    navigate(`/profile/${userId}/edit`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Back Button */}
      <div className="profile-top-bar">
        <button onClick={handleBack} className="back-button">
          <FaArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <img src={profile.profile_avatar} alt={`${profile.first_name} ${profile.last_name}`} />
            </div>
            <div className="profile-basic-info">
              <h1>{profile.first_name} {profile.last_name}</h1>
              <p className="profile-location">
                <FaMapMarkerAlt size={16} />
                {profile.location}
              </p>
            </div>
          </div>

          {/* TODO: Replace `true` with `isOwnProfile` once auth is wired up */}
          {true && (
            <button onClick={handleEditProfile} className="edit-profile-button">
              <FaPencilAlt size={16} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="profile-main">
          {/* About Section */}
          <section className="profile-section">
            <h2>About Me</h2>
            <p className="profile-bio">{profile.bio}</p>
          </section>

          {/* Skills Section */}
          <section className="profile-section">
            <h2>Skills</h2>
            <div className="skills-list">
              {profile.skills.split(',').map((skill, index) => (
                <span key={index} className="skill-tag">{skill.trim()}</span>
              ))}
            </div>
          </section>

          {/* Recent Work Section */}
          <section className="profile-section">
            <h2>Recent Work</h2>
            <div className="projects-grid">
              {/* TODO: Populate with project cards once data is available */}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="sidebar-section">
            <h3>Contact</h3>
            <a href={`mailto:${profile.email}`} className="contact-link">
              <FaEnvelope size={16} />
              {profile.email}
            </a>
            <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="contact-link">
              <FaGlobe size={16} />
              {profile.website}
            </a>
          </div>

          <div className="sidebar-section">
            <h3>Social Links</h3>
            <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-link">
              <FaInstagram size={16} />
              {profile.instagram}
            </a>
            <a href={`https://behance.net/${profile.behance}`} target="_blank" rel="noopener noreferrer" className="social-link">
              <FaBehance size={16} />
              {profile.behance}
            </a>
          </div>

          <div className="sidebar-section">
            <h3>Statistics</h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-value">127</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">2.4k</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">18k</span>
                <span className="stat-label">Appreciations</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};