import React from 'react';

// A selection of icons used in the app. Add more as needed.
// To get the path data, find the icon on lucide.dev, click "Copy SVG", and extract the <path> or other shape data.
const ICONS: Record<string, React.ReactNode> = {
  'alert-triangle': <><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  'archive': <><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></>,
  'bar-chart-2': <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  'bell': <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  'boxes': <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
  'calendar': <><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  'cake-slice': <path d="M11.84 10.51 16.2 6.15a2.42 2.42 0 0 1 3.42 0 2.42 2.42 0 0 1 0 3.42l-4.36 4.36" />,
  'check': <path d="M20 6 9 17l-5-5" />,
  'check-circle': <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'clipboard-kanban': <><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 14h.01" /></>,
  'clipboard-list': <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></>,
  'list': <><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></>,
  'map-pin': <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  'menu': <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  'message-square': <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  'minus': <path d="M5 12h14" />,
  'pencil': <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>,
  'play-circle': <><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></>,
  'plus': <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  'plus-circle': <><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></>,
  'refresh-cw': <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></>,
  'rotate-ccw': <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
  'settings': <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0 2l.15.08a2 2 0 0 0 .73-2.73l.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>,
  'shopping-cart': <><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.15" /></>,
  'star': <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  'store': <><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7" /></>,
  'thermometer': <><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" /></>,
  'thermometer-snowflake': <><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" /><path d="M22 12h-3" /><path d="M2 20v-3" /><path d="M20 4v3" /><path d="m22 7-3 3" /><path d="M2 13l3 3" /><path d="M5 4l-3 3" /></>,
  'thermometer-sun': <><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" /><path d="M4 11H2" /><path d="M10 11H8" /><path d="M22 11h-2" /><path d="M16 11h-2" /><path d="M19 8a3 3 0 0 0-6 0" /><path d="M19.3 4.7a3 3 0 0 0-4.25-4.25" /></>,
  'trash-2': <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
  'volume-2': <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>,
  'volume-x': <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="22" x2="16" y1="9" y2="15" /><line x1="16" x2="22" y1="9" y2="15" /></>,
  'whatsapp': <path fillRule="evenodd" d="M18.4,6.4C16.5,4.4,14,3.4,11.5,3.4C6.5,3.4,2.5,7.4,2.5,12.4c0,1.7,0.5,3.4,1.3,4.9L2.5,21.5l4.3-1.3c1.5,0.8,3.1,1.2,4.8,1.2h0c5,0,9-4,9-9C20.6,9.9,19.6,7.5,18.4,6.4z M11.5,19.9c-1.5,0-3-0.4-4.3-1.2l-0.3-0.2l-3.2,1l1-3.1l-0.2-0.3c-0.8-1.3-1.3-2.8-1.3-4.4c0-4.1,3.3-7.4,7.4-7.4c2,0,3.9,0.8,5.3,2.2c1.4,1.4,2.2,3.3,2.2,5.3C18.9,16.5,15.6,19.9,11.5,19.9z M15.5,13.6c-0.2-0.1-1.3-0.6-1.5-0.7c-0.2-0.1-0.3-0.1-0.5,0.1c-0.2,0.2-0.6,0.7-0.7,0.8c-0.1,0.2-0.2,0.2-0.4,0.1c-0.2-0.1-0.8-0.3-1.6-1c-0.6-0.5-1-1.2-1.2-1.4c-0.1-0.2,0-0.3,0.1-0.4c0.1-0.1,0.2-0.2,0.3-0.3c0.1-0.1,0.1-0.2,0.2-0.4c0.1-0.2,0-0.3,0-0.4c-0.1-0.1-0.5-1.1-0.6-1.5c-0.2-0.4-0.3-0.4-0.5-0.4h-0.4c-0.2,0-0.4,0.1-0.6,0.3c-0.2,0.2-0.7,0.7-0.7,1.6c0,1,0.7,1.9,0.8,2c0.1,0.1,1.3,2,3.2,2.8c0.4,0.2,0.8,0.3,1.1,0.4c0.5,0.2,1,0.1,1.3,0.1c0.4-0.1,1.3-0.5,1.5-1c0.2-0.4,0.2-0.8,0.1-0.9C15.9,13.8,15.7,13.7,15.5,13.6z" />,
  // FIX: Wrapped multiple path elements in a React Fragment (<>...</>) to create a single valid JSX element.
  'x': <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
};

interface IconProps {
    name: keyof typeof ICONS;
    className?: string;
    size?: number;
    title?: string;
}

const Icon: React.FC<IconProps> = ({ name, className = '', size = 24, title }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {title && <title>{title}</title>}
            {ICONS[name]}
        </svg>
    );
};

export default Icon;