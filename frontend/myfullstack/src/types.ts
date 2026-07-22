export type AuthMode = "login" | "signup";

export type UserProfile = {
  id: string;
  username: string;
  email: string;
};

export type AuthForm = {
  username: string;
  email: string;
  password: string;
};

export type PostForm = {
  name: string;
  description: string;
  portfolio: string;
};

export type EventForm = {
  name: string;
  location: string;
  theme: string;
  time: string;
};

export type ProfileForm = AuthForm;

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

export type EventItem = {
  _id: string;
  name: string;
  location: string;
  theme: string;
  time: string;
  author?: string;
  createdAt?: string;
};
