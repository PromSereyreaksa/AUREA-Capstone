import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { ProfileService } from '../services/ProfileService';
import NeobrutalDropdown from '../../fee-estimator/components/NeobrutalDropdown';
import type { UserProfile, Portfolio } from '../../../shared/types';
import UserAvatar from '../../../shared/components/UserAvatar';
import { FaArrowLeft, FaPencilAlt, FaMapMarkerAlt, FaEnvelope, FaInstagram, FaBehance, FaDribbble, FaLinkedin, FaTwitter, FaGlobe, FaLink, FaSave, FaTimes, FaPlus, FaTrash, FaCamera, FaUpload, FaEye, FaEyeSlash } from 'react-icons/fa';
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [portfolioUrlInput, setPortfolioUrlInput] = useState('');
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [isUploadingPortfolioPdf, setIsUploadingPortfolioPdf] = useState(false);
  const [isUploadingPortfolioCover, setIsUploadingPortfolioCover] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioPdfInputRef = useRef<HTMLInputElement>(null);
  const portfolioCoverInputRef = useRef<HTMLInputElement>(null);

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
          } catch (err) {
            const message = err instanceof Error ? err.message.toLowerCase() : '';
            if (!message.includes('profile not found')) {
              throw err;
            }

            // Profile doesn't exist - create a placeholder with user info
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
          if (targetUserId && isOwnProfile) {
            const portfolioData = await profileService.getPortfolio(targetUserId);
            setPortfolio(portfolioData);
            setPortfolioUrlInput(portfolioData.portfolio_url || '');
          }
        } catch {
          // No portfolio found for this user
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

  const handleAvatarClick = () => {
    if (isOwnProfile && avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const response = await profileService.uploadAvatar(file);
      
      // Update profile with new avatar
      setProfile(response.profile);
      if (isEditing) {
        setEditedProfile(prev => ({ ...prev, profile_avatar: response.profile_avatar }));
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input value so same file can be selected again
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.profile_avatar) return;
    
    if (!confirm('Are you sure you want to delete your avatar?')) return;

    try {
      setIsUploadingAvatar(true);
      await profileService.deleteAvatar();
      
      // Update profile to remove avatar
      setProfile(prev => prev ? { ...prev, profile_avatar: '' } : null);
      if (isEditing) {
        setEditedProfile(prev => ({ ...prev, profile_avatar: '' }));
      }
    } catch (err) {
      console.error('Error deleting avatar:', err);
      alert('Failed to delete avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSavePortfolioUrl = async () => {
    if (!isOwnProfile) return;
    try {
      setIsSavingPortfolio(true);
      setPortfolioError(null);
      const updated = await profileService.updatePortfolio({
        portfolio_url: portfolioUrlInput.trim() || null,
      });
      setPortfolio(updated);
      setPortfolioUrlInput(updated.portfolio_url || '');
    } catch (err) {
      console.error('Error saving portfolio URL:', err);
      setPortfolioError(err instanceof Error ? err.message : 'Failed to save portfolio URL');
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleTogglePortfolioPublic = async () => {
    if (!isOwnProfile) return;
    try {
      setIsSavingPortfolio(true);
      setPortfolioError(null);
      const updated = await profileService.updatePortfolio({
        is_public: !(portfolio?.is_public ?? false),
      });
      setPortfolio(updated);
    } catch (err) {
      console.error('Error updating portfolio visibility:', err);
      setPortfolioError(err instanceof Error ? err.message : 'Failed to update visibility');
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handlePortfolioPdfClick = () => {
    portfolioPdfInputRef.current?.click();
  };

  const handlePortfolioCoverClick = () => {
    portfolioCoverInputRef.current?.click();
  };

  const handlePortfolioPdfChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPortfolioError('Only PDF files are allowed');
      return;
    }
    try {
      setIsUploadingPortfolioPdf(true);
      setPortfolioError(null);
      const updated = await profileService.uploadPortfolioPdf(file);
      setPortfolio(updated);
      setPortfolioUrlInput(updated.portfolio_url || '');
    } catch (err) {
      console.error('Error uploading portfolio PDF:', err);
      setPortfolioError(err instanceof Error ? err.message : 'Failed to upload portfolio PDF');
    } finally {
      setIsUploadingPortfolioPdf(false);
      if (portfolioPdfInputRef.current) {
        portfolioPdfInputRef.current.value = '';
      }
    }
  };

  const handlePortfolioCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPortfolioError('Only JPEG, PNG, and WebP images are allowed for cover');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPortfolioError('Cover image must be less than 10MB');
      return;
    }

    try {
      setIsUploadingPortfolioCover(true);
      setPortfolioError(null);
      const updated = await profileService.uploadPortfolioCover(file);
      setPortfolio(updated);
    } catch (err) {
      console.error('Error uploading portfolio cover:', err);
      setPortfolioError(err instanceof Error ? err.message : 'Failed to upload portfolio cover');
    } finally {
      setIsUploadingPortfolioCover(false);
      if (portfolioCoverInputRef.current) {
        portfolioCoverInputRef.current.value = '';
      }
    }
  };

  const handleRemovePortfolioUrl = async () => {
    try {
      setIsSavingPortfolio(true);
      setPortfolioError(null);
      try {
        await profileService.deletePortfolioPdf();
      } catch {
        // If it's a manual URL (not uploaded PDF), fallback to clearing only the URL.
      }
      const updated = await profileService.updatePortfolio({ portfolio_url: null });
      setPortfolio(updated);
      setPortfolioUrlInput('');
    } catch (err) {
      console.error('Error deleting portfolio PDF:', err);
      setPortfolioError(err instanceof Error ? err.message : 'Failed to delete portfolio PDF');
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleDeletePortfolioCover = async () => {
    try {
      setIsSavingPortfolio(true);
      setPortfolioError(null);
      await profileService.deletePortfolioCover();
      const updated = await profileService.updatePortfolio({ portfolio_cover_url: null });
      setPortfolio(updated);
    } catch (err) {
      console.error('Error deleting portfolio cover:', err);
      setPortfolioError(err instanceof Error ? err.message : 'Failed to delete portfolio cover');
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="profile-container profile-state-shell">
        <div className="profile-loading-shell">
          <section className="profile-state-card profile-state-card-hero">
            <p className="profile-state-kicker">Designer Profile</p>
            <div className="profile-loading-hero">
              <div className="profile-loading-avatar-block"></div>
              <div className="profile-loading-copy">
                <div className="profile-loading-line profile-loading-line-lg"></div>
                <div className="profile-loading-line profile-loading-line-md"></div>
                <div className="profile-loading-pill-row">
                  <div className="profile-loading-pill"></div>
                  <div className="profile-loading-pill"></div>
                  <div className="profile-loading-pill profile-loading-pill-short"></div>
                </div>
              </div>
            </div>
          </section>

          <div className="profile-loading-grid">
            <section className="profile-state-card">
              <p className="profile-state-kicker">About</p>
              <div className="profile-loading-stack">
                <div className="profile-loading-line"></div>
                <div className="profile-loading-line"></div>
                <div className="profile-loading-line profile-loading-line-short"></div>
              </div>
            </section>

            <section className="profile-state-card">
              <p className="profile-state-kicker">Connect</p>
              <div className="profile-loading-stack">
                <div className="profile-loading-chip"></div>
                <div className="profile-loading-chip"></div>
                <div className="profile-loading-chip profile-loading-chip-wide"></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container profile-state-shell">
        <div className="profile-error profile-state-card">
          <p className="profile-state-kicker">Profile Error</p>
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-button-alt">Go Back</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container profile-state-shell">
        <div className="profile-error profile-state-card">
          <p className="profile-state-kicker">Profile Error</p>
          <h2>Profile Not Found</h2>
          <p>The profile you're looking for doesn't exist.</p>
          <button onClick={() => navigate(-1)} className="back-button-alt">Go Back</button>
        </div>
      </div>
    );
  }

  // Helper to get display name
  const displayName = profile.first_name || profile.last_name 
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';
  const avatarName = profile.first_name || profile.last_name
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : undefined;

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
            <div className={`profile-avatar ${isOwnProfile ? 'profile-avatar-editable' : ''}`}>
              {/* Hidden file input for avatar upload */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              
              {isUploadingAvatar ? (
                <div className="avatar-loading">
                  <div className="loading-spinner-small"></div>
                </div>
              ) : (
                <UserAvatar
                  name={avatarName}
                  email={isOwnProfile ? user?.email : undefined}
                  imageUrl={profile.profile_avatar}
                  seed={profile.user_id || user?.user_id || displayName}
                  className="h-full w-full"
                  initialsClassName="text-[2.75rem] tracking-[0.04em]"
                />
              )}
              
              {/* Camera overlay for own profile */}
              {isOwnProfile && !isUploadingAvatar && (
                <div className="avatar-overlay" onClick={handleAvatarClick}>
                  <FaCamera size={24} />
                  <span>Change</span>
                </div>
              )}
            </div>
            
            {/* Delete avatar button */}
            {isOwnProfile && profile.profile_avatar && !isUploadingAvatar && (
              <button 
                onClick={handleDeleteAvatar} 
                className="delete-avatar-btn"
                title="Delete avatar"
              >
                <FaTrash size={12} />
              </button>
            )}
            
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
                <div className="edit-field profile-experience-edit-group">
                  <div className="experience-inputs">
                    <div className="form-group profile-inline-field profile-inline-field-small">
                      <label className="form-label">Years</label>
                      <input
                        type="number"
                        value={editedProfile.experience_years || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, experience_years: parseInt(e.target.value) || undefined })}
                        placeholder="Years"
                        className="edit-input-small profile-years-input"
                        min="0"
                      />
                    </div>
                    <div className="profile-dropdown-field">
                      <NeobrutalDropdown
                        label="Seniority"
                        value={editedProfile.seniority_level || ''}
                        onChange={(value) =>
                          setEditedProfile({
                            ...editedProfile,
                            seniority_level: (value || undefined) as 'junior' | 'mid' | 'senior' | 'expert' | undefined,
                          })
                        }
                        placeholder="Select level"
                        options={[
                          { value: '', label: 'Select level' },
                          { value: 'junior', label: 'Junior' },
                          { value: 'mid', label: 'Mid' },
                          { value: 'senior', label: 'Senior' },
                          { value: 'expert', label: 'Expert' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                (profile.experience_years || profile.seniority_level) && (
                  <p className="profile-experience">
                    {profile.experience_years && `${profile.experience_years} years experience`}
                    {profile.experience_years && profile.seniority_level && ' / '}
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
          <section className="profile-section profile-section-compact">
            <h2>Recent Project</h2>
            <div className="profile-empty-project-card">
              <div>
                <p className="profile-empty-project-title">No featured project pinned yet.</p>
                <p className="profile-empty-text">
                  {isOwnProfile
                    ? 'Upload a portfolio cover or connect your portfolio link so this area feels intentional instead of empty.'
                    : 'This designer has not added a featured project yet.'}
                </p>
              </div>
              {isOwnProfile && (
                <button onClick={handlePortfolioCoverClick} className="add-social-btn">
                  <FaUpload size={12} />
                  Add Cover
                </button>
              )}
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

          {isOwnProfile && (
            <div className="sidebar-section">
              <h3>Portfolio Settings</h3>
              <input
                ref={portfolioPdfInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePortfolioPdfChange}
                style={{ display: 'none' }}
              />
              <input
                ref={portfolioCoverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handlePortfolioCoverChange}
                style={{ display: 'none' }}
              />

              <div className="portfolio-cover-preview">
                {portfolio?.portfolio_cover_url ? (
                  <img src={portfolio.portfolio_cover_url} alt="Portfolio cover" />
                ) : (
                  <div className="portfolio-cover-placeholder">No cover uploaded</div>
                )}
              </div>

              <div className="edit-field">
                <label>Portfolio Link</label>
                <input
                  type="url"
                  value={portfolioUrlInput}
                  onChange={(e) => setPortfolioUrlInput(e.target.value)}
                  placeholder="https://your-portfolio.com or uploaded PDF URL"
                  className="edit-input"
                  disabled={isSavingPortfolio || isUploadingPortfolioPdf || isUploadingPortfolioCover}
                />
              </div>

              <div className="portfolio-actions-row">
                <button
                  onClick={handleSavePortfolioUrl}
                  className="add-item-save-btn"
                  disabled={isSavingPortfolio || isUploadingPortfolioPdf || isUploadingPortfolioCover}
                >
                  <FaSave size={12} />
                  {isSavingPortfolio ? 'Saving...' : 'Save Link'}
                </button>
                <button
                  onClick={handlePortfolioPdfClick}
                  className="add-social-btn"
                  disabled={isSavingPortfolio || isUploadingPortfolioPdf || isUploadingPortfolioCover}
                >
                  <FaUpload size={12} />
                  {isUploadingPortfolioPdf ? 'Uploading...' : 'Upload PDF'}
                </button>
                <button
                  onClick={handlePortfolioCoverClick}
                  className="add-social-btn"
                  disabled={isSavingPortfolio || isUploadingPortfolioPdf || isUploadingPortfolioCover}
                >
                  <FaUpload size={12} />
                  {isUploadingPortfolioCover ? 'Uploading...' : 'Upload Cover'}
                </button>
              </div>

              {portfolio?.portfolio_url && (
                <>
                  <a
                    href={portfolio.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-link portfolio-link"
                  >
                    <FaLink size={16} />
                    Open Portfolio
                  </a>
                  <button
                    onClick={handleRemovePortfolioUrl}
                    className="portfolio-remove-btn"
                    disabled={isSavingPortfolio || isUploadingPortfolioPdf}
                  >
                    <FaTrash size={12} />
                    Remove Portfolio URL
                  </button>
                </>
              )}

              {portfolio?.portfolio_cover_url && (
                <button
                  onClick={handleDeletePortfolioCover}
                  className="portfolio-remove-btn"
                  disabled={isSavingPortfolio || isUploadingPortfolioPdf || isUploadingPortfolioCover}
                >
                  <FaTrash size={12} />
                  Remove Cover
                </button>
              )}

              <button
                onClick={handleTogglePortfolioPublic}
                className="portfolio-visibility-btn"
                disabled={isSavingPortfolio || isUploadingPortfolioPdf || isUploadingPortfolioCover}
              >
                {portfolio?.is_public ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                {portfolio?.is_public ? 'Make Private' : 'Make Public'}
              </button>
              <p className="portfolio-status-text">
                {portfolio?.is_public
                  ? 'Your portfolio is visible in the public designer gallery.'
                  : 'Your portfolio is currently hidden from the public designer gallery.'}
              </p>

              {portfolioError && <p className="portfolio-error-text">{portfolioError}</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
