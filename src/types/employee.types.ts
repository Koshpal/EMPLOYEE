export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  companyId: string;
  role: 'EMPLOYEE';
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    companyId: string;
  };
}

export interface UserProfile extends Employee {
  bio?: string;
  expertise?: string[];
}
