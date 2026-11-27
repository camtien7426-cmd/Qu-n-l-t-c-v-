// Bộ biểu tượng SVG nhỏ dùng chung (không cần thư viện ngoài)
function Icon({ children, className = "h-5 w-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const MailIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);
export const LockIcon = (p) => (
  <Icon {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Icon>
);
export const UserIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
  </Icon>
);
export const EyeIcon = (p) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Icon>
);
export const EyeOffIcon = (p) => (
  <Icon {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.2 3.9M6.6 7.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-.9" />
    <path d="M9.9 9.9a2.8 2.8 0 0 0 4.2 3.7" />
  </Icon>
);
export const CameraIcon = (p) => (
  <Icon {...p}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.3a1 1 0 0 0 .8-.4l.9-1.2A1 1 0 0 1 10.3 4h3.4a1 1 0 0 1 .8.4l.9 1.2a1 1 0 0 0 .8.4h1.3A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5Z" />
    <circle cx="12" cy="12.5" r="3.3" />
  </Icon>
);
export const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
export const AlertIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5 2.8 19.5a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5Z" />
    <path d="M12 10v4.2M12 17.4v.1" />
  </Icon>
);
export const InfoIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.1" />
  </Icon>
);
export const CheckCircleIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.3 2.8 2.8L16.2 9.5" />
  </Icon>
);
export const LogoutIcon = (p) => (
  <Icon {...p}>
    <path d="M14 4.5h3.5A2.5 2.5 0 0 1 20 7v10a2.5 2.5 0 0 1-2.5 2.5H14" />
    <path d="M10 8 6 12l4 4M6 12h10" />
  </Icon>
);
export const FolderIcon = (p) => (
  <Icon {...p}>
    <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.2a1 1 0 0 1 .8.4l1.2 1.6a1 1 0 0 0 .8.4H18A2.5 2.5 0 0 1 20.5 10v7A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17Z" />
  </Icon>
);
export const PlusIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const ChevronDownIcon = (p) => (
  <Icon {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Icon>
);
export const ArrowLeftIcon = (p) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);
export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l.8 11.2a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8L17.5 7" />
  </Icon>
);
export const ShieldIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6Z" />
    <path d="m9 12 2.2 2.2L15.2 10" />
  </Icon>
);
