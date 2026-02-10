import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { ProfileService } from '../services/ProfileService';
import type { UserProfile, Portfolio } from '../../../shared/types';
import { FaArrowLeft, FaPencilAlt, FaMapMarkerAlt, FaEnvelope, FaInstagram, FaBehance, FaDribbble, FaLinkedin, FaTwitter, FaGlobe, FaLink, FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import '../styles/profile.css';

const profileService = new ProfileService();

export const DesignerProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [newSkill, setNewSkill] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '', handle: '' });
  const [isAddingSocial, setIsAddingSocial] = useState(false);

  const isOwnProfile = !userId || user?.user_id === parseInt(userId);

  // Helper to get icon for social platform
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <FaInstagram size={16} />;
      case 'behance': return <FaBehance size={16} />;
      case 'dribbble': return <FaDribbble size={16} />;
      case 'linkedin': return <FaLinkedin size={16} />;
      case 'twitter': return <FaTwitter size={16} />;
      default: return <FaGlobe size={16} />;
    }
  };

  useEffect(() => {
    // Wait for auth to be ready before fetching profile
    if (authLoading) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let profileData: UserProfile;
        if (userId) {
          profileData = await profileService.getProfileById(parseInt(userId));
        } else {
          // For own profile, need to be authenticated
          if (!user) {
            navigate('/signin');
            return;
          }
          try {
            profileData = await profileService.getCurrentProfile();
          } catch {
            // Profile doesn't exist - create a placeholder with user info
            console.log('Profile not found, using user data');
            profileData = {
              profile_id: 0,
              user_id: user.user_id,
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              bio: '',
              skills: [],
              location: '',
              profile_avatar: '',
              experience_years: undefined,
              seniority_level: undefined,
              social_links: [],
            };
          }
        }
        
        setProfile(profileData);

        // Fetch portfolio
        try {
          const targetUserId = userId ? parseInt(userId) : user?.user_id;
          if (targetUserId) {
            const portfolioData = await profileService.getPortfolio(targetUserId);
            setPortfolio(portfolioData);
          }
        } catch {
          console.log('No portfolio found');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, authLoading, user, navigate]);

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditedProfile({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      skills: profile?.skills || [],
      experience_years: profile?.experience_years,
      seniority_level: profile?.seniority_level,
      social_links: profile?.social_links || [],
      profile_avatar: profile?.profile_avatar || '',
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({});
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const updatedProfile = await profileService.updateProfile(editedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      setEditedProfile({});
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setEditedProfile({
        ...editedProfile,
        skills: [...(editedProfile.skills || []), newSkill.trim()],
      });
      setNewSkill('');
      setIsAddingSkill(false);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setEditedProfile({
      ...editedProfile,
      skills: (editedProfile.skills || []).filter((_, i) => i !== index),
    });
  };

  const handleAddSocialLink = () => {
    if (newSocialLink.platform.trim() && newSocialLink.url.trim() && newSocialLink.handle.trim()) {
      setEditedProfile({
        ...editedProfile,
        social_links: [
          ...(editedProfile.social_links || []),
          { 
            platform: newSocialLink.platform.trim(), 
            url: newSocialLink.url.trim(), 
            handle: newSocialLink.handle.trim() 
          },
        ],
      });
      setNewSocialLink({ platform: '', url: '', handle: '' });
      setIsAddingSocial(false);
    }
  };

  const handleRemoveSocialLink = (index: number) => {
    setEditedProfile({
      ...editedProfile,
      social_links: (editedProfile.social_links || []).filter((_, i) => i !== index),
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading || authLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <h2>Profile Not Found</h2>
        <p>The profile you're looking for doesn't exist.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  // Helper to get display name
  const displayName = profile.first_name || profile.last_name 
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';

  // Check if profile needs to be completed
  const isIncomplete = !profile.bio && !profile.skills && !profile.location;

  return (
    <div className="profile-container">
      {/* Back Button */}
      <div className="profile-top-bar">
        <button onClick={handleBack} className="back-button">
          <FaArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Incomplete Profile Banner */}
      {isOwnProfile && isIncomplete && (
        <div className="profile-incomplete-banner">
          <p>Your profile is incomplete. Add more information to help others learn about you!</p>
          <button onClick={handleEditProfile} className="complete-profile-button">
            Complete Profile
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profile.profile_avatar ? (
                <img src={profile.profile_avatar} alt={displayName} />
              ) : (
                <div className="profile-avatar-placeholder">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-basic-info">
              {isEditing ? (
                <div className="edit-field">
                  <label>Name</label>
                  <div className="name-inputs">
                    <input
                      type="text"
                      value={editedProfile.first_name || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                      placeholder="First name"
                      className="edit-input-name"
                    />
                    <input
                      type="text"
                      value={editedProfile.last_name || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
                      placeholder="Last name"
                      className="edit-input-name"
                    />
                  </div>
                </div>
              ) : (
                <h1>{displayName}</h1>
              )}
              {isEditing ? (
                <div className="edit-field">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editedProfile.location || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                    placeholder="Enter your location"
                    className="edit-input"
                  />
                </div>
              ) : (
                profile.location ? (
                  <p className="profile-location">
                    <FaMapMarkerAlt size={16} />
                    {profile.location}
                  </p>
                ) : (
                  <p className="profile-location profile-location-empty">
                    <FaMapMarkerAlt size={16} />
                    Location not set
                  </p>
                )
              )}
              {isEditing ? (
                <div className="edit-field">
                  <label>Experience & Seniority</label>
                  <div className="experience-inputs">
                    <input
                      type="number"
                      value={editedProfile.experience_years || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, experience_years: parseInt(e.target.value) || undefined })}
                      placeholder="Years"
                      className="edit-input-small"
                      min="0"
                    />
                    <select
                      value={editedProfile.seniority_level || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, seniority_level: e.target.value as 'junior' | 'mid' | 'senior' | 'expert' | undefined })}
                      className="edit-select"
                    >
                      <option value="">Select level</option>
                      <option value="junior">Junior</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>
              ) : (
                (profile.experience_years || profile.seniority_level) && (
                  <p className="profile-experience">
                    {profile.experience_years && `${profile.experience_years} years experience`}
                    {profile.experience_years && profile.seniority_level && ' • '}
                    {profile.seniority_level && (
                      <span className="seniority-badge">{profile.seniority_level}</span>
                    )}
                  </p>
                )
              )}
              
            </div>
          </div>

          {isOwnProfile && (
            <>
              {!isEditing ? (
                <button onClick={handleEditProfile} className="edit-profile-button">
                  <FaPencilAlt size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button onClick={handleSaveProfile} className="save-profile-button" disabled={isSaving}>
                    <FaSave size={16} />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-edit-button" disabled={isSaving}>
                    <FaTimes size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="profile-main">
          {/* About Section */}
          <section className="profile-section">
            <h2>About Me</h2>
            {isEditing ? (
              <textarea
                value={editedProfile.bio || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                placeholder="Tell others about yourself..."
                className="edit-textarea"
                rows={5}
              />
            ) : (
              profile.bio ? (
                <p className="profile-bio">{profile.bio}</p>
              ) : (
                <p className="profile-bio profile-bio-empty">
                  {isOwnProfile ? 'Tell others about yourself by editing your profile.' : 'No bio available.'}
                </p>
              )
            )}
          </section>

          <section className="profile-section">
            <h2>Skills</h2>
            {isEditing ? (
              <div className="skills-edit">
                <div className="skills-list">
                  {(editedProfile.skills || []).map((skill, index) => (
                    <span key={index} className="skill-tag editable">
                      {skill}
                      <button onClick={() => handleRemoveSkill(index)} className="remove-skill-btn">
                        <FaTimes size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                {isAddingSkill ? (
                  <div className="add-item-form">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Enter skill name"
                      className="add-item-input"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      autoFocus
                    />
                    <button onClick={handleAddSkill} className="add-item-save-btn">
                      <FaSave size={12} />
                    </button>
                    <button onClick={() => { setIsAddingSkill(false); setNewSkill(''); }} className="add-item-cancel-btn">
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsAddingSkill(true)} className="add-skill-btn">
                    <FaPlus size={12} />
                    Add Skill
                  </button>
                )}
              </div>
            ) : (
              profile.skills && profile.skills.length > 0 ? (
                <div className="skills-list">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="profile-skills-empty">
                  {isOwnProfile ? 'Add your skills to showcase your expertise.' : 'No skills listed.'}
                </p>
              )
            )}
          </section>

          {/* Recent Work Section */}
          <section className="profile-section">
            <h2>Recent Project</h2>
            <div className="projects-grid">
              {/* TODO: Populate with project cards once data is available */}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="sidebar-section">
            <h3>Contact</h3>
            {user?.email && (
              <a href={`mailto:${user.email}`} className="contact-link">
                <FaEnvelope size={16} />
                {user.email}
              </a>
            )}
            {portfolio?.portfolio_url && (
              <a href={portfolio.portfolio_url} target="_blank" rel="noopener noreferrer" className="contact-link portfolio-link">
                <FaLink size={16} />
                Portfolio
              </a>
            )}
          </div>

          {/* Social Links */}
          {isEditing ? (
            <div className="sidebar-section">
              <h3>Social Links</h3>
              {(editedProfile.social_links || []).map((link, index) => (
                <div key={index} className="social-link editable">
                  {getSocialIcon(link.platform)}
                  <span>{link.handle || link.platform}</span>
                  <button onClick={() => handleRemoveSocialLink(index)} className="remove-social-btn">
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
              {isAddingSocial ? (
                <div className="add-social-form">
                  <input
                    type="text"
                    value={newSocialLink.platform}
                    onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
                    placeholder="Platform (e.g., instagram)"
                    className="add-item-input"
                  />
                  <input
                    type="text"
                    value={newSocialLink.url}
                    onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                    placeholder="Profile URL"
                    className="add-item-input"
                  />
                  <input
                    type="text"
                    value={newSocialLink.handle}
                    onChange={(e) => setNewSocialLink({ ...newSocialLink, handle: e.target.value })}
                    placeholder="Handle/Username"
                    className="add-item-input"
                  />
                  <div className="add-social-actions">
                    <button onClick={handleAddSocialLink} className="add-item-save-btn">
                      <FaSave size={12} />
                      Add
                    </button>
                    <button onClick={() => { setIsAddingSocial(false); setNewSocialLink({ platform: '', url: '', handle: '' }); }} className="add-item-cancel-btn">
                      <FaTimes size={12} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsAddingSocial(true)} className="add-social-btn">
                  <FaPlus size={12} />
                  Add Social Link
                </button>
              )}
            </div>
          ) : (
            profile.social_links && profile.social_links.length > 0 && (
              <div className="sidebar-section">
                <h3>Social Links</h3>
                {profile.social_links.map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    {getSocialIcon(link.platform)}
                    {link.handle || link.platform}
                  </a>
                ))}
              </div>
            )
          )}

          {/* Show empty social links section for own profile */}
          {isOwnProfile && !isEditing && (!profile.social_links || profile.social_links.length === 0) && (
            <div className="sidebar-section">
              <h3>Social Links</h3>
              <p className="profile-empty-text">Add your social links in profile settings.</p>
            </div>
          )}

          <div className="sidebar-section">
            <h3>Statistics</h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Projects</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};