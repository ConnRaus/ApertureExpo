import { useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { PhotoService, UserService, ContestService } from "../services/api";

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
