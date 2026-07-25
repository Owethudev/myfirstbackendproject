export type AuthMode = "login" | "signup";

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  role?: "user" | "admin";
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

export type PostItem = {
  _id: string;
  name: string;
  description: string;
  portfolio: string;
  author?: string;
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
