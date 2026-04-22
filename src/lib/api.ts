import { readAdminSession } from "@/lib/auth";

const API_BASE = "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const session = readAdminSession();
    if (session?.token) {
      headers.set("Authorization", `Bearer ${session.token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload
      ? String((payload as { error?: unknown }).error || "Request failed")
      : typeof payload === "string" && payload
        ? payload
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "active" | "past";
  attendees: number;
  image_url?: string | null;
  registration_link?: string | null;
  registration_type?: "paid" | "unpaid";
  payment_qr_url?: string | null;
  payment_instructions?: string | null;
  participation_type?: "solo" | "team";
  team_min_members?: number | null;
  team_max_members?: number | null;
  team_enforce_details?: boolean | null;
  form_fields?: Array<{
    id: string;
    label: string;
    type: string;
    enabled: boolean;
    required: boolean;
  }> | null;
  created_at: string;
  updated_at: string;
  registration_open?: boolean;
  hide_registration_count?: boolean;
}

export interface WinnerRecord {
  id: string;
  event_id: string;
  player_name: string;
  team_name: string | null;
  rank: number;
  image_url: string | null;
  team_members: string | null;
  created_at: string;
  updated_at: string;
  registration_open?: boolean;
  hide_registration_count?: boolean;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

export type RegistrationInput = Record<string, any>;

export interface RegistrationRecord {
  id: string;
  event_id: string;
  created_at: string;
  [key: string]: any;
}

export interface AdminSession {
  email: string;
  created_at: string;
  token: string;
  expires_at: string;
}

export async function fetchEvents(): Promise<EventRecord[]> {
  return apiRequest<EventRecord[]>("/events", { method: "GET", auth: false });
}

export async function saveEvent(
  event: Partial<EventRecord> & {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    status: EventRecord["status"];
    attendees: number;
  },
  id?: string
): Promise<void> {
  await apiRequest<{ ok: true }>("/events", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify({ ...event, id }),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await apiRequest<{ ok: true }>(`/events?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchWinners(): Promise<WinnerRecord[]> {
  return apiRequest<WinnerRecord[]>("/winners", { method: "GET", auth: false });
}

export async function saveWinner(
  winner: Partial<WinnerRecord> & {
    event_id: string;
    player_name: string;
    team_name: string | null;
    rank: number;
    image_url: string | null;
    team_members: string | null;
  },
  id?: string
): Promise<void> {
  await apiRequest<{ ok: true }>("/winners", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify({ ...winner, id }),
  });
}

export async function deleteWinner(id: string): Promise<void> {
  await apiRequest<{ ok: true }>(`/winners?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function submitContactMessage(input: ContactMessageInput): Promise<void> {
  await apiRequest<{ ok: true }>("/contact_messages", {
    method: "POST",
    auth: false,
    body: JSON.stringify(input),
  });
}

export async function submitRegistration(input: RegistrationInput): Promise<void> {
  await apiRequest<{ ok: true }>("/registrations", {
    method: "POST",
    auth: false,
    body: JSON.stringify(input),
  });
}

export async function fetchRegistrations(eventId?: string): Promise<RegistrationRecord[]> {
  const url = eventId ? `/registrations?event_id=${encodeURIComponent(eventId)}` : "/registrations";
  return apiRequest<RegistrationRecord[]>(url, { method: "GET" });
}

export async function deleteRegistration(id: string): Promise<void> {
  await apiRequest<{ ok: true }>(`/registrations?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function updateRegistration(id: string, data: Record<string, unknown>): Promise<void> {
  await apiRequest<{ ok: true }>("/registrations", {
    method: "PUT",
    body: JSON.stringify({ ...data, id }),
  });
}

export async function fetchRegistrationCount(eventId: string): Promise<number> {
  try {
    const res = await fetch(`/api/registrations?count=1&event_id=${encodeURIComponent(eventId)}`);
    if (!res.ok) return 0;
    const data = await res.json() as { count: number };
    return data.count ?? 0;
  } catch {
    return 0;
  }
}


export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  return apiRequest<AdminSession>("/auth", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export async function loadAdminSession(): Promise<AdminSession | null> {
  try {
    return await apiRequest<AdminSession>("/auth", {
      method: "GET",
    });
  } catch {
    return null;
  }
}
