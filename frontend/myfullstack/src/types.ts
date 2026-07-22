export type AuthMode = "login" | "signup";

export type UserProfile = {
  id: string;
  username: string;
  email: string;
};

export type PostComment = {
  text: string;
  author: string;
  createdAt?: string;
};

export type PostItem = {
  _id: string;
  name: string;
  description: string;
  age: number;
  portfolio: string;
  author?: string;
  likes?: number;
  comments?: PostComment[];
  createdAt?: string;
};
