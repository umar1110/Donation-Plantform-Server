export interface IUser {
  id: string;
  auth_user_id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_super_admin: boolean;
  is_organization_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IUserProfile extends IUser {
  // Additional profile fields can be added here as needed
}
