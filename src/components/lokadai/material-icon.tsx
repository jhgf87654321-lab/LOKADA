"use client";

import React from 'react';

// Icon name to SVG path mapping for commonly used icons
const iconPaths: Record<string, string> = {
  // Navigation
  'arrow_back': 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  'close': 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  'open_in_new': 'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',

  // Image & Media
  'image': 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  'collections': 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z',
  'visibility': 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  'delete': 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  'zoom_in': 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',

  // Communication
  'send': 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
  'mic': 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',

  // Action
  'upload': 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
  'search': 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  'download': 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  'share': 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
  'rocket_launch': 'M12 2.5c-1.93 0-3.5 1.57-3.5 3.5v1c0 1.93 1.57 3.5 3.5 3.5h1v1.5c0 .8.65 1.45 1.45 1.45.34 0 .65-.12.89-.35l2.3-2.3c.47-.47 1.26-.33 1.55.28.33.69.52 1.46.52 2.27V19c0 1.1.9 2 2 2h1v1.5c0 .8.65 1.45 1.45 1.45.34 0 .65-.12.89-.35l2.3-2.3c.47-.47.33-1.26-.28-1.55-.7-.38-1.49-.59-2.32-.59-.83 0-1.62.21-2.32.59-.61.29-.75.87-.45 1.36l.45.73c.16.26.16.6 0 .86l-2.3 2.3c-.24.24-.58.3-.89.16-.83-.37-1.78-.57-2.77-.57-.99 0-1.94.2-2.77.57-.31.14-.65.08-.89-.16l-2.3-2.3c-.16-.26-.16-.6 0-.86l.45-.73c.29-.49.16-1.07-.45-1.36-.7-.38-1.49-.59-2.32-.59-.83 0-1.62.21-2.32.59-.61.29-.75.87-.45 1.36l.45.73c.16.26.16.6 0 .86l-2.3 2.3c-.24.24-.58.3-.89.16-.83-.37-1.78-.57-2.77-.57-.99 0-1.94.2-2.77.57-.31.14-.65.08-.89-.16l-2.3-2.3c-.16-.26-.16-.6 0-.86l2.3-2.3c.24-.24.3-.58.16-.89C2.2 13.5 2 12.55 2 11.56c0-.99.2-1.94.57-2.77.14-.31.08-.65-.16-.89l-2.3-2.3c-.23-.23-.35-.55-.35-.89 0-.8.65-1.45 1.45-1.45V8h1c0-1.93 1.57-3.5 3.5-3.5h1c.8 0 1.45-.65 1.45-1.45 0-.34-.12-.65-.35-.89l-2.3-2.3c-.47-.47-.33-1.26.28-1.55.69-.33 1.46-.52 2.27-.52.83 0 1.62.21 2.32.59.49.29 1.07.16 1.36-.45l.45-.73c.26-.16.6-.16.86 0l2.3 2.3c.24.24.3.58.16.89-.37.83-.57 1.78-.57 2.77 0 .99.2 1.94.57 2.77.14.31.08.65-.16.89l-2.3 2.3c-.26.16-.26.6 0 .86l.73.45c.49.29 1.07.16 1.36-.45.38-.7.59-1.49.59-2.32 0-.83-.21-1.62-.59-2.32-.29-.49-.16-1.07.45-1.36l.73-.45c.26-.16.6-.16.86 0l2.3 2.3c.24.24.3.58.16.89z',
  'library_add': 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z',
  'check_circle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',

  // Places
  'calendar_today': 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z',

  // Social
  'person': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  'smart_toy': 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
  'unfold_more': 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
};

interface MaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export function MaterialIcon({ name, className = '', filled = false }: MaterialIconProps) {
  const path = iconPaths[name];

  if (!path) {
    // Return a fallback span with the icon name
    return (
      <span className={`material-symbols-outlined ${className}`} style={{ fontSize: 'inherit' }}>
        {name}
      </span>
    );
  }

  return (
    <svg
      className={`material-symbols-outlined ${className}`}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );
}

// Pre-configured icon components for convenience
export const IconArrowBack = (props: { className?: string }) => <MaterialIcon name="arrow_back" className={props.className} />;
export const IconClose = (props: { className?: string }) => <MaterialIcon name="close" className={props.className} />;
export const IconImage = (props: { className?: string }) => <MaterialIcon name="image" className={props.className} />;
export const IconCollections = (props: { className?: string }) => <MaterialIcon name="collections" className={props.className} />;
export const IconVisibility = (props: { className?: string }) => <MaterialIcon name="visibility" className={props.className} />;
export const IconDelete = (props: { className?: string }) => <MaterialIcon name="delete" className={props.className} />;
export const IconZoomIn = (props: { className?: string }) => <MaterialIcon name="zoom_in" className={props.className} />;
export const IconSend = (props: { className?: string }) => <MaterialIcon name="send" className={props.className} />;
export const IconMic = (props: { className?: string }) => <MaterialIcon name="mic" className={props.className} />;
export const IconUpload = (props: { className?: string }) => <MaterialIcon name="upload" className={props.className} />;
export const IconSearch = (props: { className?: string }) => <MaterialIcon name="search" className={props.className} />;
export const IconDownload = (props: { className?: string }) => <MaterialIcon name="download" className={props.className} />;
export const IconShare = (props: { className?: string }) => <MaterialIcon name="share" className={props.className} />;
export const IconRocketLaunch = (props: { className?: string }) => <MaterialIcon name="rocket_launch" className={props.className} />;
export const IconLibraryAdd = (props: { className?: string }) => <MaterialIcon name="library_add" className={props.className} />;
export const IconCheckCircle = (props: { className?: string }) => <MaterialIcon name="check_circle" className={props.className} />;
export const IconCalendarToday = (props: { className?: string }) => <MaterialIcon name="calendar_today" className={props.className} />;
export const IconPerson = (props: { className?: string }) => <MaterialIcon name="person" className={props.className} />;
export const IconSmartToy = (props: { className?: string }) => <MaterialIcon name="smart_toy" className={props.className} />;
export const IconUnfoldMore = (props: { className?: string }) => <MaterialIcon name="unfold_more" className={props.className} />;

// Namespace export for convenience
export const Icons = {
  ArrowBack: IconArrowBack,
  Close: IconClose,
  Image: IconImage,
  Collections: IconCollections,
  Visibility: IconVisibility,
  Delete: IconDelete,
  ZoomIn: IconZoomIn,
  Send: IconSend,
  Mic: IconMic,
  Upload: IconUpload,
  Search: IconSearch,
  Download: IconDownload,
  Share: IconShare,
  RocketLaunch: IconRocketLaunch,
  LibraryAdd: IconLibraryAdd,
  CheckCircle: IconCheckCircle,
  CalendarToday: IconCalendarToday,
  Person: IconPerson,
  SmartToy: IconSmartToy,
  UnfoldMore: IconUnfoldMore,
};
