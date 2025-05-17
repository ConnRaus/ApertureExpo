import { useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { PhotoService } from "../services/PhotoService";
import { UserService } from "../services/UserService";
import { ContestService } from "../services/ContestService";
import { VoteService } from "../services/VoteService";
import { ForumService } from "../services/ForumService";

export function usePhotoService() {
  const { getToken } = useAuth();
  const serviceRef = useRef(null);

  if (!serviceRef.current) {
    serviceRef.current = new PhotoService(getToken);
  }

  return serviceRef.current;
}

export function useUserService() {
  const { getToken } = useAuth();
  const serviceRef = useRef(null);

  if (!serviceRef.current) {
    serviceRef.current = new UserService(getToken);
  }

  return serviceRef.current;
}

export function useContestService() {
  const { getToken } = useAuth();
  const serviceRef = useRef(null);

  if (!serviceRef.current) {
    serviceRef.current = new ContestService(getToken);
  }

  return serviceRef.current;
}

export function useVoteService() {
  const { getToken } = useAuth();
  const serviceRef = useRef(null);

  if (!serviceRef.current) {
    serviceRef.current = new VoteService(getToken);
  }

  return serviceRef.current;
}

export function useForumService() {
  const { getToken } = useAuth();
  const serviceRef = useRef(null);

  if (!serviceRef.current) {
    serviceRef.current = new ForumService(getToken);
  }

  return serviceRef.current;
}
