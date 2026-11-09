export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  hasPin: boolean;
  level: 'basic' | 'premium';
}
