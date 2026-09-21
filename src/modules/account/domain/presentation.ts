export function profileDisplayName(input: {
  displayName?: string | null;
  email: string;
}): string {
  const name = input.displayName?.trim();
  return name || input.email;
}

export function profileAvatarInitial(displayName: string | null | undefined): string | null {
  const name = displayName?.trim();
  if (!name) {
    return null;
  }
  return name.charAt(0).toLocaleUpperCase();
}

export function resolveAvatarPresentation(input: {
  avatarUrl?: string | null;
  displayName?: string | null;
}): "image" | "initial" | "icon" {
  if (input.avatarUrl) {
    return "image";
  }
  return profileAvatarInitial(input.displayName) ? "initial" : "icon";
}

export function isOwnedAvatarPath(input: {
  kind: "customers" | "admins";
  ownerId: string;
  objectPath: string;
}): boolean {
  return input.objectPath.startsWith(`${input.kind}/${input.ownerId}/`);
}

export function resolveCustomerHeaderSession(input: {
  signedIn: boolean;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}) {
  if (!input.signedIn || !input.email) {
    return {
      signedIn: false,
      caption: null,
      avatarMode: "icon" as const,
      showLogout: false,
      profileHref: null,
    };
  }

  return {
    signedIn: true,
    caption: profileDisplayName({ displayName: input.displayName, email: input.email }),
    avatarMode: resolveAvatarPresentation({
      avatarUrl: input.avatarUrl,
      displayName: input.displayName,
    }),
    showLogout: true,
    profileHref: "/cuenta",
  };
}

export function resolveAdminHeaderSession(input: {
  displayName?: string | null;
  email: string;
  avatarUrl?: string | null;
}) {
  return {
    caption: profileDisplayName(input),
    avatarMode: resolveAvatarPresentation({
      avatarUrl: input.avatarUrl,
      displayName: input.displayName,
    }),
    showLogout: true,
    profileHref: "/admin/profile",
  };
}

export type SessionIdentityClientProps = {
  variant: "customer" | "admin";
  displayName: string;
  avatarUrl: string | null;
  profileHref: string;
  profileLabel: string;
  signOutLabel: string;
  menuLabel: string;
};

const SESSION_IDENTITY_KEYS = [
  "variant",
  "displayName",
  "avatarUrl",
  "profileHref",
  "profileLabel",
  "signOutLabel",
  "menuLabel",
] as const;

export function toSessionIdentityClientProps(input: SessionIdentityClientProps): SessionIdentityClientProps {
  return {
    variant: input.variant,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    profileHref: input.profileHref,
    profileLabel: input.profileLabel,
    signOutLabel: input.signOutLabel,
    menuLabel: input.menuLabel,
  };
}

export function sessionIdentityClientPropKeys(input: Record<string, unknown>): string[] {
  return Object.keys(input).sort();
}

export function isSerializableSessionIdentityProps(input: Record<string, unknown>): boolean {
  const keys = Object.keys(input);
  if (keys.some((key) => !SESSION_IDENTITY_KEYS.includes(key as (typeof SESSION_IDENTITY_KEYS)[number]))) {
    return false;
  }
  return SESSION_IDENTITY_KEYS.every((key) => {
    const value = input[key];
    if (key === "avatarUrl") {
      return value === null || typeof value === "string";
    }
    return typeof value === "string";
  });
}

export function applyProfileFields(input: {
  displayName?: string | null;
  phone?: string | null;
  avatarPath?: string | null;
}) {
  return {
    displayName: input.displayName?.trim() || null,
    phone: input.phone?.trim() || null,
    avatarPath: input.avatarPath ?? null,
  };
}
