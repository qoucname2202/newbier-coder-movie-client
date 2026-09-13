// Basic User type definition
export interface User {
  _id: string;
  username: string;
  email: string;
  fullname?: string;
  avatar?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
