// Maps Supabase auth error codes / messages to warm, human-readable copy.
// Never expose raw provider errors to end users.

export type AuthErrorKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_already_registered"
  | "rate_limited"
  | "weak_password"
  | "same_password"
  | "user_not_found"
  | "network"
  | "unknown";

export interface FriendlyAuthError {
  kind: AuthErrorKind;
  message: string;
  hint?: string;
}

export function toFriendlyAuthError(err: unknown): FriendlyAuthError {
  const raw =
    (err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err ?? "")
    ).toLowerCase();

  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code ?? "").toLowerCase()
      : "";

  const has = (needle: string) => raw.includes(needle) || code.includes(needle);

  if (has("invalid login") || has("invalid_credentials") || has("invalid credentials")) {
    return {
      kind: "invalid_credentials",
      message: "That email and password don't match.",
      hint: "Double-check your details, or reset your password if you've forgotten it.",
    };
  }
  if (has("email not confirmed") || has("email_not_confirmed")) {
    return {
      kind: "email_not_confirmed",
      message: "Your email hasn't been verified yet.",
      hint: "Check your inbox for the verification link — we can resend it if you need.",
    };
  }
  if (has("already registered") || has("user_already_exists") || has("user already registered")) {
    return {
      kind: "user_already_registered",
      message: "An account with this email already exists.",
      hint: "Try signing in instead, or reset your password if you've forgotten it.",
    };
  }
  if (has("over_email_send_rate_limit") || has("rate limit") || has("too many requests")) {
    return {
      kind: "rate_limited",
      message: "You've made a few too many attempts in a short time.",
      hint: "Please wait a minute or two and try again.",
    };
  }
  if (has("weak_password") || has("password should be")) {
    return {
      kind: "weak_password",
      message: "That password is a bit too weak.",
      hint: "Try 8+ characters with a mix of upper, lower case, and a number.",
    };
  }
  if (has("same_password") || has("new password should be different")) {
    return {
      kind: "same_password",
      message: "Please choose a password that's different from your current one.",
    };
  }
  if (has("user not found") || has("user_not_found")) {
    return {
      kind: "user_not_found",
      message: "We couldn't find an account with that email address.",
      hint: "Want to create one instead?",
    };
  }
  if (has("failed to fetch") || has("network")) {
    return {
      kind: "network",
      message: "We couldn't reach our servers.",
      hint: "Check your connection and try again.",
    };
  }

  return {
    kind: "unknown",
    message: "Something went wrong on our end.",
    hint: "Please try again in a moment.",
  };
}
