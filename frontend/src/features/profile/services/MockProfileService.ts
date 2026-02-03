import type { IProfileService } from './IProfileService';
import type { UserProfile, Project } from '../../../shared/types';

export class MockProfileService implements IProfileService {
  private mockProjects: Project[] = [
    {
      project_id: 1,
      user_id: 1,
      project_name: 'modern-ecommerce',
      title: 'Modern E-commerce Platform',
      description: 'A sleek and responsive e-commerce design with focus on user experience',
      image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      created_at: new Date('2024-01-15'),
    },
    {
      project_id: 2,
      user_id: 1,
      project_name: 'brand-identity',
      title: 'Brand Identity System',
      description: 'Complete brand identity including logo, colors, and typography',
      image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
      created_at: new Date('2024-02-20'),
    },
    {
      project_id: 3,
      user_id: 1,
      project_name: 'mobile-banking',
      title: 'Mobile Banking App',
      description: 'Intuitive mobile banking interface with modern design principles',
      image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
      created_at: new Date('2024-03-10'),
    },
    {
      project_id: 4,
      user_id: 1,
      project_name: 'dashboard-analytics',
      title: 'Dashboard Analytics',
      description: 'Data visualization dashboard for business analytics',
      image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      created_at: new Date('2024-04-05'),
    },
    {
      project_id: 5,
      user_id: 1,
      project_name: 'social-campaign',
      title: 'Social Media Campaign',
      description: 'Creative social media designs for product launch',
      image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop',
      created_at: new Date('2024-05-12'),
    },
    {
      project_id: 6,
      user_id: 1,
      project_name: 'restaurant-website',
      title: 'Restaurant Website',
      description: 'Modern restaurant website with online ordering',
      image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
      created_at: new Date('2024-06-18'),
    },
  ];

  async getProfile(userId: number): Promise<UserProfile> {
    console.log('[Mock] Get profile for user:', userId);
    
    const profile: UserProfile = {
      profile_id: 1,
      user_id: userId,
      first_name: 'Sereyreaksa',
      last_name: 'Prom',
      bio: 'Passionate UI/UX designer with 5+ years of experience creating beautiful and functional digital experiences. I specialize in mobile app design, web interfaces, and brand identity systems. My approach combines user research, creative problem-solving, and attention to detail to deliver designs that users love.',
      skills: 'UI/UX Design, Figma, Adobe XD, Branding, Web Design, Mobile Design, Prototyping, User Research',
      location: 'San Francisco, CA',
      profile_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    };

    return new Promise((resolve) => setTimeout(() => resolve(profile), 500));
  }

  async updateProfile(userId: number, data: Partial<UserProfile>): Promise<UserProfile> {
    console.log('[Mock] Update profile for user:', userId, data);
    
    const updatedProfile: UserProfile = {
      profile_id: 1,
      user_id: userId,
      first_name: data.first_name || 'Sereyreaksa',
      last_name: data.last_name || 'Prom',
      bio: data.bio || 'Default bio',
      skills: data.skills || 'UI/UX Design',
      location: data.location || 'San Francisco, CA',
      profile_avatar: data.profile_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    };

    return new Promise((resolve) => setTimeout(() => resolve(updatedProfile), 1000));
  }

  async getProjects(userId: number): Promise<Project[]> {
    console.log('[Mock] Get projects for user:', userId);
    return new Promise((resolve) => setTimeout(() => resolve(this.mockProjects), 500));
  }
}
